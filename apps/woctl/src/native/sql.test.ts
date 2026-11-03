import { describe, expect, it, vi } from 'vitest';
import { createSqliteAdapter } from './sql';
import { createPostgresAdapter } from './sql-postgres';

const sqlite = (readOnly = false) =>
	createSqliteAdapter({ filename: ':memory:', readOnly, timeoutMs: 5000, busyTimeoutMs: 1000 });
const expensive = {
	statement: 'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x < 1000000000) SELECT sum(x) FROM n',
	limit: 1,
};

describe('native SQLite driver', () => {
	it('binds parameters, pages results and describes real temporary database objects', async () => {
		const db = sqlite();
		try {
			await db.exec({ statement: 'CREATE TABLE sample (id INTEGER PRIMARY KEY, value TEXT NOT NULL)' });
			const text = "quoted'; DROP TABLE sample; --";
			await db.exec({ statement: 'INSERT INTO sample (value) VALUES (?)', params: [text] });
			await db.exec({ statement: 'INSERT INTO sample (value) VALUES (?)', params: ['second'] });
			await expect(
				db.query({ statement: 'SELECT value FROM sample ORDER BY id', limit: 1, offset: 1 }),
			).resolves.toMatchObject({ columns: ['value'], rows: [{ value: 'second' }] });
			await expect(
				db.query({ statement: 'SELECT value FROM sample WHERE id = ?', params: [1] }),
			).resolves.toMatchObject({ rows: [{ value: text }] });
			await expect(db.listObject()).resolves.toEqual([{ name: 'sample', type: 'table', schema: 'main' }]);
			await expect(db.describeObject({ object: { name: 'sample' } })).resolves.toMatchObject({
				object: { name: 'sample' },
				children: [{ name: 'id' }, { name: 'value', attributes: { dataType: 'TEXT', nullable: false } }],
			});
			await expect(db.query({ statement: 'DELETE FROM sample' })).rejects.toThrow('SQL request failed');
		} finally {
			await db.close();
		}
	});
	it('opens read-only memory queries without permitting writes', async () => {
		const db = sqlite(true);
		try {
			await expect(db.query({ statement: 'SELECT 1 AS value' })).resolves.toMatchObject({ rows: [{ value: 1 }] });
			await expect(db.exec({ statement: 'CREATE TABLE forbidden (id INT)' })).rejects.toThrow();
		} finally {
			await db.close();
		}
	});
	it('interrupts an executing SQLite VM on caller cancellation', async () => {
		const db = sqlite();
		try {
			await db.ping();
			const controller = new AbortController();
			const reason = new Error('stopped');
			const rejected = expect(db.query(expensive, { signal: controller.signal })).rejects.toBe(reason);
			setTimeout(() => controller.abort(reason), 20);
			await rejected;
			await expect(db.ping()).rejects.toThrow('closed');
		} finally {
			await db.close();
		}
	});
	it('terminates a non-responsive SQLite VM on timeout', async () => {
		const db = sqlite();
		try {
			await db.ping();
			await expect(db.query(expensive, { timeoutMs: 20 })).rejects.toMatchObject({ name: 'TimeoutError' });
		} finally {
			await db.close();
		}
	});
});

describe('native PostgreSQL driver', () => {
	it('uses a database read-only transaction and passes parameter values separately', async () => {
		const query = vi.fn(async (statement: string, _params?: unknown[]) => ({
			rows: statement.includes('SELECT * FROM (SELECT $1 AS value)') ? [{ value: 'bound' }] : [],
			fields: statement.includes('SELECT * FROM (SELECT $1 AS value)') ? [{ name: 'value' }] : [],
			rowCount: 1,
		}));
		const release = vi.fn();
		const pool = { connect: vi.fn(async () => ({ query, release })), end: vi.fn(async () => {}) };
		const db = await createPostgresAdapter({
			connectionString: 'postgres://example.test/fixture',
			timeoutMs: 1000,
			connectTimeoutMs: 1000,
			pool: pool as never,
		});
		try {
			await expect(db.query({ statement: 'SELECT $1 AS value', params: ['bound'] })).resolves.toMatchObject({
				rows: [{ value: 'bound' }],
			});
			expect(query.mock.calls.map(([statement]) => statement)).toEqual([
				'BEGIN READ ONLY',
				'SELECT * FROM (SELECT $1 AS value) AS __wode_query LIMIT $2 OFFSET $3',
				'COMMIT',
			]);
			expect(query).toHaveBeenCalledWith('SELECT * FROM (SELECT $1 AS value) AS __wode_query LIMIT $2 OFFSET $3', [
				'bound',
				100,
				0,
			]);
			expect(release).toHaveBeenCalledOnce();
		} finally {
			await db.close();
		}
		expect(pool.end).toHaveBeenCalledOnce();
	});
	it('keeps comments outside parameterized PostgreSQL pagination wrappers', async () => {
		const query = vi.fn(async (_statement: string, _params?: unknown[]) => ({
			rows: [{ value: 1 }],
			fields: [{ name: 'value' }],
			rowCount: 1,
		}));
		const release = vi.fn();
		const pool = { connect: vi.fn(async () => ({ query, release })), end: vi.fn(async () => {}) };
		const db = await createPostgresAdapter({
			connectionString: 'postgres://example.test/fixture',
			timeoutMs: 1000,
			connectTimeoutMs: 1000,
			pool: pool as never,
		});
		try {
			await db.query({ statement: '/* header */ SELECT 1 -- tail', limit: 1, offset: 0 });
			const firstCalls = query.mock.calls.filter(([value]) => String(value).includes('__wode_query'));
			expect(firstCalls).toHaveLength(1);
			expect(firstCalls[0]?.[0]).toBe('SELECT * FROM (SELECT 1 -- tail\n) AS __wode_query LIMIT $1 OFFSET $2');
			expect(firstCalls[0]?.[1]).toEqual([1, 0]);
			query.mockClear();
			await db.query({ statement: 'SELECT 1; -- tail', limit: 1, offset: 0 });
			const secondCalls = query.mock.calls.filter(([value]) => String(value).includes('__wode_query'));
			expect(secondCalls).toHaveLength(1);
			const second = String(secondCalls[0]?.[0]);
			expect(second).toBe('SELECT * FROM (SELECT 1) AS __wode_query LIMIT $1 OFFSET $2');
			expect(secondCalls[0]?.[1]).toEqual([1, 0]);
			query.mockClear();
			await db.query({ statement: 'SELECT 1;', limit: 1, offset: 0 });
			const bareCalls = query.mock.calls.filter(([value]) => String(value).includes('__wode_query'));
			expect(bareCalls).toHaveLength(1);
			expect(bareCalls[0]?.[0]).toBe('SELECT * FROM (SELECT 1) AS __wode_query LIMIT $1 OFFSET $2');
			expect(bareCalls[0]?.[1]).toEqual([1, 0]);
		} finally {
			await db.close();
		}
	});
	it('discards a connection acquired after the caller cancels while waiting', async () => {
		const release = vi.fn();
		let acquire!: (value: unknown) => void;
		const pool = {
			connect: vi.fn(
				() =>
					new Promise((resolve) => {
						acquire = resolve;
					}),
			),
			end: vi.fn(async () => {}),
		};
		const db = await createPostgresAdapter({
			connectionString: 'postgres://example.test/fixture',
			timeoutMs: 1000,
			connectTimeoutMs: 1000,
			pool: pool as never,
		});
		const controller = new AbortController();
		const reason = new Error('stopped');
		const rejected = expect(db.query({ statement: 'SELECT 1' }, { signal: controller.signal })).rejects.toBe(reason);
		controller.abort(reason);
		await rejected;
		acquire({ query: vi.fn(), release });
		await vi.waitFor(() => expect(release).toHaveBeenCalledExactlyOnceWith(true));
		await db.close();
	});
});
