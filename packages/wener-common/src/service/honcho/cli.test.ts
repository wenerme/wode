import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type { HonchoServiceClient } from './client';
import { HonchoCliDefinition, HonchoServiceCliBinding } from './cli';

const operation = (name: string, group?: string) =>
	HonchoCliDefinition.commands.find((entry) => entry.name === name && entry.group === group)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => (value === '-' ? 'from stdin' : value)),
});

describe('Honcho CLI preparation', () => {
	it('binds the honcho provider', () => {
		expect(HonchoServiceCliBinding.metadata.provider.name).toBe('honcho');
		expect(HonchoServiceCliBinding.metadata.definition.commands.map((entry) => [entry.group, entry.name].filter(Boolean).join(' '))).toEqual([
			'add', 'query', 'chat', 'workspace list', 'workspace create', 'peer list', 'peer create',
			'session list', 'session create', 'session message', 'session summary', 'session context', 'system status', 'api',
		]);
	});

	it.each([
		['add', undefined, ['hello'], { session: 's', metadata: '{}' }],
		['create', 'workspace', ['w'], { metadata: '{}' }],
		['create', 'peer', ['p'], { metadata: '{}' }],
		['create', 'session', ['s'], { metadata: '{}' }],
		['api', undefined, ['/workspaces'], { method: 'POST', body: '{}' }],
	] as const)('requires --yes for %s %s before reading input', async (name, group, args, options) => {
		const ctx = context([...args], { ...options });
		await expect(operation(name, group).prepare(ctx)).rejects.toThrow('requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
	});

	it.each([
		['add', undefined, ['-'], { session: 's', metadata: '@meta.json' }],
		['create', 'workspace', ['w'], { metadata: '@meta.json', configuration: '-' }],
		['create', 'peer', ['p'], { metadata: '@meta.json' }],
		['create', 'session', ['s'], { configuration: '-' }],
		['api', undefined, ['/workspaces'], { method: 'POST', body: '@body.json' }],
		['api', undefined, ['/workspaces/w'], { method: 'DELETE' }],
	] as const)('throws ServiceCliInputError for %s %s without --yes before stdin/@file', async (name, group, args, options) => {
		const ctx = context([...args], { ...options });
		await expect(operation(name, group).prepare(ctx)).rejects.toBeInstanceOf(ServiceCliInputError);
		expect(ctx.readText).not.toHaveBeenCalled();
	});

	it('marks write commands as mutating for host read-only admission', () => {
		const mutating = HonchoCliDefinition.commands.filter((entry) => entry.mutating).map((entry) => [entry.group, entry.name].filter(Boolean).join(' '));
		expect(mutating).toEqual(['add', 'workspace create', 'peer create', 'session create', 'api']);
	});

	it('prepares add with stdin text and metadata', async () => {
		const client = { remember: vi.fn(async () => ({})) } as unknown as HonchoServiceClient;
		const run = await operation('add').prepare(context(['-'], { session: 's', peer: 'p', metadata: '{"a":1}', yes: true }));
		await run(client, {});
		expect(client.remember).toHaveBeenCalledWith({ sessionId: 's', peerId: 'p', content: 'from stdin', metadata: { a: 1 } }, {});
	});

	it('prepares query and chat from variadic words', async () => {
		const client = { query: vi.fn(async () => []), chat: vi.fn(async () => ({ content: '' })) } as unknown as HonchoServiceClient;
		await (await operation('query').prepare(context(['dark', 'mode'], { limit: '5', workspace: 'w' })))(client, {});
		expect(client.query).toHaveBeenCalledWith({ workspaceId: 'w', query: 'dark mode', limit: 5 }, {});
		await (await operation('chat').prepare(context(['why?'], { 'reasoning-level': 'high' })))(client, {});
		expect(client.chat).toHaveBeenCalledWith({ query: 'why?', reasoningLevel: 'high' }, {});
		await expect(operation('chat').prepare(context(['x'], { 'reasoning-level': 'huge' }))).rejects.toThrow('--reasoning-level');
		await expect(operation('query').prepare(context([]))).rejects.toThrow('required');
	});

	it('prepares session reads', async () => {
		const client = {
			listMessage: vi.fn(async () => ({ items: [] })), getSessionContext: vi.fn(async () => ({})),
		} as unknown as HonchoServiceClient;
		await (await operation('message', 'session').prepare(context(['s'], { limit: '10', page: '2' })))(client, {});
		expect(client.listMessage).toHaveBeenCalledWith({ sessionId: 's', size: 10, page: 2 }, {});
		await (await operation('context', 'session').prepare(context(['s'], { tokens: '100', summary: false })))(client, {});
		expect(client.getSessionContext).toHaveBeenCalledWith({ sessionId: 's', tokens: 100, summary: false }, {});
		await expect(async () => operation('list', 'peer').prepare(context([], { limit: '0' }))).rejects.toThrow('--limit');
	});

	it('prepares raw API calls', async () => {
		const client = { request: vi.fn(async () => ({})) } as unknown as HonchoServiceClient;
		await (await operation('api').prepare(context(['/workspaces/w/queue/status'], { query: ['a=1', 'a=2'] })))(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/workspaces/w/queue/status', method: 'GET', query: { a: ['1', '2'] } }, {});
		await (await operation('api').prepare(context(['/workspaces/list'], { body: '{}', yes: true })))(client, {});
		expect(client.request).toHaveBeenLastCalledWith({ path: '/workspaces/list', method: 'POST', body: {} }, {});
		await expect(operation('api').prepare(context(['/x'], { method: 'GET', body: '{}' }))).rejects.toThrow('--body');
	});

	it('renders list tables', () => {
		expect(operation('list', 'session').table!({ items: [{ id: 's1', created_at: 't' }] })).toEqual({ headers: ['id', 'created_at'], rows: [['s1', 't']] });
	});
});
