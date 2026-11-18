import { EventEmitter } from 'node:events';
import { sql } from 'kysely';
import pg from 'pg';
import { describe, expect, test, vi } from 'vitest';
import { createKyselyInstance } from './utils';

/**
 * FG-14：SQL MCP 的 Kysely Postgres 连接池，借出期间（查询、事务）连接被终止时进程不能退出。
 * 真实 PostgreSQL：只在设置 `SQL_CLIENT_TEST_PG_URL` 时运行（本地临时库，不连 dev/prod）。
 */
const realPgUrl = process.env.SQL_CLIENT_TEST_PG_URL;

/** 取 Kysely PostgresDialect 内部的 pg.Pool（只用于测试断言监听）。 */
async function captureCreatedPool(): Promise<{ pools: pg.Pool[]; restore: () => void }> {
	const pools: pg.Pool[] = [];
	const original = pg.Pool.prototype.on;
	const spy = vi.spyOn(pg.Pool.prototype, 'on').mockImplementation(function (this: pg.Pool, ...args) {
		if (!pools.includes(this)) pools.push(this);
		return original.apply(this, args as never);
	});
	return { pools, restore: () => spy.mockRestore() };
}

describe.skipIf(!realPgUrl)(
	'createKyselyInstance(postgres) 借出连接的 error 监听（真实 PostgreSQL，创建时会 SELECT 1）',
	() => {
		test('借出期间连接上有 error 监听（不含连接串凭据），归还后摘掉', async () => {
			const captured = await captureCreatedPool();
			const { db } = await createKyselyInstance(realPgUrl as string, 'postgres');
			captured.restore();
			const pool = captured.pools.at(-1)!;
			const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			try {
				const client = new EventEmitter() as unknown as pg.PoolClient;
				pool.emit('acquire', client);
				expect(client.listenerCount('error')).toBe(1);
				expect(() =>
					client.emit('error', new Error('connection to postgres://user:secret@db/x terminated')),
				).not.toThrow();
				expect(error.mock.calls[0]?.[1]).toBe('connection to postgres://[redacted]@db/x terminated');
				pool.emit('release', undefined, client);
				expect(client.listenerCount('error')).toBe(0);
			} finally {
				error.mockRestore();
				await db.destroy();
			}
		});
	},
);

describe.skipIf(!realPgUrl)('createKyselyInstance(postgres) 借出连接被终止（真实 PostgreSQL）', () => {
	test('事务中 pg_terminate_backend：本次调用失败、进程不退出，后续查询重建连接', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const uncaught: unknown[] = [];
		const onUncaught = (e: unknown) => uncaught.push(e);
		process.on('uncaughtException', onUncaught);
		const { db } = await createKyselyInstance(realPgUrl as string, 'postgres');
		const admin = new pg.Client({ connectionString: realPgUrl });
		await admin.connect();
		try {
			const tag = `mcp_sql_inflight_${Math.random().toString(36).slice(2)}`;
			// 事务：Kysely 借出连接跨 BEGIN…查询…ROLLBACK 持有，出错后的 ROLLBACK 正落在没有监听的窗口里。
			const settled = db
				.transaction()
				.execute(async (trx) => sql.raw(`select pg_sleep(30) /* ${tag} */`).execute(trx))
				.then(
					() => undefined,
					(e: unknown) => e,
				);
			await vi.waitFor(
				async () => {
					const { rows } = await admin.query<{ terminated: boolean }>(
						"select pg_terminate_backend(pid) as terminated from pg_stat_activity where query like '%' || $1 || '%' and pid <> pg_backend_pid()",
						[tag],
					);
					expect(rows.some((row) => row.terminated)).toBe(true);
				},
				{ timeout: 10_000 },
			);
			expect(await settled).toBeInstanceOf(Error);
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(uncaught).toEqual([]);
			const next = await sql<{ ok: number }>`select 1 as ok`.execute(db);
			expect(next.rows[0]?.ok).toBe(1);
		} finally {
			process.off('uncaughtException', onUncaught);
			await admin.end();
			await db.destroy();
			error.mockRestore();
		}
	});
});
