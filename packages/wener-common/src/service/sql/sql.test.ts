import { describe, expect, it, vi } from 'vitest';
import { SqlServiceProvider } from '../providers/sql';
import { createSqlService } from './createSqlService';
import { isReadOnlySQL } from './readonly';
import type { SQLExecutionResult, SqlAdapter } from './types';

const result: SQLExecutionResult = { columns: ['n'], rows: [{ n: 42 }], durationMs: 1 };
function mockAdapter(): SqlAdapter {
	return {
		dialect: 'postgresql',
		query: vi.fn(async () => result),
		exec: vi.fn(async () => result),
		ping: vi.fn(async () => ({ ok: true, durationMs: 1 })),
		listObject: vi.fn(async () => [{ name: 'table', type: 'table' }]),
		describeObject: vi.fn(async () => ({ object: { name: 'table', type: 'table' } })),
		close: vi.fn(async () => undefined),
	};
}

describe('SQL lexical read-only boundary', () => {
	it.each([
		'SELECT 1',
		"SELECT 'delete; update '' quoted'",
		'SELECT "update" FROM "table"',
		'/* delete */ SELECT 1; -- delete;\n',
		'SELECT $$delete; update$$',
		'SELECT $tag$delete; update$tag$',
		'WITH x AS (SELECT 1) SELECT * FROM x',
		'EXPLAIN SELECT count(*) FROM t',
		'SHOW server_version',
		'SELECT 1 /* outer /* inner */ outer */',
		'SELECT value FROM sample',
		'SELECT version()',
		"SELECT replace('x', 'x', 'y')",
		'SELECT CAST(1 AS numeric(10,2))',
		'SELECT CAST(1 AS varchar(10))',
		'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x < 3) SELECT sum(x) FROM n',
	])('allows %s', (sql) => expect(isReadOnlySQL(sql, 'postgresql')).toBe(true));
	it.each([
		'DELETE FROM t',
		'WITH x AS (DELETE FROM t RETURNING *) SELECT * FROM x',
		'WITH x AS (SELECT 1) UPDATE t SET a=1',
		'SELECT * INTO t FROM x',
		"SELECT nextval('x')",
		'SELECT pg_sleep(1)',
		"SELECT load_extension('x')",
		'SELECT "nextval"(\'x\')',
		"SELECT pg_catalog.nextval('x')",
		'SELECT 1; SELECT 2',
		'SELECT 1;;',
		'SELECT 1; /* hi */ DELETE FROM t',
		'EXPLAIN ANALYZE SELECT 1',
		'SELECT * FROM t FOR UPDATE',
		'SELECT 1 /*! UNION SELECT secret */',
		"SELECT 'unterminated",
		'SELECT 1 /* unterminated',
		'SELECT $tag$unterminated',
		'SELECT (1',
		'SELECT 1)',
		'SELECT user_function()',
		'WITH x AS (SELECT 1) SELECT 1, user_function()',
	])('rejects %s', (sql) => expect(isReadOnlySQL(sql, 'postgresql')).toBe(false));
	it('conservatively handles dialect-specific quoting and comments', () => {
		expect(isReadOnlySQL('SELECT `x`; # comment\n', 'mysql')).toBe(true);
		expect(isReadOnlySQL('SELECT [x]', 'sqlite')).toBe(true);
		expect(isReadOnlySQL("SELECT 'a\\\'; DELETE FROM t", 'mysql')).toBe(false);
		expect(isReadOnlySQL('SELECT $$x$$', 'sqlite')).toBe(false);
		expect(isReadOnlySQL('SELECT 1--x\n; DELETE FROM t', 'mysql')).toBe(false);
	});
});

describe('SQL core', () => {
	it('passes parameters separately and pagination exactly once', async () => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		const params = ["'; DELETE FROM t; --", 'password=secret'];
		const input = { statement: 'SELECT $1, $2', params, limit: 1, offset: 99 };
		expect(await service.query(input)).toBe(result);
		expect(adapter.query).toHaveBeenCalledWith(input, undefined);
		expect(input.statement).toBe('SELECT $1, $2');
	});
	it('defaults to read-only, query stays read-only on writable services', async () => {
		const adapter = mockAdapter();
		await expect(createSqlService({ adapter }).exec({ statement: 'DELETE FROM t' })).rejects.toThrow(
			'SQL service is read-only',
		);
		const writable = createSqlService({ adapter, readOnly: false });
		await writable.exec({ statement: 'DELETE FROM t', params: [1] });
		await expect(writable.query({ statement: 'DELETE FROM t' })).rejects.toThrow('read-only');
		for (const statement of ['DELETE FROM t; DELETE FROM x', '', 'SELECT 1;;', "SELECT 'open"]) {
			await expect(writable.exec({ statement })).rejects.toThrow('one valid statement');
		}
		expect(adapter.exec).toHaveBeenCalledTimes(1);
	});
	it('defaults and configures bounded pagination', async () => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		await service.query({ statement: 'SELECT 1' });
		expect(adapter.query).toHaveBeenLastCalledWith(
			{ statement: 'SELECT 1', params: undefined, limit: 100, offset: 0 },
			undefined,
		);
		await service.query({ statement: 'SELECT 1', limit: 10_000 });
		await createSqlService({ adapter, maxRowLimit: 5 }).query({ statement: 'SELECT 1' });
		expect(adapter.query).toHaveBeenLastCalledWith(
			{ statement: 'SELECT 1', params: undefined, limit: 5, offset: 0 },
			undefined,
		);
		await createSqlService({ adapter, maxRowLimit: 20_000 }).query({ statement: 'SELECT 1', limit: 20_000 });
	});
	it.each([
		{ limit: 0 },
		{ limit: 10_001 },
		{ limit: 1.5 },
		{ limit: NaN },
		{ offset: -1 },
		{ offset: 0.5 },
		{ offset: Infinity },
		{ offset: Number.MAX_SAFE_INTEGER },
		{ limit: Number.MAX_SAFE_INTEGER + 1 },
	])('rejects unsafe pagination %j', async (pagination) => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		await expect(service.query({ statement: 'SELECT 1', ...pagination })).rejects.toThrow('Invalid SQL service input');
		await expect(service.listObject(pagination)).rejects.toThrow('Invalid SQL service input');
		expect(adapter.query).not.toHaveBeenCalled();
	});
	it('delegates typed metadata operations with validated names and pagination', async () => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		await expect(service.ping()).resolves.toEqual({ ok: true, durationMs: 1 });
		await expect(service.listObject({ parent: { schema: 'public' }, offset: 10 })).resolves.toHaveLength(1);
		expect(adapter.listObject).toHaveBeenCalledWith(
			{ parent: { schema: 'public' }, offset: 10, limit: 100 },
			undefined,
		);
		// Names are DTO values, never concatenated into SQL by core.
		await service.describeObject({ object: { name: 'a"; DELETE FROM t' } });
		expect(adapter.describeObject).toHaveBeenCalledWith({ object: { name: 'a"; DELETE FROM t' } }, undefined);
		for (const name of ['', '  ', 'a\0b', 'a\nb'])
			await expect(service.describeObject({ object: { name } })).rejects.toThrow('Invalid SQL service input');
		await expect(service.listObject({ parent: { schema: '' } })).rejects.toThrow('Invalid SQL service input');
	});
	it('checks cancellation before and after driver execution without leaking reason', async () => {
		const controller = new AbortController();
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		controller.abort(new Error('password=secret'));
		await expect(service.query({ statement: 'SELECT 1' }, { signal: controller.signal })).rejects.toThrow(
			'SQL operation aborted',
		);
		expect(adapter.query).not.toHaveBeenCalled();
		const running = new AbortController();
		vi.mocked(adapter.query).mockImplementation(async () => {
			running.abort('private SQL');
			return result;
		});
		await expect(service.query({ statement: 'SELECT 1' }, { signal: running.signal })).rejects.toMatchObject({
			name: 'AbortError',
			message: 'SQL operation aborted',
		});
	});
	it('passes timeout to driver and validates range', async () => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		for (const timeoutMs of [0, -1, 1.5, NaN, 3_600_001])
			await expect(service.ping({ timeoutMs })).rejects.toThrow('Invalid SQL service input');
		await service.ping({ timeoutMs: 3_600_000 });
		expect(adapter.ping).toHaveBeenCalledWith({ timeoutMs: 3_600_000 });
	});
	it('sanitizes every driver failure and closes only once', async () => {
		const adapter = mockAdapter();
		const secret = new Error('SELECT password FROM t postgres://user:secret@host');
		for (const fn of [adapter.query, adapter.exec, adapter.ping, adapter.listObject, adapter.describeObject])
			vi.mocked(fn).mockRejectedValue(secret);
		vi.mocked(adapter.close).mockRejectedValue(secret);
		const service = createSqlService({ adapter });
		for (const call of [
			() => service.query({ statement: 'SELECT 1' }),
			() => service.exec({ statement: 'SELECT 1' }),
			() => service.ping(),
			() => service.listObject(),
			() => service.describeObject({ object: { name: 't' } }),
		]) {
			const error = await call().catch((error: unknown) => error);
			expect(error).toEqual(new Error('SQL operation failed'));
			expect(error).not.toHaveProperty('cause');
		}
		const first = service.close();
		expect(service.close()).toBe(first);
		await expect(first).rejects.toThrow('SQL close failed');
		expect(adapter.close).toHaveBeenCalledTimes(1);
		for (const call of [
			() => service.ping(),
			() => service.query({ statement: 'SELECT 1' }),
			() => service.exec({ statement: 'SELECT 1' }),
			() => service.listObject(),
			() => service.describeObject({ object: { name: 't' } }),
		])
			await expect(call()).rejects.toThrow('SQL service is closed');
	});
	it('rejects a result returned after close', async () => {
		const adapter = mockAdapter();
		const service = createSqlService({ adapter });
		vi.mocked(adapter.query).mockImplementation(async () => {
			await service.close();
			return result;
		});
		await expect(service.query({ statement: 'SELECT 1' })).rejects.toThrow('SQL service is closed');
	});
	it('provider requires an injected factory and passes its context through', async () => {
		const context = {
			name: 'db',
			config: { provider: 'sql', type: 'sql', readOnly: false, options: { maxRowLimit: 5 } },
			context: { services: {} },
			fetch: globalThis.fetch,
		};
		await expect(SqlServiceProvider.create(context)).rejects.toThrow('SQL driver is unavailable');
		const sqlDriver = vi.fn(async () => mockAdapter());
		const services = await SqlServiceProvider.create({ ...context, sqlDriver });
		expect(sqlDriver).toHaveBeenCalledWith({ ...context, sqlDriver });
		expect(services.sql.readOnly).toBe(false);
		expect(SqlServiceProvider.aliases).toEqual(['sqlite', 'postgres', 'postgresql', 'pg']);
		await expect(
			SqlServiceProvider.create({
				...context,
				sqlDriver: async () => {
					throw new Error('postgres://user:secret@host');
				},
			}),
		).rejects.toThrow('SQL driver creation failed');
	});
	it('rejects malformed DTOs without forwarding unknown fields', async () => {
		const service = createSqlService({ adapter: mockAdapter() });
		for (const input of [
			{ statement: 'SELECT 1', limit: null },
			{ statement: 'SELECT 1', offset: null },
			{ statement: 'SELECT 1', params: 'secret' },
			{ statement: 'SELECT 1', unexpected: 'secret' },
		])
			await expect(service.query(input as never)).rejects.toThrow('Invalid SQL service input');
		await expect(service.listObject({ unknown: 'secret' } as never)).rejects.toThrow('Invalid SQL service input');
	});
});
