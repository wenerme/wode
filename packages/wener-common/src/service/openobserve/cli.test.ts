import { describe, expect, it, vi } from 'vitest';
import { OpenObserveCliDefinition } from './cli';
import type { IOpenObserveService } from './index';
import { sanitizeOpenObserveOutput } from './sanitize';

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
			expect(result).toMatchObject({ hits: [{ password: '<redacted>', message: 'Bearer <redacted>' }] });
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
	it('renders hit fields as table columns and leaves SDK response objects unchanged', () => {
		const data = { hits: [{ token: 'PRIVATE', message: 'password=PRIVATE' }] };
		const sanitized = sanitizeOpenObserveOutput(data);
		expect(data.hits[0].token).toBe('PRIVATE');
		expect(sanitized.hits[0].token).toBe('<redacted>');
		expect(operation('query').table?.(sanitized)).toEqual({
			headers: ['token', 'message'],
			rows: [['<redacted>', 'password=<redacted>']],
		});
	});
});
