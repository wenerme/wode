import Ajv2020 from 'ajv/dist/2020.js';
import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createFeishuServiceToolClient } from './cli/client';
import { FeishuServiceProvider } from './index';

const envs: Record<string, string> = { FEISHU_APP_ID: 'cli_fixture', FEISHU_APP_SECRET: 'fixture-secret' };

function fixture({ readOnly = true, credentials = true, api }: { readOnly?: boolean; credentials?: boolean; api?: (url: URL, init: RequestInit) => Response } = {}) {
	const getEnv = vi.fn((name: string) => envs[name]);
	const fetch = vi.fn<FetchLike>(async (input, init = {}) => {
		const url = new URL(String(input));
		if (url.pathname.endsWith('tenant_access_token/internal')) return Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 });
		return api ? api(url, init) : Response.json({ code: 0, data: {} });
	});
	const options = credentials ? { appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' } : { webhookUrlEnv: 'FEISHU_WEBHOOK_URL' };
	const runtime = createServiceRuntime({
		context: { services: normalizeCliServices([{ name: 'default', type: 'feishu', readOnly, options }]) },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(FeishuServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	const call = (toolName: string, input: unknown) => runtime.call({ params: { service: 'default' }, body: { toolName, input } });
	return { runtime, call, fetch, getEnv };
}

describe('Feishu generic API layer', () => {
	it('lists catalog APIs with filters and availability without credentials or HTTP', async () => {
		const test = fixture();
		const reads = (await test.call('listApi', { service: 'im', risk: 'read' })) as { items: Array<Record<string, unknown>>; total: number };
		expect(reads.total).toBe(reads.items.length);
		expect(reads.items.length).toBeGreaterThan(0);
		expect(reads.items.every((item) => item.service === 'im' && item.risk === 'read' && item.available === true)).toBe(true);
		expect(reads.items.map((item) => item.id)).toContain('im.chats.get');

		const hidden = (await test.call('listApi', { service: 'approval' })) as { items: unknown[] };
		expect(hidden.items).toEqual([]);
		const all = (await test.call('listApi', { service: 'approval', includeUnavailable: true })) as { items: Array<Record<string, unknown>> };
		expect(all.items.length).toBeGreaterThan(0);
		expect(all.items[0]).toMatchObject({ available: false, unavailableReason: expect.stringContaining('user access token') });

		const multipart = (await test.call('listApi', { query: 'im.images.create', includeUnavailable: true })) as { items: Array<Record<string, unknown>> };
		expect(multipart.items).toEqual([expect.objectContaining({ id: 'im.images.create', available: false, unavailableReason: expect.stringContaining('Multipart') })]);
		const search = (await test.call('listApi', { query: 'PINS' })) as { items: Array<{ id: string }> };
		expect(search.items.map((item) => item.id)).toEqual(expect.arrayContaining(['im.pins.list', 'im.pins.create']));
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('describes APIs with JSON Schemas that compile with AJV', async () => {
		const test = fixture();
		const ajv = new Ajv2020({ strict: false, allowUnionTypes: true });
		for (const id of ['im.chats.get', 'im.pins.create', 'im.pins.list', 'im.messages.delete']) {
			const described = (await test.call('describeApi', { id })) as { id: string; schemas: Record<string, object> };
			expect(described.id).toBe(id);
			for (const schema of Object.values(described.schemas)) expect(ajv.compile(schema)).toBeTypeOf('function');
		}
		const chat = (await test.call('describeApi', { id: 'im.chats.get' })) as { schemas: Record<string, object> };
		expect(Object.keys(chat.schemas).sort()).toEqual(['pathParams', 'query', 'response']);
		expect(ajv.compile(chat.schemas.pathParams!)({ chat_id: 'oc_1' })).toBe(true);
		await expect(test.call('describeApi', { id: 'im.nothing.here' })).rejects.toThrow('Unknown Feishu API');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('calls read APIs on a read-only service and returns the data payload', async () => {
		const test = fixture({
			api: (url) => {
				expect(url.pathname).toBe('/open-apis/im/v1/chats/oc_1');
				expect(url.searchParams.get('user_id_type')).toBe('open_id');
				return Response.json({ code: 0, msg: 'success', data: { name: 'Team', future: { kept: true } } });
			},
		});
		await expect(test.call('callReadApi', { id: 'im.chats.get', path: { chat_id: 'oc_1' }, query: { user_id_type: 'open_id' } }))
			.resolves.toEqual({ id: 'im.chats.get', data: { name: 'Team', future: { kept: true } } });
		const [, init] = test.fetch.mock.calls[1]!;
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.runtime.close();
	});

	it('coerces catalog query types before building the request', async () => {
		const test = fixture({ api: (url) => Response.json({ code: 0, data: { items: [], has_more: false, echo: url.searchParams.get('page_size') } }) });
		await expect(test.call('callReadApi', { id: 'im.pins.list', query: { chat_id: 'oc_1', page_size: '20' } }))
			.resolves.toMatchObject({ data: { echo: '20' } });
		await expect(test.call('callReadApi', { id: 'im.pins.list', query: { chat_id: 'oc_1', page_size: 'many' } }))
			.rejects.toThrow('Invalid query for Feishu API im.pins.list: page_size');
		await test.runtime.close();
	});

	it('callReadApi rejects write ids and callWriteApi rejects read ids', async () => {
		const test = fixture({ readOnly: false });
		await expect(test.call('callReadApi', { id: 'im.pins.create', body: { message_id: 'om_1' } })).rejects.toThrow('use callWriteApi');
		await expect(test.call('callWriteApi', { id: 'im.chats.get', path: { chat_id: 'oc_1' } })).rejects.toThrow('use callReadApi');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('gates callWriteApi on a writable service and high-risk confirmation', async () => {
		const readOnly = fixture();
		await expect(readOnly.call('callWriteApi', { id: 'im.pins.create', body: { message_id: 'om_1' } })).rejects.toThrow('read-only');
		expect(readOnly.fetch).not.toHaveBeenCalled();
		await readOnly.runtime.close();

		const test = fixture({ readOnly: false, api: (url, init) => Response.json({ code: 0, data: { method: init.method, path: url.pathname, body: init.body ? JSON.parse(String(init.body)) : undefined } }) });
		await expect(test.call('callWriteApi', { id: 'im.pins.create', body: { message_id: 'om_1' } })).resolves.toMatchObject({
			data: { method: 'POST', path: '/open-apis/im/v1/pins', body: { message_id: 'om_1' } },
		});
		const fetches = test.fetch.mock.calls.length;
		await expect(test.call('callWriteApi', { id: 'im.messages.delete', path: { message_id: 'om_1' } })).rejects.toThrow('requires confirmHighRisk');
		expect(test.fetch).toHaveBeenCalledTimes(fetches);
		await expect(test.call('callWriteApi', { id: 'im.messages.delete', path: { message_id: 'om_1' }, confirmHighRisk: true }))
			.resolves.toMatchObject({ data: { method: 'DELETE', path: '/open-apis/im/v1/messages/om_1' } });
		await test.runtime.close();
	});

	it('validates path, query and body before credentials or HTTP', async () => {
		const test = fixture({ readOnly: false });
		await expect(test.call('callReadApi', { id: 'im.chats.get' })).rejects.toThrow('Invalid path parameters for Feishu API im.chats.get: chat_id');
		await expect(test.call('callReadApi', { id: 'im.chats.get', path: { chat_id: 'oc_1' }, query: { user_id_type: 'bogus' } }))
			.rejects.toThrow('Invalid query');
		await expect(test.call('callWriteApi', { id: 'im.pins.create', body: {} })).rejects.toThrow('Invalid body for Feishu API im.pins.create: message_id');
		await expect(test.call('callWriteApi', { id: 'im.messages.delete', path: { message_id: 'om_1' }, body: { extra: 1 }, confirmHighRisk: true }))
			.rejects.toThrow('does not accept body');
		await expect(test.call('callReadApi', { id: 'im.chats.get', path: { chat_id: '..' } })).rejects.toThrow('Invalid path parameter');
		await expect(test.call('callReadApi', { id: 'im.unknown.api' })).rejects.toThrow('Unknown Feishu API');
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('rejects user-token-only and multipart APIs with clear errors', async () => {
		const test = fixture({ readOnly: false });
		await expect(test.call('callReadApi', { id: 'approval.tasks.query' })).rejects.toThrow(/user access token/i);
		await expect(test.call('callWriteApi', { id: 'im.images.create', body: {} })).rejects.toThrow('use the curated upload operations');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('dry runs return the built request without credentials or HTTP, even on a read-only service', async () => {
		const test = fixture({ credentials: false });
		await expect(test.call('callWriteApi', { id: 'im.messages.delete', path: { message_id: 'om_1' }, dryRun: true })).resolves.toEqual({
			id: 'im.messages.delete', dryRun: true, request: { method: 'DELETE', path: '/open-apis/im/v1/messages/om_1', query: {} },
		});
		await expect(test.call('callReadApi', { id: 'im.pins.list', query: { chat_id: 'oc_1', page_size: 5 }, dryRun: true })).resolves.toMatchObject({
			request: { method: 'GET', path: '/open-apis/im/v1/pins', query: { chat_id: 'oc_1', page_size: '5' } },
		});
		// Validation still applies to dry runs.
		await expect(test.call('callWriteApi', { id: 'im.pins.create', body: {}, dryRun: true })).rejects.toThrow('Invalid body');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('returns data with a schemaWarning when the response does not match', async () => {
		const test = fixture({ api: () => Response.json({ code: 0, data: { name: 42 } }) });
		const result = (await test.call('callReadApi', { id: 'im.chats.get', path: { chat_id: 'oc_1' } })) as Record<string, unknown>;
		expect(result).toMatchObject({ id: 'im.chats.get', data: { name: 42 }, schemaWarning: expect.stringContaining('name') });
		await test.runtime.close();
	});

	it('reports a missing app credential only after validation', async () => {
		const test = fixture({ credentials: false });
		await expect(test.call('callReadApi', { id: 'im.chats.get', path: { chat_id: 'oc_1' } })).rejects.toThrow('requires appIdEnv and appSecretEnv');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('remote client lets dry-run writes through on a read-only client and blocks real writes', async () => {
		const test = fixture({ credentials: false });
		const runtime: ServiceRuntimeClient = { getSchema: (input, options) => test.runtime.getSchema(input, options), call: (input, options) => test.runtime.call(input, options) };
		const client = await createFeishuServiceToolClient(runtime, 'default');
		await expect(client.callWriteApi({ id: 'im.pins.create', body: { message_id: 'om_1' }, dryRun: true })).resolves.toMatchObject({ dryRun: true });
		await expect(client.callWriteApi({ id: 'im.pins.create', body: { message_id: 'om_1' } })).rejects.toMatchObject({ code: 'READ_ONLY' });
		await expect(client.listApi({ service: 'im', risk: 'read' })).resolves.toMatchObject({ total: expect.any(Number) });
		await client.close();
		await test.runtime.close();
	});
});
