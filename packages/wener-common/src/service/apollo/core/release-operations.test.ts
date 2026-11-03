import { describe, expect, it } from 'vitest';
import { ApolloConnectionConfigSchema } from './config';
import { createApolloService } from './createApolloService';
import { ApolloServiceErrorCodes } from './errors';

type Fixture = {
	format?: string;
	items: Array<{ key: string; value: string; by?: string; modified?: boolean; deleted?: boolean }>;
	release?: Record<string, string>;
	permission?: boolean;
	beforeNamespaceRead?: () => void;
};

function createPortal(fixture: Fixture) {
	const base = '/apps/SampleApp/envs/DEV/clusters/default/namespaces/ns';
	const requests: Array<{ method: string; path: string; body?: unknown }> = [];
	const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
		const url = new URL(String(input));
		const method = init.method ?? 'GET';
		requests.push({ method, path: url.pathname, body: init.body ? JSON.parse(String(init.body)) : undefined });
		if (method === 'GET' && url.pathname === base) {
			fixture.beforeNamespaceRead?.();
			return Response.json({
				baseInfo: { id: 1 },
				format: fixture.format ?? 'properties',
				items: [
					{ item: { key: '', value: '', comment: '# comment line' } },
					...fixture.items.map((item) => ({
						item: { key: item.key, value: item.value, dataChangeLastModifiedBy: item.by },
						isModified: item.modified === true,
						isDeleted: item.deleted === true,
					})),
				],
			});
		}
		if (method === 'GET' && url.pathname === `${base}/releases/active`) {
			return Response.json(
				fixture.release
					? [{ id: 9, name: 'r9', dataChangeCreatedBy: 'alice', configurations: JSON.stringify(fixture.release) }]
					: [],
			);
		}
		if (method === 'GET' && url.pathname === '/user') return Response.json({ userId: 'operator' });
		if (method === 'GET' && url.pathname.includes('/ns_permissions/')) return Response.json({}, { status: 404 });
		if (method === 'GET' && url.pathname.includes('/permissions/')) {
			return Response.json({ hasPermission: fixture.permission ?? true });
		}
		if (method === 'POST' && url.pathname === `${base}/releases`) return Response.json({ id: 10, name: 'r10' });
		return Response.json({ message: 'unexpected' }, { status: 404 });
	}) as typeof globalThis.fetch;
	const config = ApolloConnectionConfigSchema.parse({
		readOnly: false,
		appId: 'SampleApp',
		cluster: 'default',
		env: 'DEV',
		namespace: 'ns',
		config: { baseUrl: 'http://config.test' },
		admin: { baseUrl: 'http://portal.test' },
		portal: { baseUrl: 'http://portal.test', auth: { type: 'basic', username: 'operator', password: 'portal-secret' } },
	});
	return { requests, service: createApolloService(config, { fetch }) };
}

const propertiesFixture: Fixture = {
	items: [
		{ key: 'timeout', value: '5000', by: 'operator', modified: true },
		{ key: 'keep', value: 'same' },
		{ key: 'fresh', value: 'new', by: 'bob', modified: true },
		{ key: 'legacy', value: 'old', by: 'bob', deleted: true },
	],
	release: { timeout: '3000', keep: 'same', legacy: 'old' },
};

describe('Apollo working copy vs latest release', () => {
	it('diffs properties by key with modifiers, using only Portal GETs', async () => {
		const { requests, service } = createPortal(propertiesFixture);
		await expect(service.diffNamespaceRelease()).resolves.toEqual({
			ok: true,
			appId: 'SampleApp',
			env: 'DEV',
			cluster: 'default',
			namespace: 'ns',
			format: 'properties',
			baseRelease: { id: 9, name: 'r9', releasedBy: 'alice' },
			// Original Node SHA256 hex protocol for release 9 and the sorted draft, truncated to 12 digits.
			fingerprint: '43d6331739d5',
			count: 3,
			modifiedBy: ['operator', 'bob'],
			changes: [
				{ key: 'timeout', op: 'update', oldValue: '3000', newValue: '5000', modifiedBy: 'operator' },
				{ key: 'fresh', op: 'create', newValue: 'new', modifiedBy: 'bob' },
				{ key: 'legacy', op: 'delete', oldValue: 'old', modifiedBy: 'bob' },
			],
		});
		expect(requests.every((request) => request.method === 'GET')).toBe(true);
	});

	it('diffs yaml by path against an empty first release', async () => {
		const { service } = createPortal({
			format: 'yaml',
			items: [{ key: 'content', value: 'server:\n  otel:\n    enabled: true\n', by: 'operator', modified: true }],
		});
		await expect(service.diffNamespaceRelease()).resolves.toMatchObject({
			baseRelease: null,
			changes: [{ key: 'server.otel.enabled', op: 'create', newValue: true, modifiedBy: 'operator' }],
		});
	});

	it('reports no pending changes for diff and publish without writing', async () => {
		const clean = createPortal({ items: [{ key: 'keep', value: 'same' }], release: { keep: 'same' } });
		await expect(clean.service.diffNamespaceRelease()).resolves.toMatchObject({
			count: 0,
			changes: [],
			message: 'no unpublished changes in ns',
		});
		await expect(clean.service.publishNamespaceRelease()).resolves.toMatchObject({
			count: 0,
			published: false,
			message: 'no unpublished changes in ns; nothing to publish',
		});
		expect(clean.requests.some((request) => request.method !== 'GET')).toBe(false);
	});

	it('dry-run shows the diff, release permission and other people’s changes without publishing', async () => {
		const { requests, service } = createPortal({ ...propertiesFixture, permission: false });
		const result = await service.publishNamespaceRelease({ dryRun: true });
		expect(result).toMatchObject({
			dryRun: true,
			published: false,
			count: 3,
			permission: { user: 'operator', release: false },
			warnings: [
				'portal user lacks ReleaseNamespace; publish would be rejected',
				'includes unpublished changes by bob',
			],
		});
		expect(requests.some((request) => request.method !== 'GET')).toBe(false);
	});

	it('publishes through the Portal with title and comment, and refuses when release permission is missing', async () => {
		const { requests, service } = createPortal(propertiesFixture);
		await expect(service.publishNamespaceRelease({ title: 'otel', comment: 'dev verify' })).resolves.toMatchObject({
			dryRun: false,
			published: true,
			count: 3,
			release: { id: 10 },
		});
		expect(requests.filter((request) => request.method !== 'GET')).toEqual([
			{
				method: 'POST',
				path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/ns/releases',
				body: { releaseTitle: 'otel', releaseComment: 'dev verify', isEmergencyPublish: false },
			},
		]);
		expect(requests.filter((request) => request.path.endsWith('/releases/active'))).toHaveLength(2);
		const stale = createPortal(propertiesFixture);
		await expect(stale.service.publishNamespaceRelease({ ifMatch: '000000000000' })).rejects.toMatchObject({
			state: 'fingerprint-mismatch',
		});
		expect(stale.requests.some((request) => request.method !== 'GET')).toBe(false);
		const preview = (await createPortal(propertiesFixture).service.diffNamespaceRelease()) as { fingerprint: string };
		await expect(
			createPortal(propertiesFixture).service.publishNamespaceRelease({ ifMatch: preview.fingerprint }),
		).resolves.toMatchObject({ published: true });
		const denied = createPortal({ ...propertiesFixture, permission: false });
		await expect(denied.service.publishNamespaceRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.PermissionDenied,
			state: 'permission-precheck',
		});
		expect(denied.requests.some((request) => request.method !== 'GET')).toBe(false);
	});

	it('rejects a changed draft at the second fingerprint check before publishing', async () => {
		let reads = 0;
		const fixture: Fixture = {
			...propertiesFixture,
			items: propertiesFixture.items.map((item) => ({ ...item })),
			beforeNamespaceRead: () => {
				if (++reads === 2) fixture.items[0]!.value = '6000';
			},
		};
		const { service, requests } = createPortal(fixture);
		await expect(service.publishNamespaceRelease({ ifMatch: '43d6331739d5' })).rejects.toMatchObject({
			state: 'fingerprint-mismatch',
			message: expect.stringContaining('while preparing the publish'),
		});
		expect(reads).toBe(2);
		expect(requests.some((request) => request.method !== 'GET')).toBe(false);
	});
});
