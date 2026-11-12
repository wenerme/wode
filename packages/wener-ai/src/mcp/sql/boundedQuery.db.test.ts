import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { sql } from 'kysely';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { encodeSqlRowsJson, executeBoundedQuery, type SqlRawConnectionProvider } from './boundedQuery';
import { createSqlQueryCanceller } from './cancellableQuery';
import { createSqlMcpServer } from './server';
import { createKyselyInstance } from './utils';

/**
 * 真实数据库上的结果上限：逐行读取、到上限即取消数据库上的查询，连接池随后照常可用。
 * 只在设置了本地临时库地址时运行（不连 dev/prod）：
 * - `SQL_CLIENT_TEST_PG_URL`（例如 `postgres://postgres@127.0.0.1:5432/sql_mcp_test`）
 * - `SQL_CLIENT_TEST_MYSQL_URL`（例如 `mysql://root:test@127.0.0.1:53306/t`）
 */
const urls = {
	postgres: process.env.SQL_CLIENT_TEST_PG_URL,
	mysql: process.env.SQL_CLIENT_TEST_MYSQL_URL,
} as const;

/** 一行，`size` 字节的单个字段（巨大单行）。 */
const hugeRow = {
	postgres: (size: number) => `select 1 as i, repeat('h', ${size}) as big`,
	mysql: (size: number) => `select 1 as i, repeat('h', ${size}) as big`,
} as const;

/** 产生 n 行、每行约 100 字节的查询（不建表）。MySQL 8 用递归 CTE；递归深度要临时调大。 */
const bigQuery = {
	postgres: (n: number) => `select g as i, repeat('x', 100) as pad from generate_series(1, ${n}) g`,
	mysql: (n: number) =>
		`with recursive s(i) as (select 1 union all select i + 1 from s where i < ${n}) select i, repeat('x', 100) as pad from s`,
} as const;

for (const dialect of ['postgres', 'mysql'] as const) {
	const url = urls[dialect];
	describe.skipIf(!url)(`真实 ${dialect}：结果上限`, () => {
		let instance: ReturnType<typeof createSqlMcpServer>;
		let client: Client;

		beforeAll(async () => {
			if (dialect === 'mysql') {
				// GLOBAL 只对之后建立的会话生效：先用单独的连接设好，再建 server（它的连接池在这之后才建立连接）。
				const { db } = await createKyselyInstance(url as string, dialect);
				try {
					await sql.raw('SET GLOBAL cte_max_recursion_depth = 100000000').execute(db);
				} finally {
					await db.destroy();
				}
			}
			instance = createSqlMcpServer({
				url: url as string,
				readOnly: true,
				resultLimits: { maxRows: 1000, maxResultBytes: 4 * 1024 * 1024 },
			});
			const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
			await instance.server.connect(serverTransport);
			client = new Client({ name: 'sql-limit-test', version: '1.0.0' });
			await client.connect(clientTransport);
		}, 60_000);

		afterAll(async () => {
			await client?.close();
			await instance?.close();
		});

		const call = (name: 'query_json' | 'exec_query', args: Record<string, unknown>) =>
			client.callTool({ name, arguments: args }) as Promise<{
				isError?: boolean;
				content: Array<{ type: string; text: string }>;
				structuredContent?: Record<string, unknown>;
			}>;

		test('查询执行中出错（除零）→ 工具返回错误结果，不挂住；连接池随后照常可用', async () => {
			const bad =
				dialect === 'postgres'
					? 'select g, 1 / (g - 500) as x from generate_series(1, 1000) g'
					: 'with recursive s(i) as (select 1 union all select i + 1 from s where i < 1000) select i, cast(1 as signed) div 0 + nonexistent_column from s';
			const started = performance.now();
			const result = await call('query_json', { sql: bad });
			expect(performance.now() - started).toBeLessThan(15_000);
			expect(result.isError).toBe(true);
			const ok = await call('query_json', { sql: 'select 1 as one' });
			expect(JSON.parse(ok.content[0]?.text ?? '[]')).toEqual([{ one: 1 }]);
		}, 30_000);

		test('没到上限：与以前一样只有一项内容、没有 structuredContent', async () => {
			const result = await call('query_json', { sql: bigQuery[dialect](10) });
			expect(result.isError).toBeFalsy();
			expect(result.content).toHaveLength(1);
			expect(JSON.parse(result.content[0]?.text ?? '[]')).toHaveLength(10);
			expect(result.structuredContent).toBeUndefined();
		});

		test('2000 万行逐行明细不加 LIMIT：很快截断在服务端上限（1000 行），返回提示，不报错；进程内存不随结果集增长', async () => {
			const before = process.memoryUsage().heapUsed;
			const started = performance.now();
			const result = await call('query_json', { sql: bigQuery[dialect](20_000_000) });
			const ms = performance.now() - started;
			expect(result.isError, JSON.stringify(result.content).slice(0, 300)).toBeFalsy();
			expect(JSON.parse(result.content[0]?.text ?? '[]')).toHaveLength(1000);
			expect(result.content[1]?.text).toMatch(/truncated at 1000 rows.*LIMIT/su);
			expect(result.structuredContent).toMatchObject({
				truncated: true,
				rowCount: 1000,
				reason: 'max_rows',
				limits: { maxRows: 1000, maxResultBytes: 4 * 1024 * 1024 },
			});
			// 取消生效：不是把 2000 万行读完（那要几十秒、几 GB）。
			expect(ms).toBeLessThan(15_000);
			expect(process.memoryUsage().heapUsed - before).toBeLessThan(256 * 1024 * 1024);
		}, 60_000);

		test('工具参数只能调小：maxRows=50 生效；maxRows=1e9 被限到服务端 1000；maxResultBytes 小时按字节截断', async () => {
			const small = await call('exec_query', { sql: bigQuery[dialect](100_000), maxRows: 50 });
			expect(small.structuredContent).toMatchObject({ truncated: true, rowCount: 50, reason: 'max_rows' });
			expect(small.content[0]?.text.split('\n')).toHaveLength(52);
			const huge = await call('query_json', { sql: bigQuery[dialect](100_000), maxRows: 1_000_000_000 });
			expect(huge.structuredContent).toMatchObject({ rowCount: 1000, limits: { maxRows: 1000 } });
			const bytes = await call('query_json', { sql: bigQuery[dialect](100_000), maxResultBytes: 10_000 });
			expect(bytes.structuredContent).toMatchObject({ truncated: true, reason: 'max_bytes' });
			expect((bytes.structuredContent as { rowCount: number }).rowCount).toBeLessThan(100);
		}, 60_000);

		test('按最终输出编码的字节上限：query_json 的 pretty JSON 与 exec_query 的表格都不超过 maxResultBytes', async () => {
			const limit = 20_000;
			const json = await call('query_json', { sql: bigQuery[dialect](100_000), maxResultBytes: limit });
			expect(json.structuredContent).toMatchObject({ truncated: true, reason: 'max_bytes' });
			const jsonText = json.content[0]?.text ?? '';
			expect(Buffer.byteLength(jsonText, 'utf8')).toBeLessThanOrEqual(limit);
			expect(jsonText).toBe(encodeSqlRowsJson(JSON.parse(jsonText)));
			const table = await call('exec_query', { sql: bigQuery[dialect](100_000), maxResultBytes: limit });
			expect(table.structuredContent).toMatchObject({ truncated: true, reason: 'max_bytes' });
			expect(Buffer.byteLength(table.content[0]?.text ?? '', 'utf8')).toBeLessThanOrEqual(limit);
		}, 60_000);

		test('exec_query 一个超大单元格 + 多行：单元格截断显示、提示用 query_json，表格不超过上限；query_json 拿到完整值', async () => {
			const big =
				dialect === 'postgres'
					? `select g as i, case when g = 1 then repeat('B', 3000000) else 'x' end as v from generate_series(1, 500) g`
					: `with recursive s(i) as (select 1 union all select i + 1 from s where i < 500) select i, if(i = 1, repeat('B', 3000000), 'x') as v from s`;
			const limit = 64 * 1024;
			const table = await call('exec_query', { sql: big, maxResultBytes: limit });
			expect(table.isError, JSON.stringify(table.content).slice(0, 300)).toBeFalsy();
			const text = table.content[0]?.text ?? '';
			expect(Buffer.byteLength(text, 'utf8')).toBeLessThanOrEqual(limit);
			expect(text).toContain(`${'B'.repeat(255)}…`);
			expect(table.content.some((item) => /use query_json to get full values/u.test(item.text))).toBe(true);
			expect(table.structuredContent).toMatchObject({ cellsTruncated: 1 });
			const json = await call('query_json', { sql: big.replace('500', '1'), maxResultBytes: 4 * 1024 * 1024 });
			expect((JSON.parse(json.content[0]?.text ?? '[]') as Array<{ v: string }>)[0]?.v).toHaveLength(3_000_000);
		}, 60_000);

		test('巨大单行：返回 row_too_large 提示、不报错；连接池随后照常可用', async () => {
			const result = await call('query_json', { sql: hugeRow[dialect](2_000_000), maxResultBytes: 1_000_000 });
			expect(result.isError, JSON.stringify(result.content).slice(0, 300)).toBeFalsy();
			expect(JSON.parse(result.content[0]?.text ?? 'null')).toEqual([]);
			expect(result.content[1]?.text).toMatch(/single row exceeds 1000000 bytes/u);
			expect(result.structuredContent).toMatchObject({ truncated: true, rowCount: 0, reason: 'row_too_large' });
			const ok = await call('query_json', { sql: 'select 1 as one' });
			expect(JSON.parse(ok.content[0]?.text ?? '[]')).toEqual([{ one: 1 }]);
		}, 60_000);

		test('取消后的连接销毁、不再被复用：巨大单行与取消没生效时，后端会话被关闭，下次借到的是新会话', async () => {
			const { rawConnection, db } = await createKyselyInstance(url as string, dialect);
			const provide = rawConnection as SqlRawConnectionProvider;
			const sessions: number[] = [];
			// 记下每次借到的会话 ID（与 executeBoundedQuery 内部读的是同一个）。
			// pg 的原生连接被 createPgRawConnection 包了一层，会话 ID 从 Pool 借出的真实 Client 上取。
			const connect = pg.Pool.prototype.connect;
			const spy =
				dialect === 'postgres'
					? vi.spyOn(pg.Pool.prototype, 'connect').mockImplementation(async function (this: pg.Pool) {
							const client = await (connect as () => Promise<pg.PoolClient>).call(this);
							sessions.push((client as unknown as { processID: number }).processID);
							return client;
						} as never)
					: undefined;
			const tracked: SqlRawConnectionProvider = async () => {
				const raw = await provide();
				if (raw.dialect === 'mysql') sessions.push((raw.connection as unknown as { threadId: number }).threadId);
				return raw;
			};
			const alive = async (id: number) => {
				const { rows } =
					dialect === 'postgres'
						? await sql<{ n: string }>`select count(*)::text as n from pg_stat_activity where pid = ${id}`.execute(db)
						: await sql<{
								n: number;
							}>`select count(*) as n from information_schema.processlist where id = ${id}`.execute(db);
				return Number(rows[0]?.n ?? 0) > 0;
			};
			try {
				const oversize = await executeBoundedQuery(tracked, hugeRow[dialect](2_000_000), {
					limits: { maxRows: 10, maxResultBytes: 1_000_000 },
					cancel: createSqlQueryCanceller(dialect, url as string),
				});
				expect(oversize.truncated).toMatchObject({ reason: 'row_too_large' });
				const notCancelled = await executeBoundedQuery(tracked, bigQuery[dialect](1_000_000), {
					limits: { maxRows: 5, maxResultBytes: 1 << 20 },
					// 取消器说没找到：宽限期到了就销毁连接。
					cancel: async () => ({ outcome: 'not_found' }),
					truncateGraceMs: 100,
				});
				expect(notCancelled.rows).toHaveLength(5);
				const next = await executeBoundedQuery(tracked, 'select 1 as one', {
					limits: { maxRows: 5, maxResultBytes: 1 << 20 },
				});
				expect(next.rows).toEqual([{ one: 1 }]);
				expect(sessions).toHaveLength(3);
				expect(new Set(sessions).size).toBe(3);
				// 销毁的两个会话在数据库上也已经关闭（不只是没归还）。
				await expect.poll(() => alive(sessions[0] as number), { timeout: 10_000 }).toBe(false);
				await expect.poll(() => alive(sessions[1] as number), { timeout: 10_000 }).toBe(false);
			} finally {
				spy?.mockRestore();
				await db.destroy();
			}
		}, 60_000);

		test('截断之后连接池照常可用（取消的查询没有卡住连接），数据库上没有残留的查询', async () => {
			for (let i = 0; i < 12; i++) {
				const result = await call('query_json', { sql: bigQuery[dialect](1_000_000), maxRows: 5 });
				expect(result.structuredContent).toMatchObject({ rowCount: 5 });
			}
			const ok = await call('query_json', { sql: 'select 1 as one' });
			expect(JSON.parse(ok.content[0]?.text ?? '[]')).toEqual([{ one: 1 }]);
			const { db } = await createKyselyInstance(url as string, dialect);
			try {
				const running =
					dialect === 'postgres'
						? await sql<{
								n: string;
							}>`select count(*)::text as n from pg_stat_activity where state = 'active' and query like '%generate_series(1, 1000000)%' and pid <> pg_backend_pid()`.execute(
								db,
							)
						: await sql<{
								n: number;
							}>`select count(*) as n from information_schema.processlist where command = 'Query' and info like '%where i < 1000000)%' and id <> connection_id()`.execute(
								db,
							);
				expect(Number(running.rows[0]?.n ?? 0)).toBe(0);
			} finally {
				await db.destroy();
			}
		}, 120_000);
	});
}
