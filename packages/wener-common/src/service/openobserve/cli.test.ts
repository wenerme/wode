import { describe, expect, it, vi } from 'vitest';
import { OpenObserveCliDefinition } from './cli';
import type { IOpenObserveService } from './index';

const operation = (name: string, group?: string) =>
	OpenObserveCliDefinition.commands.find((entry) => entry.name === name && entry.group === group)!;
const prepare = (
	args: string[] = [],
	options: Record<string, string | boolean | undefined> = {},
	readText = vi.fn(async () => 'SELECT * FROM app'),
) => ({ args, options, readText });
function service() {
	return {
		type: 'openobserve',
		readOnly: true,
		status: vi.fn(async () => ({ reachable: true })),
		listStreams: vi.fn(async () => ({ streams: [], total: 0 })),
		getStreamSchema: vi.fn(async () => ({ fields: [], totalFields: 0 })),
		search: vi.fn(async () => ({ hits: [{ password: 'PRIVATE', message: 'Bearer PRIVATE' }], total: 1 })),
		listTraces: vi.fn(async () => ({ traces: [], total: 0 })),
		close: vi.fn(async () => {}),
	};
}
describe('OpenObserve command contract', () => {
	it('uses stable resource names and maps default query window before execution', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
		try {
			const client = service();
			const run = await operation('query').prepare(
				prepare(['SELECT * FROM app'], { organization: 'tenant', 'stream-type': 'logs', size: '25' }),
			);
			expect(client.search).not.toHaveBeenCalled();
			const result = await run(client as unknown as IOpenObserveService, {});
			expect(client.search).toHaveBeenCalledWith(
				expect.objectContaining({
					sql: 'SELECT * FROM app',
					organization: 'tenant',
					streamType: 'logs',
					startTimeMicros: 1_799_996_400_000_000,
					endTimeMicros: 1_800_000_000_000_000,
					size: 25,
				}),
				{},
			);
			expect(result).toMatchObject({ hits: [{ password: 'PRIVATE', message: 'Bearer PRIVATE' }] });
		} finally {
			vi.restoreAllMocks();
		}
		expect(OpenObserveCliDefinition.aliases).toEqual(['oo']);
		expect(operation('query').arguments).toBe('[sql...]');
		expect(operation('query').aliases).toEqual(['q', 'search']);
	});
	it('quotes stream and text and orders WHERE before ORDER BY', async () => {
		const client = service();
		const run = await operation('query').prepare(prepare([], { stream: 'app"log', text: "can't fail" }));
		await run(client as unknown as IOpenObserveService, {});
		expect(client.search).toHaveBeenCalledWith(
			expect.objectContaining({
				sql: `SELECT * FROM "app""log" WHERE match_all('can''t fail') ORDER BY _timestamp DESC`,
			}),
			{},
		);
	});
	it('reads a bounded SQL file during prepare and passes text separately from selection', async () => {
		const input = prepare(['@query.sql']);
		const run = await operation('query').prepare(input);
		expect(input.readText).toHaveBeenCalledExactlyOnceWith('@query.sql', {
			label: 'OpenObserve SQL',
			maxBytes: 1024 * 1024,
		});
		const client = service();
		await run(client as unknown as IOpenObserveService, {});
		expect(client.search).toHaveBeenCalledWith(expect.objectContaining({ sql: 'SELECT * FROM app' }), {});
	});
	it.each([
		{ args: [], options: {} },
		{ args: ['SELECT 1'], options: { text: 'conflict' } },
		{ args: ['SELECT 1'], options: { from: 'bad' } },
		{ args: ['SELECT 1'], options: { from: 'now-2d' } },
		{ args: ['SELECT 1'], options: { limit: '0' } },
		{ args: ['SELECT 1'], options: { limit: '2', size: '1' } },
		{ args: ['SELECT 1'], options: { 'stream-type': 'unknown' } },
	])('rejects invalid input before calling the service: %j', async ({ args, options }) => {
		await expect(async () => operation('query').prepare(prepare(args, options))).rejects.toThrow();
	});
	it('accepts optional schema argument and validates trace stream and sort options', async () => {
		const client = service();
		const run = await operation('schema', 'stream').prepare(prepare([], { stream: 'app', keyword: 'msg' }));
		await run(client as unknown as IOpenObserveService, {});
		expect(client.getStreamSchema).toHaveBeenCalledWith(expect.objectContaining({ stream: 'app', keyword: 'msg' }), {});
		expect(() => operation('list', 'trace').prepare(prepare())).toThrow('stream');
		expect(() => operation('list', 'trace').prepare(prepare([], { stream: 'trace', 'sort-order': 'wrong' }))).toThrow(
			'sort-order',
		);
	});
	it('renders original hit fields as table columns', () => {
		const data = { hits: [{ token: 'PRIVATE', message: 'password=PRIVATE' }] };
		expect(operation('query').table?.(data)).toEqual({
			headers: ['token', 'message'],
			rows: [['PRIVATE', 'password=PRIVATE']],
		});
	});
	it.each([
		{ name: 'query', method: 'search', args: ['SELECT 1'] },
		{ name: 'query', group: 'log', method: 'search', args: ['SELECT 1'] },
		{ name: 'query', group: 'metric', method: 'search', args: ['SELECT 1'] },
		{ name: 'query', group: 'trace', method: 'search', args: ['SELECT 1'] },
		{ name: 'status', method: 'status' },
		{ name: 'list', group: 'stream', method: 'listStreams' },
		{ name: 'schema', group: 'stream', method: 'getStreamSchema' },
		{ name: 'list', group: 'trace', method: 'listTraces' },
		{ name: 'health', method: 'health' },
		{ name: 'settings', group: 'stream', method: 'getStreamSettings' },
		{ name: 'update', group: 'stream', method: 'updateStreamSettings' },
		{ name: 'delete', group: 'stream', method: 'deleteStream' },
		{ name: 'json', group: 'ingest', method: 'ingestJson', args: ['[{"message":"fixture"}]'] },
		{ name: 'multi', group: 'ingest', method: 'ingestMulti', args: ['{"message":"fixture"}\n'] },
		{ name: 'values', method: 'getValues', args: ['message'] },
		{ name: 'around', method: 'searchAround', args: ['1000'] },
	])('preserves the raw $method result for $group $name even with --redact in prepare options', async ({ name, group, method, args }) => {
		const shared = { token: 'FIXTURE_TOKEN' };
		const message = '{ "api_key" : "FIXTURE_KEY", "safe" : 1 }\r\n';
		const data = {
			hits: [{ password: 'FIXTURE_PASSWORD', message }],
			shared: [shared, shared],
			large: Array.from({ length: 20_001 }, (_, index) => index),
			cycle: {} as { self?: unknown },
		};
		data.cycle.self = data.cycle;
		const invoke = vi.fn(async () => data);
		const client = { [method]: invoke } as unknown as IOpenObserveService;
		const run = await operation(name, group).prepare(prepare(args, {
			stream: 'app', yes: true, redact: true, input: '{"data_retention":7}',
		}));
		const result = await run(client, {});
		expect(result).toBe(data);
		expect(data.hits[0]).toEqual({ password: 'FIXTURE_PASSWORD', message });
		expect(data.shared[0]).toBe(data.shared[1]);
		expect(data.large.at(-1)).toBe(20_000);
		expect(data.cycle.self).toBe(data.cycle);
	});
});
