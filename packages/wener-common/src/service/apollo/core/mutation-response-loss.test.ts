import { describe, expect, it, vi } from 'vitest';
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

type ResponseLostFixtureOptions = {
	commitThenThrow: { method: 'PUT' | 'DELETE'; key: string };
	failDelete?: string;
};

function createResponseLostFixture(options: ResponseLostFixtureOptions) {
	const items = new Map<string, { value: string; comment?: string }>([
		['alpha', { value: 'one', comment: 'original comment' }],
		['secret.token', { value: 'keep-secret', comment: 'secret comment' }],
	]);
	const requests: ApolloHttpRequest[] = [];
	const adapter: ApolloAdapter = createApolloTestAdapter({
		async request(input) {
			requests.push(input);
			if (input.role === 'portal' && input.method === 'GET' && input.path.endsWith('/items')) {
				return Array.from(items, ([key, value]) => ({ key, ...value }));
			}
			if (input.role === 'admin' && input.path.includes('/items/')) {
				const body = (input.body ?? {}) as { key?: string; value?: string; comment?: string };
				const key = body.key ?? input.path.split('/').pop() ?? '';
				if (input.method === 'DELETE') {
					if (options.failDelete === key) throw new Error('delete failed token=secret');
					items.delete(key);
					if (options.commitThenThrow.method === 'DELETE' && options.commitThenThrow.key === key) {
						throw new Error('delete committed but response lost token=secret');
					}
				} else {
					items.set(key, { value: String(body.value ?? ''), comment: body.comment });
					if (options.commitThenThrow.method === 'PUT' && options.commitThenThrow.key === key) {
						throw new Error('upsert committed but response lost password=secret');
					}
				}
				return undefined;
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
		service: createApolloService(config, { createAdapter: () => adapter }),
	};
}

function createCommittedMutationFixture(loseResponse: (input: ApolloHttpRequest) => boolean) {
	const commits: string[] = [];
	const adapter: ApolloAdapter = createApolloTestAdapter({
		async request(input) {
			if (input.role === 'portal' && input.method === 'GET' && input.path.endsWith('/namespaces/application')) {
				return { baseInfo: { id: 101 }, format: 'properties' };
			}
			if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(input.method ?? 'GET')) return undefined;
			const commit = `${input.role} ${input.method} ${input.path}`;
			commits.push(commit);
			if (loseResponse(input)) throw new Error('committed response lost password=raw-secret cause=transport-secret');
			return input.method === 'POST' ? { id: 91 } : undefined;
		},
		async readConfig() {
			return {};
		},
		async close() {},
	});
	return { commits, service: createApolloService(config, { createAdapter: () => adapter }) };
}

async function rejectedValue(run: Promise<unknown>): Promise<ApolloServiceError> {
	const error = await run.then(
		() => undefined,
		(value) => value,
	);
	expect(error).toBeInstanceOf(ApolloServiceError);
	return error as ApolloServiceError;
}

function expectUnknownOutcome(error: ApolloServiceError, state: string): void {
	expect(error).toMatchObject({ code: ApolloServiceErrorCodes.PartialFailure, state });
	expect(error.message).not.toMatch(/raw-secret|transport-secret|password|cause/iu);
	expect('cause' in error).toBe(false);
}

describe('Apollo committed mutation response loss', () => {
	it('marks an independent publish response loss as publish-outcome-unknown', async () => {
		const fixture = createCommittedMutationFixture(
			(input) => input.role === 'admin' && input.method === 'POST' && input.path.endsWith('/releases'),
		);
		const error = await rejectedValue(fixture.service.publishRelease({ title: 'Release' }));
		expectUnknownOutcome(error, 'publish-outcome-unknown');
		expect(fixture.commits).toEqual([
			'admin POST /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases',
		]);
	});

	it('distinguishes item PUT response loss from a later publish response loss', async () => {
		const itemFixture = createCommittedMutationFixture((input) => input.method === 'PUT');
		const itemError = await rejectedValue(
			itemFixture.service.upsertItem({ key: 'password', value: 'item-secret', release: true }),
		);
		expectUnknownOutcome(itemError, 'item-write-outcome-unknown');
		expect(itemFixture.commits).toHaveLength(1);

		const publishFixture = createCommittedMutationFixture(
			(input) => input.method === 'POST' && input.path.endsWith('/releases'),
		);
		const publishError = await rejectedValue(
			publishFixture.service.upsertItem({ key: 'password', value: 'item-secret', release: true }),
		);
		expectUnknownOutcome(publishError, 'publish-outcome-unknown');
		expect(publishFixture.commits.map((item) => item.split(' ').slice(0, 2).join(' '))).toEqual([
			'admin PUT',
			'admin POST',
		]);
	});

	it('marks a full-text draft PUT response loss without attempting publish', async () => {
		const fixture = createCommittedMutationFixture(
			(input) => input.role === 'portal' && input.method === 'PUT' && input.path.endsWith('/items'),
		);
		const error = await rejectedValue(
			fixture.service.writeNamespaceText({ configText: 'password=draft-secret', publish: true }),
		);
		expectUnknownOutcome(error, 'draft-write-outcome-unknown');
		expect(fixture.commits).toEqual([
			'portal PUT /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
		]);
	});

	it.each([
		['createApp', 'app-write-outcome-unknown', (service: IApolloService) => service.createApp({ appId: 'Created' })],
		[
			'createAppEnv',
			'app-write-outcome-unknown',
			(service: IApolloService) => service.createAppEnv({ appId: 'Created', env: 'DEV' }),
		],
		['updateApp', 'app-write-outcome-unknown', (service: IApolloService) => service.updateApp({ appId: 'Updated' })],
		['deleteApp', 'app-write-outcome-unknown', (service: IApolloService) => service.deleteApp({ appId: 'Deleted' })],
		[
			'createCluster',
			'cluster-write-outcome-unknown',
			(service: IApolloService) => service.createCluster({ cluster: 'gray' }),
		],
		[
			'deleteCluster',
			'cluster-write-outcome-unknown',
			(service: IApolloService) => service.deleteCluster({ cluster: 'gray' }),
		],
		[
			'createNamespace',
			'namespace-write-outcome-unknown',
			(service: IApolloService) => service.createNamespace({ namespace: 'created' }),
		],
		['deleteNamespace', 'namespace-write-outcome-unknown', (service: IApolloService) => service.deleteNamespace()],
		[
			'createMissingNamespace',
			'namespace-write-outcome-unknown',
			(service: IApolloService) => service.createMissingNamespace(),
		],
		['deleteItem', 'item-write-outcome-unknown', (service: IApolloService) => service.deleteItem({ key: 'password' })],
		[
			'rollbackRelease',
			'rollback-outcome-unknown',
			(service: IApolloService) => service.rollbackRelease({ releaseId: '7' }),
		],
		[
			'rawRequest',
			'mutation-outcome-unknown',
			(service: IApolloService) =>
				service.request({
					path: '/openapi/v1/apps',
					method: 'POST',
					body: {},
					headers: { 'X-Request-Id': 'request-1' },
				}),
		],
	] as const)('classifies committed %s response loss as %s', async (_operation, state, run) => {
		const fixture = createCommittedMutationFixture(() => true);
		expectUnknownOutcome(await rejectedValue(run(fixture.service)), state);
		expect(fixture.commits).toHaveLength(1);
	});

	it('rejects unsupported raw methods and invalid headers before adapter admission', () => {
		const request = vi.fn<NonNullable<ApolloAdapter['request']>>();
		const service = createApolloService(config, {
			createAdapter: () => createApolloTestAdapter({ request, readConfig: vi.fn(), close: vi.fn() }),
		});
		for (const input of [
			{ path: '/openapi/v1/apps', method: 'TRACE' },
			{ path: '/openapi/v1/apps', method: 'POST', headers: { 'bad name': 'value' } },
			{ path: '/openapi/v1/apps', method: 'POST', headers: { 'X-Test': 'bad\r\nvalue' } },
		]) {
			expect(() => service.request(input as never)).toThrowError(
				expect.objectContaining({ code: ApolloServiceErrorCodes.InvalidRequest }),
			);
		}
		expect(request).not.toHaveBeenCalled();
	});

	it('keeps local validation and read-only rejection outside outcome-unknown', async () => {
		const request = vi.fn<NonNullable<ApolloAdapter['request']>>();
		const readOnly = createApolloService(
			{ ...config, readOnly: true },
			{ createAdapter: () => createApolloTestAdapter({ request, readConfig: vi.fn(), close: vi.fn() }) },
		);
		await expect(readOnly.publishRelease()).rejects.toMatchObject({ code: ApolloServiceErrorCodes.InvalidRequest });
		expect(() => readOnly.request({ path: 'invalid', method: 'POST' })).toThrowError(
			expect.objectContaining({ code: ApolloServiceErrorCodes.InvalidRequest }),
		);
		expect(request).not.toHaveBeenCalled();
	});
});

describe('Apollo mutation response-loss recovery', () => {
	it('restores a failed item write that committed before its response was lost', async () => {
		const fixture = createResponseLostFixture({ commitThenThrow: { method: 'DELETE', key: 'secret.token' } });
		const error = await fixture.service
			.patchNamespaceItem({ set: [{ key: 'alpha', value: 'two' }], delete: ['secret.token'] })
			.then(
				() => undefined,
				(value) => value,
			);
		expect(error).toMatchObject({ code: ApolloServiceErrorCodes.OperationFailed });
		expect(error.message).toBe('Apollo namespace patch failed; applied changes were compensated');
		expect(fixture.items).toEqual(
			new Map([
				['alpha', { value: 'one', comment: 'original comment' }],
				['secret.token', { value: 'keep-secret', comment: 'secret comment' }],
			]),
		);
		expect(fixture.requests.map(({ role, method, path }) => `${role} ${method} ${path}`)).toEqual([
			'portal GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application/items',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/alpha',
			'admin DELETE /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/secret.token',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/secret.token',
			'admin PUT /openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/items/alpha',
		]);
	});

	it('reports partial failure when recovery DELETE cannot prove an absent item is gone', async () => {
		const fixture = createResponseLostFixture({
			commitThenThrow: { method: 'PUT', key: 'fresh' },
			failDelete: 'fresh',
		});
		const error = await fixture.service.patchNamespaceItem({ set: [{ key: 'fresh', value: 'created' }] }).then(
			() => undefined,
			(value) => value,
		);
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'namespace-patch-partial',
		});
		expect(error.message).not.toMatch(/fresh|created|secret|password|cause/iu);
		expect(fixture.items.get('fresh')).toEqual({ value: 'created', comment: undefined });
	});
});
