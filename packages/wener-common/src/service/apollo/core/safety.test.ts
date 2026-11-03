import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApolloConnectionConfigSchema, ApolloServiceConfigSchema, ApolloServiceOptionsSchema } from './config';
import { createApolloService } from './createApolloService';
import { ApolloServiceErrorCodes } from './errors';
import { createApolloHttpAdapter } from './http-adapter';
import type { IApolloService } from './interface';
import { createApolloTestAdapter } from './adapter.fixture';

const endpoints = {
	config: { baseUrl: 'https://config.example.test/' },
	admin: { baseUrl: 'https://admin.example.test/' },
	portal: { baseUrl: 'https://portal.example.test/' },
};
const options = { ...endpoints, appId: 'SampleApp', operator: 'operator' };

describe('Apollo public configuration', () => {
	it('uses type/options, independent endpoint roles, default read-only, and generated JSON metadata', () => {
		const config = ApolloServiceConfigSchema.parse({ type: 'apollo', options });
		expect(config.readOnly).toBe(true);
		expect(config.options).toMatchObject({
			cluster: 'default',
			namespace: 'application',
			config: { baseUrl: 'https://config.example.test', role: 'config', headers: {} },
			admin: { role: 'admin' },
			portal: { role: 'portal' },
		});
		expect(ApolloServiceOptionsSchema.jsonSchema).toEqual(z.toJSONSchema(ApolloServiceOptionsSchema, { io: 'input' }));
		const schema = ApolloServiceOptionsSchema.jsonSchema;
		expect(schema.properties?.readOnly).toBeUndefined();
		expect(schema.required).toEqual(['config', 'admin', 'portal']);
		expect(schema.properties?.config).toMatchObject({
			properties: { auth: { properties: { appSecret: { type: 'string', 'x-sensitive': true } } } },
		});
		expect(ApolloServiceOptionsSchema.safeParse({ ...options, readOnly: 'false' }).success).toBe(false);
		expect(ApolloServiceOptionsSchema.safeParse({ ...options, type: 'apollo' }).success).toBe(false);
	});

	it.each([
		'file:///config',
		'https://user:password@example.test',
		'https://example.test?token=fixture',
		'https://example.test/#fragment',
	])('rejects unsafe endpoint %s before adapter creation', (baseUrl) => {
		const createAdapter = vi.fn();
		expect(() => createApolloService({ ...options, admin: { baseUrl } }, { createAdapter })).toThrow(
			'Apollo connection config is invalid',
		);
		expect(createAdapter).not.toHaveBeenCalled();
	});
});

const mutations: Array<[string, (service: IApolloService) => unknown]> = [
	['createApp', (service) => service.createApp({ appId: 'Created' })],
	['createAppEnv', (service) => service.createAppEnv({ appId: 'Created' })],
	['updateApp', (service) => service.updateApp({ appId: 'Updated' })],
	['deleteApp', (service) => service.deleteApp({ appId: 'Deleted' })],
	['createCluster', (service) => service.createCluster({ cluster: 'gray' })],
	['deleteCluster', (service) => service.deleteCluster({ cluster: 'gray' })],
	['createNamespace', (service) => service.createNamespace({ namespace: 'created' })],
	['deleteNamespace', (service) => service.deleteNamespace()],
	['createMissingNamespace', (service) => service.createMissingNamespace()],
	['upsertItem', (service) => service.upsertItem({ key: 'key', value: 'value' })],
	['deleteItem', (service) => service.deleteItem({ key: 'key' })],
	['publishRelease', (service) => service.publishRelease()],
	['rollbackRelease', (service) => service.rollbackRelease({ releaseId: '1' })],
	['patchNamespaceItem', (service) => service.patchNamespaceItem({ set: [{ key: 'key', value: 'value' }] })],
	['writeNamespaceText', (service) => service.writeNamespaceText({ configText: 'key=value' })],
	['patchNamespaceDocument', (service) => service.patchNamespaceDocument({ set: [{ path: 'key', value: true }] })],
	['publishNamespaceRelease', (service) => service.publishNamespaceRelease()],
	...['POST', 'PUT', 'PATCH', 'DELETE'].map((method): [string, (service: IApolloService) => unknown] => [
		`request ${method}`,
		(service) => service.request({ path: '/openapi/v1/apps', method: method as 'POST' }),
	]),
	['request inferred POST', (service) => service.request({ path: '/openapi/v1/apps', body: {} })],
];

describe('Apollo mutation admission', () => {
	it.each(mutations)('defaults %s to read-only with no adapter traffic', async (_name, run) => {
		const request = vi.fn(async () => ({}));
		const service = createApolloService(options, {
			createAdapter: () => createApolloTestAdapter({ request, readConfig: vi.fn(), close: vi.fn() }),
		});
		expect(service.readOnly).toBe(true);
		await expect(Promise.resolve().then(() => run(service))).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.InvalidRequest,
			message: 'Apollo service is read-only',
		});
		expect(request).not.toHaveBeenCalled();
	});

	it('defends direct HTTP adapter writes and inferred methods as well', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const adapter = createApolloHttpAdapter(ApolloConnectionConfigSchema.parse(options), { fetch });
		await expect(adapter.request({ role: 'admin', path: '/apps', method: 'POST' })).rejects.toThrow('read-only');
		await expect(adapter.request({ role: 'portal', path: '/apps', body: {} })).rejects.toThrow('read-only');
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('Apollo dry-run HTTP traffic', () => {
	it.each([true, false])('previews all mutations using GET only (readOnly=%s)', async (readOnly) => {
		const methods: string[] = [];
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			const path = new URL(String(input)).pathname;
			methods.push(init?.method ?? 'GET');
			if (path.endsWith('/releases/active'))
				return Response.json([{ id: 1, configurations: '{"content":"key: old\\n"}' }]);
			if (path.endsWith('/items')) return Response.json([{ key: 'key', value: 'old' }]);
			if (path.includes('/permissions/') || path.includes('/ns_permissions/'))
				return Response.json({ hasPermission: true });
			if (path === '/user') return Response.json({ userId: 'operator' });
			return Response.json({
				baseInfo: { id: 1 },
				format: 'yaml',
				items: [{ item: { key: 'content', value: 'key: new\n' } }],
			});
		});
		const service = createApolloService({ ...options, namespace: 'config.yaml', readOnly }, { fetch });
		await service.patchNamespaceItem({ set: [{ key: 'key', value: 'new' }], publish: true, dryRun: true });
		await service.writeNamespaceText({ configText: 'key: new\n', publish: true, dryRun: true });
		await service.patchNamespaceDocument({ set: [{ path: 'key', value: 'updated' }], publish: true, dryRun: true });
		await service.publishNamespaceRelease({ dryRun: true });
		expect(methods.length).toBeGreaterThan(0);
		expect(new Set(methods)).toEqual(new Set(['GET']));
	});

	it.each([true, false])('authenticates dry-run reads without configuration writes (readOnly=%s)', async (readOnly) => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			const path = new URL(String(input)).pathname;
			if (path === '/signin') {
				expect(init?.method).toBe('POST');
				expect(String(init?.body)).toBe('username=operator&password=fixture-secret');
				return new Response(null, { status: 302, headers: { 'set-cookie': 'session=fixture; Path=/; HttpOnly' } });
			}
			if (new Headers(init?.headers).get('cookie') !== 'session=fixture') {
				return new Response(null, { status: 302, headers: { location: '/signin' } });
			}
			if (path.includes('/permissions/') || path.includes('/ns_permissions/')) {
				return Response.json({ hasPermission: true });
			}
			if (path === '/user') return Response.json({ userId: 'operator' });
			return Response.json({ baseInfo: { id: 1 }, format: 'properties', items: [] });
		});
		const service = createApolloService(
			{
				...options,
				readOnly,
				portal: { ...endpoints.portal, auth: { type: 'basic', username: 'operator', password: 'fixture-secret' } },
			},
			{ fetch },
		);
		await expect(service.writeNamespaceText({ configText: 'a=1', dryRun: true })).resolves.toMatchObject({
			ok: true,
			dryRun: true,
			namespaceId: 1,
		});
		expect(fetch.mock.calls.some(([input]) => new URL(String(input)).pathname === '/signin')).toBe(true);
		for (const [input, init] of fetch.mock.calls) {
			expect(init?.method).toBe(new URL(String(input)).pathname === '/signin' ? 'POST' : 'GET');
		}
		expect(fetch.mock.calls[2]?.[1]).toMatchObject({ method: 'GET' });
		expect(new Headers(fetch.mock.calls[2]?.[1]?.headers).get('cookie')).toBe('session=fixture');
		expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', redirect: 'manual' });
	});
});
