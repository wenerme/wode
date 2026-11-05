import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { TencentClsCliDefinition } from './cli';
import type { ITencentClsService } from './index';

const operation = (name: string) => TencentClsCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args,
	options,
	readText: vi.fn(async (value: string) => value),
});

describe('Tencent CLS CLI aliases', () => {
	it('exposes the cls name and tencent-cls/tencent-log aliases', () => {
		expect(TencentClsCliDefinition.name).toBe('cls');
		expect(TencentClsCliDefinition.aliases).toContain('tencent-cls');
		expect(TencentClsCliDefinition.aliases).toContain('tencent-log');
	});
});

describe('Tencent CLS query preparation', () => {
	it('requires a query expression', async () => {
		await expect(operation('query').prepare(context([], { topic: 'my-topic' }))).rejects.toThrow('expression is required');
	});

	it('requires at least one --topic', async () => {
		await expect(operation('query').prepare(context(['*'], {}))).rejects.toThrow('--topic is required');
	});

	it('prepares a query with defaults', async () => {
		const client = {
			query: vi.fn(async () => ({ RequestId: 'r', Context: '', ListOver: true, Results: [] })),
		} as unknown as ITencentClsService;
		const run = await operation('query').prepare(context(['*'], { topic: 'my-topic' }));
		await run(client, {});
		expect(client.query).toHaveBeenCalledWith(
			expect.objectContaining({ topic: ['my-topic'], query: '*' }),
			{},
		);
	});

	it('accepts multiple --topic entries and explicit from/to/order/sql', async () => {
		const client = {
			query: vi.fn(async () => ({ RequestId: 'r', Context: '', ListOver: true, Results: [] })),
		} as unknown as ITencentClsService;
		const run = await operation('query').prepare(
			context(['error'], {
				topic: ['a', 'b'],
				from: '1700000000000',
				to: '1700000001000',
				order: 'asc',
				sql: true,
			}),
		);
		await run(client, {});
		expect(client.query).toHaveBeenCalledWith(
			{ topic: ['a', 'b'], query: 'error', from: 1700000000000, to: 1700000001000, sort: 'asc', sql: true },
			{},
		);
	});

	it('rejects from >= to', async () => {
		await expect(
			operation('query').prepare(context(['*'], { topic: 'a', from: '1700000001000', to: '1700000000000' })),
		).rejects.toThrow(ServiceCliInputError);
	});

	it('rejects an invalid --limit', async () => {
		await expect(operation('query').prepare(context(['*'], { topic: 'a', limit: '0' }))).rejects.toThrow('--limit');
	});

	it('rejects an invalid --order', async () => {
		await expect(operation('query').prepare(context(['*'], { topic: 'a', order: 'invalid' }))).rejects.toThrow('--order');
	});

	it('rejects an invalid --from', async () => {
		await expect(operation('query').prepare(context(['*'], { topic: 'a', from: 'not-a-time' }))).rejects.toThrow(
			ServiceCliInputError,
		);
	});
});

describe('Tencent CLS topics preparation', () => {
	it('prepares topics without arguments', async () => {
		const client = { listTopic: vi.fn(async () => ({ RequestId: 'r', TotalCount: 0, Topics: [] })) } as unknown as ITencentClsService;
		const run = await operation('topics').prepare(context());
		await run(client, {});
		expect(client.listTopic).toHaveBeenCalledWith({}, {});
	});

	it('prepares topics with search/limit/offset', async () => {
		const client = { listTopic: vi.fn(async () => ({ RequestId: 'r', TotalCount: 0, Topics: [] })) } as unknown as ITencentClsService;
		const run = await operation('topics').prepare(context([], { search: 'nginx', limit: '10', offset: '5' }));
		await run(client, {});
		expect(client.listTopic).toHaveBeenCalledWith({ search: 'nginx', limit: 10, offset: 5 }, {});
	});

	it('rejects an invalid --limit', async () => {
		await expect(operation('topics').prepare(context([], { limit: '0' }))).rejects.toThrow('--limit');
	});

	it('rejects an invalid --offset', async () => {
		await expect(operation('topics').prepare(context([], { offset: '-1' }))).rejects.toThrow('--offset');
	});
});
