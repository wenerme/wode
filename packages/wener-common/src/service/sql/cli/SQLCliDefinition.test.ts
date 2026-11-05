import { describe, expect, it, vi } from 'vitest';
import { createServiceCliCommand } from '../../cli/createServiceCliCommand';
import type { ServiceCliInputContext, ServiceCliOptions } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { ISqlService } from '../types';
import { parseSQLInteger, prepareSQLStatement, SQLQueryFileMaxBytes } from './prepareStatement';
import { SQLCliDefinition } from './SQLCliDefinition';

function context(
	args: string[],
	options: ServiceCliOptions = {},
	files: Record<string, string> = {},
): ServiceCliInputContext {
	return {
		args,
		options,
		readText: vi.fn(async (path: string) => {
			if (!(path in files)) throw new Error('private SQL text');
			return files[path]!;
		}),
	};
}
const command = (name: string, group?: string) =>
	SQLCliDefinition.commands.find((entry) => entry.name === name && entry.group === group)!;
function service() {
	return {
		type: 'sql',
		dialect: 'sqlite',
		readOnly: false,
		query: vi.fn<ISqlService['query']>(async () => ({
			columns: ['id'],
			rows: [{ id: 1 }],
			durationMs: 3,
			affectedRows: 1,
		})),
		exec: vi.fn<ISqlService['exec']>(async () => ({ columns: [], rows: [], durationMs: 2, affectedRows: 1 })),
		ping: vi.fn<ISqlService['ping']>(async () => ({ ok: true, durationMs: 1 })),
		listObject: vi.fn<ISqlService['listObject']>(async () => []),
		describeObject: vi.fn<ISqlService['describeObject']>(async () => ({ object: { name: 'users', type: 'TABLE' } })),
		close: vi.fn(),
		[Symbol.asyncDispose]: vi.fn(async () => {}),
	} satisfies ISqlService;
}

describe('SQL CLI statement input', () => {
	it('keeps params separate and applies positional JSON values after params', async () => {
		const statement = 'SELECT $1, $2, $3, $4';
		const input = await prepareSQLStatement(
			context([statement], {
				params: '["original", 2]',
				var: ['1="x\'; DROP TABLE t; --"', '2=true', '3={"a":1}', '4=plain=text'],
				limit: '10',
				offset: '0',
			}),
		);
		expect(input).toEqual({
			statement,
			params: ["x'; DROP TABLE t; --", true, { a: 1 }, 'plain=text'],
			limit: 10,
			offset: 0,
		});
	});
	it('uses one-based positions and deterministic repeated overrides', async () => {
		expect((await prepareSQLStatement(context(['SELECT $2'], { var: ['2=3', '2=null'] }))).params).toEqual([
			null,
			null,
		]);
	});
	it.each(['0=x', '-1=x', 'name=x', '1.5=x', '9007199254740992=x', '1'])(
		'rejects invalid assignment %s without disclosing values',
		async (value) => {
			await expect(prepareSQLStatement(context(['SELECT 1'], { var: value }))).rejects.toThrow(ServiceCliInputError);
		},
	);
	it.each(['0', '-1', '1.5', 'NaN', 'Infinity', '9007199254740992', ''])('rejects invalid limit %s', (value) => {
		expect(() => parseSQLInteger(value, 'limit')).toThrow(ServiceCliInputError);
	});
	it('validates safe offsets', () => {
		expect(parseSQLInteger('0', 'offset')).toBe(0);
		expect(() => parseSQLInteger('-1', 'offset')).toThrow(ServiceCliInputError);
		expect(() => parseSQLInteger('9007199254740992', 'offset')).toThrow(ServiceCliInputError);
	});
	it.each([
		['@query.sql', 'SELECT $1'],
		['@query.json', '{"statement":"SELECT $1","params":[1],"limit":8,"offset":2}'],
		['@query.yaml', 'query: SELECT $1\nparams: [1]\nlimit: 8\noffset: 2'],
		['@query.yml', 'statement: SELECT $1\nparams: [1]'],
		['-', 'SELECT $1'],
	])('reads SQL, JSON, YAML and stdin with host limits: %s', async (path, text) => {
		const ctx = context(
			[path],
			{ params: '@params.json', limit: '5', var: ['1=4'] },
			{ [path]: text, '@params.json': '[3]' },
		);
		const input = await prepareSQLStatement(ctx);
		expect(input.statement).toBe('SELECT $1');
		expect(input.params).toEqual([4]);
		expect(input.limit).toBe(5);
		expect(ctx.readText).toHaveBeenCalledWith(path, { label: 'SQL input', maxBytes: SQLQueryFileMaxBytes });
		expect(ctx.readText).toHaveBeenCalledWith('@params.json', { label: 'SQL input', maxBytes: SQLQueryFileMaxBytes });
	});
	it('keeps file pagination when not overridden', async () => {
		expect(
			await prepareSQLStatement(
				context(['@q.json'], {}, { '@q.json': '{"query":"SELECT 1","params":[2],"limit":8,"offset":2}' }),
			),
		).toEqual({ statement: 'SELECT 1', params: [2], limit: 8, offset: 2 });
	});
	it.each([
		'{"statement":"SELECT secret","params":{}}',
		'{"statement":5}',
		'[]',
		'broken-secret',
		'{"query":"SELECT 1","limit":0}',
	])('sanitizes invalid query files', async (text) => {
		await expect(prepareSQLStatement(context(['@q.json'], {}, { '@q.json': text }))).rejects.toThrow(
			'Invalid SQL query file',
		);
	});
	it('sanitizes host errors and rejects oversized UTF-8 input', async () => {
		await expect(prepareSQLStatement(context(['@missing.sql']))).rejects.toThrow(
			'Unable to read SQL input within 1 MiB',
		);
		await expect(
			prepareSQLStatement(context(['@q.sql'], {}, { '@q.sql': '中'.repeat(SQLQueryFileMaxBytes / 2) })),
		).rejects.toThrow(ServiceCliInputError);
	});
	it.each(['{}', 'null', 'private params'])('requires params arrays', async (params) => {
		await expect(prepareSQLStatement(context(['SELECT 1'], { params }))).rejects.toThrow(
			'SQL params must be a JSON array',
		);
	});
});

describe('SQL CLI service operations', () => {
	it('declares commands and aliases', () => {
		expect(SQLCliDefinition.name).toBe('sql');
		expect(command('query').aliases).toEqual(['q']);
		expect(command('list', 'table').aliases).toEqual(['ls']);
		expect(command('info', 'table').aliases).toEqual(['describe', 'desc']);
		expect(command('exec').mutating).toBe(true);
	});
	it.each([undefined, false, 'true'])('rejects exec without boolean yes before any read: %s', async (yes) => {
		const ctx = context(['@q.sql'], { yes, params: '@p.json' });
		await expect(command('exec').prepare(ctx)).rejects.toThrow('SQL exec requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
	});
	it('lets the host reject readonly mutation before preparing file input', async () => {
		const readText = vi.fn(async () => 'UPDATE t SET x=1');
		const cli = createServiceCliCommand(SQLCliDefinition, {
			readText,
			async run(operation, _options, _context, prepare) {
				if (operation.mutating) throw new ServiceCliInputError('SQL service is read-only');
				await prepare();
			},
		});
		await expect(
			cli.commands!.find((entry) => entry.name === 'exec')!.run!(
				{ args: ['@write.sql'], options: { yes: true, params: '@params.json' }, help: '' },
				undefined,
			),
		).rejects.toThrow('SQL service is read-only');
		expect(readText).not.toHaveBeenCalled();
	});
	it('calls query and preserves full DTO separately from table rendering', async () => {
		const client = service();
		const signal = new AbortController().signal;
		const run = await command('query').prepare(context(['SELECT', '$1'], { params: '[1]', limit: '5', offset: '2' }));
		const result = await run(client, { signal });
		expect(client.query).toHaveBeenCalledWith({ statement: 'SELECT $1', params: [1], limit: 5, offset: 2 }, { signal });
		expect(result).toEqual({ columns: ['id'], rows: [{ id: 1 }], durationMs: 3, affectedRows: 1 });
		expect(command('query').table!(result)).toEqual({ headers: ['id'], rows: [[1]] });
	});
	it('calls exec with only exec DTO fields', async () => {
		const client = service();
		const run = await command('exec').prepare(
			context(['@q.sql'], { yes: true, params: '[2]' }, { '@q.sql': 'UPDATE t SET x=$1' }),
		);
		await run(client, {});
		expect(client.exec).toHaveBeenCalledWith({ statement: 'UPDATE t SET x=$1', params: [2] }, {});
	});
	it.each(['SELECT 1', 'EXPLAIN SELECT 1', '/* header */ EXPLAIN SELECT 1', '-- header\nEXPLAIN SELECT 1'])(
		'explains safely without duplicate prefix: %s',
		async (statement) => {
			const client = service();
			const run = await command('explain').prepare(context([statement]));
			await run(client, {});
			expect(client.query.mock.calls[0]?.[0]).toMatchObject({
				statement: statement === 'SELECT 1' ? 'EXPLAIN SELECT 1' : statement,
			});
		},
	);
	it.each([
		'DELETE FROM t',
		'EXPLAIN ANALYZE SELECT 1',
		'EXPLAIN (ANALYZE true) SELECT 1',
		'SELECT 1; DELETE FROM t',
		'WITH x AS (DELETE FROM t RETURNING *) SELECT * FROM x',
	])('rejects unsafe explain before service invocation: %s', async (statement) => {
		await expect(command('explain').prepare(context([statement]))).rejects.toThrow(
			'SQL explain requires a read-only statement',
		);
	});
	it.each([undefined, 'table'])('maps listing options through object API: %s', async (group) => {
		const client = service();
		const run = await command('list', group).prepare(
			context([], { schema: 'main', search: 'user', limit: '8', offset: '1' }),
		);
		await run(client, {});
		expect(client.listObject).toHaveBeenCalledWith(
			{ parent: { schema: 'main', name: 'main', type: 'schema' }, search: 'user', limit: 8, offset: 1 },
			{},
		);
		expect(client.query).not.toHaveBeenCalled();
	});
	it('maps schema-qualified table names and explicit schema', async () => {
		const client = service();
		await (await command('info', 'table').prepare(context(['public.users'])))(client, {});
		expect(client.describeObject).toHaveBeenLastCalledWith(
			{ object: { schema: 'public', name: 'users', type: 'TABLE' } },
			{},
		);
		await (await command('info', 'table').prepare(context(['public.users'], { schema: 'main' })))(client, {});
		expect(client.describeObject).toHaveBeenLastCalledWith(
			{ object: { schema: 'main', name: 'users', type: 'TABLE' } },
			{},
		);
	});
	it('passes ping options', async () => {
		const client = service();
		const signal = new AbortController().signal;
		expect(await (await command('ping').prepare(context([])))(client, { signal })).toEqual({ ok: true, durationMs: 1 });
		expect(client.ping).toHaveBeenCalledWith({ signal });
	});
});
