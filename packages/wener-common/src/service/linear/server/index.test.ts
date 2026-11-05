import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod/v4';
import { LinearConnectionConfigSchema, LinearServiceConfigSchema, LinearServiceOptionsSchema, resolveLinearConnectionOptions } from '../config';
import { createLinearService } from './index';
import { LinearServiceErrorCodes } from '../errors';
import { adapter, connection, viewer } from '../linear.fixture';

describe('Linear service: migrated source regressions', () => {
	test('single authentication and sensitive schema metadata', () => {
		expect(LinearConnectionConfigSchema.safeParse({}).success).toBe(false);
		expect(LinearConnectionConfigSchema.safeParse({ apiKey: 'key', accessToken: 'token' }).success).toBe(false);
		const schema = z.toJSONSchema(LinearServiceOptionsSchema, { io: 'input' });
		expect(schema.properties?.apiKey).toMatchObject({ 'x-sensitive': true });
		expect(schema.properties?.accessToken).toMatchObject({ 'x-sensitive': true });
	});
	test('read-only service, idempotent close and closed gate', async () => {
		const client = adapter();
		const service = await createLinearService(connection(), { createAdapter: async () => client });
		await expect(service.getIssue({ id: 'DEMO-1' })).resolves.toMatchObject({ identifier: 'DEMO-1' });
		await expect(service.createIssue({ teamId: 'team-id', title: 'Blocked' })).rejects.toMatchObject({ code: LinearServiceErrorCodes.ReadOnly });
		expect(client.createIssue).not.toHaveBeenCalled();
		const close = service.close();
		expect(service.close()).toBe(close);
		await close;
		await expect(service.getViewer()).rejects.toMatchObject({ code: LinearServiceErrorCodes.Closed });
	});
	test('explicit writable service proxies issue and comment mutations', async () => {
		const client = adapter();
		const service = await createLinearService(connection({ accessToken: 'example-oauth', readOnly: false }), { createAdapter: async () => client });
		await service.createIssue({ teamId: 'team-id', title: 'Created' });
		await service.updateIssue({ id: 'DEMO-1', title: 'Updated' });
		await service.createComment({ issueId: 'DEMO-1', body: 'Comment' });
		expect(client.createIssue).toHaveBeenCalledOnce();
		expect(client.updateIssue).toHaveBeenCalledOnce();
		expect(client.createComment).toHaveBeenCalledOnce();
		await service.close();
	});
	test('canonical endpoint/options replace private endpoint/credential selection', () => {
		const config = { baseUrl: 'https://example.test/graphql', readOnly: false, options: { apiKeyEnv: 'LINEAR_EXAMPLE_KEY' } };
		const getEnv = vi.fn((name: string) => name === 'LINEAR_EXAMPLE_KEY' ? 'example-resolved-key' : undefined);
		expect(LinearServiceConfigSchema.safeParse(config).success).toBe(true);
		expect(getEnv).not.toHaveBeenCalled();
		expect(resolveLinearConnectionOptions(config, getEnv)).toMatchObject({ baseUrl: 'https://example.test/graphql', apiKey: 'example-resolved-key', readOnly: false });
		expect(getEnv).toHaveBeenCalledExactlyOnceWith('LINEAR_EXAMPLE_KEY');
	});
	test('empty issue updates are rejected', async () => {
		const service = await createLinearService(connection({ apiKey: 'example-key', readOnly: false }), { createAdapter: async () => adapter() });
		await expect(service.updateIssue({ id: 'DEMO-1' })).rejects.toThrow('requires at least one change');
		await service.close();
	});
});

describe('Linear service migration seams', () => {
	test('all three mutations are guarded independently of the injected adapter', async () => {
		const client = adapter();
		const service = await createLinearService(connection(), { createAdapter: () => client });
		await expect(service.createIssue({ teamId: 'team-id', title: 'Title' })).rejects.toMatchObject({ code: LinearServiceErrorCodes.ReadOnly });
		await expect(service.updateIssue({ id: 'DEMO-1', title: 'Title' })).rejects.toMatchObject({ code: LinearServiceErrorCodes.ReadOnly });
		await expect(service.createComment({ issueId: 'DEMO-1', body: 'Body' })).rejects.toMatchObject({ code: LinearServiceErrorCodes.ReadOnly });
		expect(client.createIssue).not.toHaveBeenCalled();
		expect(client.updateIssue).not.toHaveBeenCalled();
		expect(client.createComment).not.toHaveBeenCalled();
		await service.close();
	});
	test.each([
		{ options: { apiKey: 'example-key' }, expected: { apiKey: 'example-key' } },
		{ options: { apiKeyEnv: 'LINEAR_EXAMPLE_KEY' }, expected: { apiKey: 'example-resolved-key' } },
		{ options: { accessToken: 'example-oauth' }, expected: { accessToken: 'example-oauth' } },
		{ options: { accessTokenEnv: 'LINEAR_EXAMPLE_KEY' }, expected: { accessToken: 'example-resolved-key' } },
		{ options: { apiKey: 'env://LINEAR_EXAMPLE_KEY' }, expected: { apiKey: 'example-resolved-key' } },
	])('resolves auth source $options', ({ options, expected }) => {
		expect(resolveLinearConnectionOptions({ options }, () => 'example-resolved-key')).toMatchObject(expected);
	});
	test.each([
		{}, { apiKey: 'key', apiKeyEnv: 'KEY' }, { apiKey: 'key', accessTokenEnv: 'TOKEN' },
		{ apiKeyEnv: 'MISSING' }, { apiKeyEnv: 'BAD-NAME' }, { accessToken: ' ' }, { apiKey: 'key', unknown: true },
	])('invalid auth sources produce fixed errors: %j', (options) => {
		expect(() => resolveLinearConnectionOptions({ options })).toThrow('Linear service configuration is invalid');
	});
	test('all eleven methods forward per-call options through an injected adapter', async () => {
		const client = adapter();
		const service = await createLinearService(connection({ apiKey: 'example-key', readOnly: false }), { createAdapter: () => client });
		const options = { signal: new AbortController().signal };
		await service.getViewer(options);
		await service.listTeam({}, options);
		await service.listIssueState({ teamId: 'team-id' }, options);
		await service.listUser({}, options);
		await service.listProject({}, options);
		await service.listIssue({}, options);
		await service.getIssue({ id: 'DEMO-1' }, options);
		await service.createIssue({ teamId: 'team-id', title: 'Title' }, options);
		await service.updateIssue({ id: 'DEMO-1', title: 'Updated' }, options);
		await service.listComment({ issueId: 'DEMO-1' }, options);
		await service.createComment({ issueId: 'DEMO-1', body: 'Body' }, options);
		expect(client.getViewer).toHaveBeenCalledExactlyOnceWith(options);
		for (const name of ['listTeam', 'listUser', 'listProject', 'listIssue'] as const) {
			expect(client[name]).toHaveBeenCalledExactlyOnceWith({ first: 50, includeArchived: false }, options);
		}
		expect(client.listIssueState).toHaveBeenCalledExactlyOnceWith({ teamId: 'team-id', first: 50 }, options);
		expect(client.getIssue).toHaveBeenCalledExactlyOnceWith({ id: 'DEMO-1' }, options);
		expect(client.createIssue).toHaveBeenCalledExactlyOnceWith({ teamId: 'team-id', title: 'Title' }, options);
		expect(client.updateIssue).toHaveBeenCalledExactlyOnceWith({ id: 'DEMO-1', title: 'Updated' }, options);
		expect(client.listComment).toHaveBeenCalledExactlyOnceWith({ issueId: 'DEMO-1', first: 50 }, options);
		expect(client.createComment).toHaveBeenCalledExactlyOnceWith({ issueId: 'DEMO-1', body: 'Body' }, options);
		await service.close();
	});
	test('pre-aborted signal never invokes the adapter and abort reason is preserved', async () => {
		const client = adapter();
		const service = await createLinearService(connection(), { createAdapter: () => client });
		const signal = AbortSignal.abort(new Error('cancelled'));
		await expect(service.getViewer({ signal })).rejects.toBe(signal.reason);
		expect(client.getViewer).not.toHaveBeenCalled();
		await service.close();
	});
	test('initialization and adapter errors are sanitized', async () => {
		await expect(createLinearService(connection(), { createAdapter() { throw new Error('example-secret'); } })).rejects.toMatchObject({ message: 'Linear service initialization failed' });
		const client = adapter();
		client.getViewer = vi.fn(async () => { throw new Error('example-secret'); });
		const service = await createLinearService(connection(), { createAdapter: () => client });
		await expect(service.getViewer()).rejects.toMatchObject({ message: 'Linear service operation failed' });
		await service.close();
	});
	test('close waits for injected in-flight work even when adapter close resolves first', async () => {
		let release!: () => void;
		const gate = new Promise<void>((resolve) => { release = resolve; });
		const client = adapter();
		client.getViewer = vi.fn(async () => { await gate; return viewer; });
		const service = await createLinearService(connection(), { createAdapter: () => client });
		const request = service.getViewer();
		let closed = false;
		const close = service.close().then(() => { closed = true; });
		for (let index = 0; index < 5; index++) await Promise.resolve();
		expect(closed).toBe(false);
		release();
		await request;
		await close;
		expect(client.close).toHaveBeenCalledOnce();
	});
});
