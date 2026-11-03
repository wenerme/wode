import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApolloConnectionConfigSchema } from './config';
import { createApolloService } from './createApolloService';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import type { ApolloAdapter, ApolloHttpRequest, IApolloService } from './interface';
import { createApolloTestAdapter } from './test-adapter';

const config = ApolloConnectionConfigSchema.parse({
	type: 'apollo',
	api: 'apollo',
	appId: 'SampleApp',
	cluster: 'default',
	namespace: 'application',
	env: 'DEV',
	operator: 'operator',
	readOnly: false,
	config: { baseUrl: 'http://config.test' },
	admin: { baseUrl: 'http://admin.test' },
	portal: { baseUrl: 'http://portal.test' },
});

let requests: ApolloHttpRequest[];
let service: IApolloService;

function responseFor(input: ApolloHttpRequest): unknown {
	if (input.role === 'portal' && input.path.endsWith('/releases/active')) {
		return [{ id: 7, configurations: '{"timeout":"3000"}' }];
	}
	if (input.role === 'portal' && input.path.endsWith('/namespaces/application')) {
		return { baseInfo: { id: 101 }, format: 'properties', items: [{ item: { key: 'timeout', value: '3000' } }] };
	}
	if (input.role === 'portal' && input.path.endsWith('/namespaces/application/items')) {
		return [{ key: 'timeout', value: '3000' }];
	}
	if (input.role === 'admin' && input.path.endsWith('/namespaces/application/items')) {
		return { content: [{ key: 'timeout', value: '3000' }] };
	}
	return undefined;
}

beforeEach(() => {
	requests = [];
	const adapter: ApolloAdapter = createApolloTestAdapter({
		async request(input) {
			requests.push(input);
			return responseFor(input);
		},
		async readConfig() {
			return { timeout: '3000' };
		},
		close: vi.fn(async () => undefined),
	});
	service = createApolloService(config, { createAdapter: () => adapter });
});

async function expectRequest(
	run: () => Promise<unknown>,
	expected: Pick<ApolloHttpRequest, 'role' | 'path'> & Partial<ApolloHttpRequest>,
): Promise<void> {
	requests = [];
	await run();
	expect(requests).toHaveLength(1);
	expect(requests[0]).toMatchObject({ method: 'GET', ...expected });
}

describe('Apollo business service request mapping', () => {
	it('maps Portal status and discovery methods', async () => {
		await expectRequest(() => service.getStatus(), { role: 'portal', path: '/health' });
		await expectRequest(() => service.listPortalApp(), { role: 'portal', path: '/apps' });
		await expectRequest(() => service.listPortalOrganization(), { role: 'portal', path: '/organizations' });
		await expectRequest(() => service.listPortalEnv(), { role: 'portal', path: '/envs' });
		await expectRequest(() => service.getPortalNavTree(), { role: 'portal', path: '/apps/SampleApp/navtree' });
		await expectRequest(() => service.listPortalNamespace(), {
			role: 'portal',
			path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces',
		});
		await expectRequest(() => service.getPortalNamespace(), {
			role: 'portal',
			path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application',
		});
		await expectRequest(() => service.listPortalItem({ orderBy: 'lineNum' }), {
			role: 'portal',
			path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
			query: { orderBy: 'lineNum' },
		});
		await expectRequest(() => service.listPortalRelease({ page: 1, size: 10 }), {
			role: 'portal',
			path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/active',
			query: { page: 1, size: 10 },
		});
		requests = [];
		await expect(service.getPortalConfig()).resolves.toEqual({ timeout: '3000' });
		expect(requests).toEqual([
			expect.objectContaining({
				role: 'portal',
				method: 'GET',
				path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/active',
				query: { page: 0, size: 1 },
			}),
		]);
	});

	it('maps release history methods', async () => {
		await expectRequest(() => service.listRelease({ page: 2, size: 25 }), {
			role: 'portal',
			path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/all',
			query: { page: 2, size: 25 },
		});
		await expectRequest(() => service.getRelease({ releaseId: '7' }), {
			role: 'portal',
			path: '/envs/DEV/releases/7',
		});
		await expectRequest(() => service.diffRelease({ baseReleaseId: '7', toCompareReleaseId: '8' }), {
			role: 'portal',
			path: '/envs/DEV/releases/compare',
			query: { baseReleaseId: '7', toCompareReleaseId: '8' },
		});
	});

	it('maps app methods and owns app DTO construction', async () => {
		await expectRequest(() => service.listApp({ appIds: ['SampleApp', 'OtherApp'] }), {
			role: 'admin',
			path: '/openapi/v1/apps',
			query: { appIds: 'SampleApp,OtherApp' },
		});
		await expectRequest(() => service.getApp(), { role: 'admin', path: '/openapi/v1/apps/SampleApp' });
		await expectRequest(() => service.listSelfApp({ page: 1, size: 20 }), {
			role: 'admin',
			path: '/openapi/v1/apps/by-self',
			query: { page: 1, size: 20 },
		});
		await expectRequest(() => service.createApp({ appId: 'NewApp', name: 'New App', orgId: 'TEST' }), {
			role: 'admin',
			path: '/openapi/v1/apps',
			method: 'POST',
			body: {
				app: {
					appId: 'NewApp',
					name: 'New App',
					orgId: 'TEST',
					ownerName: 'operator',
					dataChangeCreatedBy: 'operator',
					dataChangeLastModifiedBy: 'operator',
				},
				assignAppRoleToSelf: false,
			},
		});
		await expectRequest(() => service.createAppEnv({ appId: 'NewApp', body: { name: 'New App' } }), {
			role: 'admin',
			path: '/openapi/v1/apps/envs/DEV',
			method: 'POST',
			query: { operator: 'operator' },
			body: { appId: 'NewApp', name: 'New App' },
		});
		await expectRequest(() => service.updateApp({ appId: 'SampleApp', name: 'Updated' }), {
			role: 'admin',
			path: '/openapi/v1/apps/SampleApp',
			method: 'PUT',
			query: { operator: 'operator' },
			body: expect.objectContaining({ appId: 'SampleApp', name: 'Updated', dataChangeLastModifiedBy: 'operator' }),
		});
		await expectRequest(() => service.deleteApp({ appId: 'SampleApp' }), {
			role: 'admin',
			path: '/openapi/v1/apps/SampleApp',
			method: 'DELETE',
			query: { operator: 'operator' },
		});
		await expectRequest(() => service.listMissingAppEnv(), {
			role: 'admin',
			path: '/openapi/v1/apps/SampleApp/miss_envs',
		});
		await expectRequest(() => service.getEnvCluster(), {
			role: 'admin',
			path: '/openapi/v1/apps/SampleApp/envclusters',
		});
	});

	it('maps cluster and namespace methods', async () => {
		const clusterPath = '/openapi/v1/envs/DEV/apps/SampleApp/clusters/default';
		const namespacePath = `${clusterPath}/namespaces/application`;
		await expectRequest(() => service.getCluster(), { role: 'admin', path: clusterPath });
		await expectRequest(() => service.createCluster({ cluster: 'gray' }), {
			role: 'admin',
			path: '/openapi/v1/envs/DEV/apps/SampleApp/clusters',
			method: 'POST',
			body: { appId: 'SampleApp', name: 'gray', dataChangeCreatedBy: 'operator' },
		});
		await expectRequest(() => service.deleteCluster({ cluster: 'gray' }), {
			role: 'admin',
			path: '/openapi/v1/envs/DEV/apps/SampleApp/clusters/gray',
			method: 'DELETE',
			query: { operator: 'operator' },
		});
		await expectRequest(() => service.listNamespace({ fillItemDetail: false, extendInfo: true }), {
			role: 'admin',
			path: `${clusterPath}/namespaces`,
			query: { fillItemDetail: false, extendInfo: true },
		});
		await expectRequest(() => service.getNamespace({ fillItemDetail: true }), {
			role: 'admin',
			path: namespacePath,
			query: { fillItemDetail: true },
		});
		await expectRequest(() => service.getNamespaceLock(), { role: 'admin', path: `${namespacePath}/lock` });
		await expectRequest(() => service.createNamespace({ namespace: 'FX.apollo', format: 'properties' }), {
			role: 'admin',
			path: '/openapi/v1/apps/SampleApp/appnamespaces',
			method: 'POST',
			body: {
				appId: 'SampleApp',
				name: 'FX.apollo',
				format: 'properties',
				isPublic: false,
				dataChangeCreatedBy: 'operator',
			},
		});
		await expectRequest(() => service.deleteNamespace(), {
			role: 'admin',
			path: namespacePath,
			method: 'DELETE',
			query: { operator: 'operator' },
		});
		await expectRequest(() => service.listNamespaceUsage(), { role: 'admin', path: `${namespacePath}/usage` });
		const missing = '/openapi/v1/apps/SampleApp/envs/DEV/clusters/default/missing-namespaces';
		await expectRequest(() => service.listMissingNamespace(), { role: 'admin', path: missing });
		await expectRequest(() => service.createMissingNamespace(), {
			role: 'admin',
			path: missing,
			method: 'POST',
			query: { operator: 'operator' },
		});
	});

	it('maps item and release mutation methods', async () => {
		const itemPath = '/openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/timeout';
		await expectRequest(() => service.listItem({ page: 1, size: 25 }), {
			role: 'admin',
			path: itemPath.replace('/timeout', ''),
			query: { page: 1, size: 25 },
		});
		await expectRequest(() => service.getItem({ key: 'timeout' }), { role: 'admin', path: itemPath });
		await expectRequest(() => service.getItem({ key: 'feature flag/with space' }), {
			role: 'admin',
			path: `${itemPath.replace('/items/timeout', '/encodedItems')}/${Buffer.from('feature flag/with space').toString('base64url')}`,
		});
		await expectRequest(() => service.upsertItem({ key: 'timeout', value: '5000' }), {
			role: 'admin',
			path: itemPath,
			method: 'PUT',
			query: { createIfNotExists: true },
			body: {
				key: 'timeout',
				value: '5000',
				dataChangeCreatedBy: 'operator',
				dataChangeLastModifiedBy: 'operator',
			},
		});
		await expectRequest(() => service.deleteItem({ key: 'timeout' }), {
			role: 'admin',
			path: itemPath,
			method: 'DELETE',
			query: { operator: 'operator' },
		});
		const releasePath = '/openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases';
		await expectRequest(() => service.getLatestRelease(), { role: 'admin', path: `${releasePath}/latest` });
		await expectRequest(() => service.publishRelease({ title: 'Release1' }), {
			role: 'admin',
			path: releasePath,
			method: 'POST',
			body: { releaseTitle: 'Release1', releasedBy: 'operator' },
		});
		await expectRequest(() => service.rollbackRelease({ releaseId: '7' }), {
			role: 'admin',
			path: '/openapi/v1/envs/DEV/releases/7/rollback',
			method: 'PUT',
			query: { operator: 'operator' },
		});
	});

	it('owns raw admin, patch, namespace text, read-only, and lifecycle boundaries', async () => {
		await expectRequest(() => service.request({ path: '/openapi/v1/apps', query: { page: '1' } }), {
			role: 'admin',
			path: '/openapi/v1/apps',
			query: { page: '1' },
		});
		requests = [];
		await service.patchNamespaceItem({
			set: [{ key: 'timeout', value: '5000' }],
			delete: [],
			publish: true,
			releaseTitle: 'Patch',
		});
		expect(requests.map(({ role, method, path }) => `${role} ${method} ${path}`)).toEqual([
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/active',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/timeout',
			'admin POST /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases',
		]);
		requests = [];
		await service.writeNamespaceText({ configText: 'a=1', publish: true, releaseTitle: 'Write' });
		const isPermissionProbe = (path: string) => /\/(ns_)?permissions\//u.test(path);
		// Publishing pre-checks Modify/Release at namespace, env and cluster level before the draft is written.
		expect(requests.filter(({ path }) => isPermissionProbe(path))).toHaveLength(6);
		expect(requests.findIndex(({ method }) => method === 'PUT')).toBeGreaterThan(
			requests.findLastIndex(({ path }) => isPermissionProbe(path)),
		);
		expect(requests.filter(({ path }) => !isPermissionProbe(path))).toEqual([
			expect.objectContaining({
				role: 'portal',
				method: 'GET',
				path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application',
			}),
			expect.objectContaining({
				role: 'portal',
				method: 'PUT',
				path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
				body: { namespaceId: 101, format: 'properties', configText: 'a=1' },
			}),
			expect.objectContaining({
				role: 'portal',
				method: 'POST',
				path: '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases',
				body: { releaseTitle: 'Write', isEmergencyPublish: false },
			}),
		]);
		const readOnlyRequest = vi.fn();
		const readOnly = createApolloService(
			{ ...config, readOnly: true },
			{ createAdapter: () => ({ request: readOnlyRequest, readConfig: vi.fn(), close: vi.fn() }) },
		);
		await expect(readOnly.createApp({ appId: 'Blocked' })).rejects.toThrow('Apollo service is read-only');
		await expect(readOnly.patchNamespaceItem({ set: [{ key: 'timeout', value: '5000' }] })).rejects.toThrow(
			'Apollo service is read-only',
		);
		await expect(readOnly.writeNamespaceText({ configText: 'a=1' })).rejects.toThrow('Apollo service is read-only');
		expect(readOnlyRequest).not.toHaveBeenCalled();
		await service.close();
		await expect(service.getStatus()).rejects.toThrow('Apollo service is closed');
	});
});

function createMutationFixture(options: { failPublish?: boolean; failDelete?: string; failRestoreValue?: string }) {
	const items = new Map<string, { value: string; comment?: string }>([
		['alpha', { value: 'one', comment: 'original comment' }],
		['secret.token', { value: 'keep-secret', comment: 'secret comment' }],
	]);
	const requests: ApolloHttpRequest[] = [];
	let draft = 'active=old';
	const adapter: ApolloAdapter = createApolloTestAdapter({
		async request(input) {
			requests.push(input);
			if (input.role === 'portal' && input.method === 'GET' && input.path.endsWith('/items')) {
				return Array.from(items, ([key, value]) => ({ key, ...value }));
			}
			if (input.role === 'portal' && input.method === 'GET' && input.path.endsWith('/namespaces/application')) {
				return { baseInfo: { id: 101 }, format: 'properties' };
			}
			if (input.role === 'portal' && input.method === 'PUT' && input.path.endsWith('/items')) {
				draft = String((input.body as { configText: string }).configText);
				return undefined;
			}
			if (input.role === 'portal' && input.method === 'POST' && input.path.endsWith('/releases')) {
				if (options.failPublish) throw new Error('publish failed password=secret');
				return { id: 9 };
			}
			if (input.role === 'admin' && input.path.includes('/items/')) {
				const body = (input.body ?? {}) as { key?: string; value?: string; comment?: string };
				const key = body.key ?? input.path.split('/').pop() ?? '';
				if (input.method === 'DELETE') {
					if (options.failDelete === key) throw new Error('delete failed token=secret');
					items.delete(key);
				} else {
					if (options.failRestoreValue === body.value) throw new Error('restore failed apiKey=secret');
					items.set(key, { value: String(body.value ?? ''), comment: body.comment });
				}
				return undefined;
			}
			if (input.role === 'admin' && input.method === 'POST' && input.path.endsWith('/releases')) {
				if (options.failPublish) throw new Error('publish failed password=secret');
				return { id: 10 };
			}
			return undefined;
		},
		async readConfig() {
			return {};
		},
		async close() {},
	});
	return {
		items,
		requests,
		get draft() {
			return draft;
		},
		service: createApolloService(config, { createAdapter: () => adapter }),
	};
}

describe('Apollo mutation failure boundaries', () => {
	it('compensates item writes in reverse order when publish fails', async () => {
		const fixture = createMutationFixture({ failPublish: true });
		const error = await fixture.service
			.patchNamespaceItem({ set: [{ key: 'alpha', value: 'two' }], delete: ['secret.token'], publish: true })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toBeInstanceOf(ApolloServiceError);
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
			message: 'Apollo namespace draft restored; publish outcome is unknown',
		});
		expect(error.message).not.toContain('secret');
		expect(fixture.items).toEqual(
			new Map([
				['alpha', { value: 'one', comment: 'original comment' }],
				['secret.token', { value: 'keep-secret', comment: 'secret comment' }],
			]),
		);
		expect(fixture.requests.map(({ role, method, path }) => `${role} ${method} ${path}`)).toEqual([
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/active',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/alpha',
			'admin DELETE /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/secret.token',
			'admin POST /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/secret.token',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/alpha',
		]);
	});
	it('compensates a newly created item by deleting it', async () => {
		const fixture = createMutationFixture({ failPublish: true });
		const error = await fixture.service
			.patchNamespaceItem({ set: [{ key: 'fresh', value: 'created' }], publish: true })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
		});
		expect(fixture.items.has('fresh')).toBe(false);
		expect(fixture.requests.map(({ role, method, path }) => `${role} ${method} ${path}`)).toEqual([
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application',
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/releases/active',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/fresh',
			'admin POST /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases',
			'admin DELETE /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/fresh',
		]);
	});
	it('compensates already-applied items when an item write fails', async () => {
		const fixture = createMutationFixture({ failDelete: 'secret.token' });
		const error = await fixture.service
			.patchNamespaceItem({ set: [{ key: 'alpha', value: 'two' }], delete: ['secret.token'] })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toMatchObject({ code: ApolloServiceErrorCodes.OperationFailed });
		expect(error.message).toBe('Apollo namespace patch failed; applied changes were compensated');
		expect(fixture.items.get('alpha')).toEqual({ value: 'one', comment: 'original comment' });
		expect(fixture.items.has('secret.token')).toBe(true);
	});
	it('reports publish uncertainty when compensation cannot restore every item', async () => {
		const fixture = createMutationFixture({ failPublish: true, failRestoreValue: 'one' });
		const error = await fixture.service
			.patchNamespaceItem({ set: [{ key: 'alpha', value: 'two' }], delete: ['secret.token'], publish: true })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
			message: 'Apollo namespace draft partially restored; publish outcome is unknown',
		});
		expect(error.message).not.toMatch(/alpha|two|secret|password|cause/iu);
		expect(fixture.items.get('alpha')).toEqual({ value: 'two', comment: undefined });
	});
	it('marks a successfully replaced draft as partial when publish outcome is unknown', async () => {
		const fixture = createMutationFixture({ failPublish: true });
		const error = await fixture.service
			.writeNamespaceText({ configText: 'password=secret', publish: true, releaseTitle: 'Release' })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
			message: 'Apollo namespace draft updated; publish outcome is unknown',
		});
		expect(error.message).not.toContain('secret');
		expect(fixture.draft).toBe('password=secret');
		expect(fixture.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
	});
});
