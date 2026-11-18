import { EventEmitter } from 'node:events';
import type { AddressInfo } from 'node:net';
import mysql from 'mysql2';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { createPgRawConnection, executeBoundedQuery, type SqlRawConnectionProvider } from './boundedQuery';
import type { SqlQueryCanceller } from './cancellableQuery';
import { createKyselyInstance } from './utils';

/**
 * 用**真实的驱动类**（pg `Client`/`Query`、mysql2 连接池）回归，不连数据库也能跑（CI）。
 * - pg：真实 `Client` 接一个脚本化的协议连接（Client 只依赖 Connection 的事件与几个发送方法），覆盖 query_timeout 下的
 *   内部累积与 error 不 emit；
 * - mysql2：真实连接池连 mysql2 自带的协议服务端（`mysql.createServer()`），覆盖断网时只有连接级事件、
 *   第二行起的超大行。
 */

// ───────────────────────────── pg ─────────────────────────────

type PgScript = {
	/** 业务查询要吐的行（每行一个字段）。 */
	rows: number;
	/** 每吐多少行让出一次事件循环（让取消有机会生效）。 */
	batch?: number;
	/** 吐完 N 行后：error 报错结束、hang 什么都不发（模拟慢查询）、drop 连接级错误（断网）。 */
	after?: { at: number; action: 'error' | 'hang' | 'drop' };
	/** 第几行（从 0 开始）换成一个大字段。 */
	bigRowAt?: number;
	bigRowBytes?: number;
};

/** 真实 pg `Client` + 脚本化的协议连接；`query_timeout` 与 Pool 里的一样（120s，或测试给的值）。 */
function pgClient(script: PgScript, queryTimeout = 120_000) {
	const con = new EventEmitter() as EventEmitter & Record<string, unknown>;
	for (const method of ['parse', 'bind', 'describe', 'execute', 'flush', 'sync', 'close', 'end', 'startup']) {
		con[method] = () => undefined;
	}
	con.parsedStatements = {};
	con.submittedNamedStatements = {};
	con.stream = { destroy: vi.fn(), setNoDelay() {}, setKeepAlive() {} };
	const state = { cancelled: false, emitted: 0 };
	con.query = (text: string) => {
		setImmediate(async () => {
			if (/pg_backend_pid/u.test(text)) {
				con.emit('rowDescription', { fields: [{ name: 'id', dataTypeID: 23, format: 'text' }] });
				con.emit('dataRow', { fields: ['4242'] });
				con.emit('commandComplete', { text: 'SELECT 1' });
				con.emit('readyForQuery', {});
				return;
			}
			con.emit('rowDescription', { fields: [{ name: 'v', dataTypeID: 25, format: 'text' }] });
			for (let i = 0; i < script.rows; i++) {
				if (state.cancelled) {
					con.emit(
						'errorMessage',
						Object.assign(new Error('canceling statement due to user request'), { code: '57014' }),
					);
					con.emit('readyForQuery', {});
					return;
				}
				if (script.after && i === script.after.at) {
					if (script.after.action === 'error') {
						con.emit('errorMessage', Object.assign(new Error('division by zero'), { code: '22012' }));
						con.emit('readyForQuery', {});
					} else if (script.after.action === 'drop') {
						con.emit('error', new Error('read ECONNRESET'));
					}
					return;
				}
				const value = i === script.bigRowAt ? 'B'.repeat(script.bigRowBytes ?? 0) : `v${i}`;
				con.emit('dataRow', { fields: [value] });
				state.emitted++;
				if (i % (script.batch ?? 50) === 0) await new Promise((resolve) => setImmediate(resolve));
			}
			con.emit('commandComplete', { text: `SELECT ${script.rows}` });
			con.emit('readyForQuery', {});
		});
	};
	// `connection` 是 pg Client 支持但类型里没写的选项（注入 Connection）。
	const client = new pg.Client({ connection: con, query_timeout: queryTimeout } as pg.ClientConfig) as pg.Client & {
		release: (destroy?: boolean) => void;
	};
	Object.assign(client, { _connecting: false, _connected: true, _queryable: true, readyForQuery: true });
	(client as unknown as { _attachListeners(c: unknown): void })._attachListeners(con);
	client.on('error', () => undefined);
	const released = vi.fn();
	client.release = released;
	/** 每个真实 Query：测完看它内部有没有攒行。 */
	const queries: pg.Query[] = [];
	const createQuery = (text: string) => {
		const query = new pg.Query(text);
		queries.push(query);
		return query as never;
	};
	const cancel: SqlQueryCanceller = vi.fn(async () => {
		state.cancelled = true;
		return { outcome: 'killed' as const };
	});
	const raw = createPgRawConnection(client as never, createQuery);
	return { raw, provide: async () => raw, client, con, queries, released, cancel, state };
}

/** pg 内部 Result 攒下的行数（`_accumulateRows` 时 handleDataRow 会 push）。 */
const buffered = (query: pg.Query) => (query as unknown as { _result: { rows: unknown[] } })._result.rows.length;

describe('真实 pg Client（query_timeout=120s，与 Pool 配置相同）', () => {
	test('createPgRawConnection 执行时关掉 query_timeout——逐行 emit、驱动内部不攒行；原来的 120s 交给自己的读超时', async () => {
		const pgc = pgClient({ rows: 5_000 });
		expect(pgc.raw.readTimeoutMs).toBe(120_000);
		const result = await executeBoundedQuery(pgc.provide, 'select v from t', {
			limits: { maxRows: 10_000, maxResultBytes: 1 << 24 },
			cancel: pgc.cancel,
		});
		expect(result.rows).toHaveLength(5_000);
		expect(pgc.queries).toHaveLength(2);
		for (const query of pgc.queries) {
			expect((query as unknown as { callback?: unknown }).callback).toBeUndefined();
			expect(buffered(query)).toBe(0);
		}
		// 关掉只在这一次 query 期间：之后这条连接上的 Kysely 查询仍按 120s。
		expect(
			(pgc.client as unknown as { connectionParameters: { query_timeout: number } }).connectionParameters.query_timeout,
		).toBe(120_000);
		expect(pgc.released).toHaveBeenCalledWith(false);
	});

	test('对照：直接把真实 Client 交给 executeBoundedQuery（不经 createPgRawConnection）→ Query 被补 callback，行在驱动里攒着', async () => {
		const pgc = pgClient({ rows: 100 });
		const query = new pg.Query('select v from t');
		let rows = 0;
		query.on('row', () => rows++);
		pgc.client.query(query as never);
		await vi.waitFor(() => expect(rows).toBe(100));
		expect(typeof (query as unknown as { callback?: unknown }).callback).toBe('function');
		expect(buffered(query)).toBe(100);
	});

	test('普通查询出错 → Promise 以数据库错误结束（不挂住），连接销毁', async () => {
		const pgc = pgClient({ rows: 1_000, after: { at: 10, action: 'error' } });
		const started = performance.now();
		await expect(
			executeBoundedQuery(pgc.provide, 'select 1/0', {
				limits: { maxRows: 10_000, maxResultBytes: 1 << 24 },
				cancel: pgc.cancel,
			}),
		).rejects.toThrow('division by zero');
		expect(performance.now() - started).toBeLessThan(2_000);
		expect(pgc.released).toHaveBeenCalledWith(true);
	});

	test('连接级错误（断网）→ 以连接错误结束，连接销毁', async () => {
		const pgc = pgClient({ rows: 1_000, after: { at: 10, action: 'drop' } });
		await expect(
			executeBoundedQuery(pgc.provide, 'select v from t', { limits: { maxRows: 10_000, maxResultBytes: 1 << 24 } }),
		).rejects.toThrow(/ECONNRESET|terminated/u);
		expect(pgc.released).toHaveBeenCalledWith(true);
	});

	test('读超时由自己计时——到点取消数据库上的查询、以 Query read timeout 结束、连接销毁', async () => {
		const pgc = pgClient({ rows: 1_000, after: { at: 3, action: 'hang' } }, 300);
		await expect(
			executeBoundedQuery(pgc.provide, 'select pg_sleep(9999)', {
				limits: { maxRows: 10_000, maxResultBytes: 1 << 24 },
				cancel: pgc.cancel,
			}),
		).rejects.toThrow('Query read timeout');
		expect(pgc.cancel).toHaveBeenCalledWith(expect.objectContaining({ dialect: 'postgres', session: 4242 }));
		expect(pgc.released).toHaveBeenCalledWith(true);
	});

	test('截断：到上限即取消，连接归还；驱动内部不攒行', async () => {
		const pgc = pgClient({ rows: 1_000_000 });
		const result = await executeBoundedQuery(pgc.provide, 'select v from t', {
			limits: { maxRows: 500, maxResultBytes: 1 << 24 },
			cancel: pgc.cancel,
		});
		expect(result.rows).toHaveLength(500);
		expect(result.truncated).toMatchObject({ reason: 'max_rows' });
		expect(pgc.state.emitted).toBeLessThan(5_000);
		expect(buffered(pgc.queries[1] as pg.Query)).toBe(0);
		expect(pgc.released).toHaveBeenCalledWith(false);
	});

	test('第二行起的超大单行（table 模式）→ row_too_large、立即销毁连接（不归还）', async () => {
		const pgc = pgClient({ rows: 1_000_000, bigRowAt: 1, bigRowBytes: 300 });
		// 一列、单元格截断到 256 字符：给一个连这一行都放不下的上限（下限 1 KiB 以下只在这里直接调用时可用）。
		const result = await executeBoundedQuery(pgc.provide, 'select v from t', {
			limits: { maxRows: 10_000, maxResultBytes: 200 },
			encoding: 'table',
			cancel: pgc.cancel,
		});
		expect(result.rows).toHaveLength(1);
		expect(result.truncated).toMatchObject({ reason: 'row_too_large' });
		expect(pgc.released).toHaveBeenCalledWith(true);
	});

	test('fail closed：Query 自己带了 query_timeout（关不掉）时拒绝执行，不悄悄回到内部累积', async () => {
		const pgc = pgClient({ rows: 10 });
		const raw = createPgRawConnection(
			pgc.client as never,
			(text: string) => Object.assign(new pg.Query(text), { query_timeout: 1_000 }) as never,
		);
		await expect(
			executeBoundedQuery(async () => raw, 'select 1', { limits: { maxRows: 10, maxResultBytes: 1 << 20 } }),
		).rejects.toThrow(/callback/u);
		expect(pgc.released).toHaveBeenCalledWith(true);
	});
});

// ───────────────────────────── mysql2 ─────────────────────────────

type MysqlScript = {
	rows: number;
	/** 吐完 N 行后断开 socket（断网）。 */
	dropAfter?: number;
	/** 读会话 ID 时就断开。 */
	dropOnSession?: boolean;
	/** 第几行换成很多列都很宽的行。 */
	wideRowAt?: number;
};

const column = (name: string, type = 253) => ({
	catalog: 'def',
	schema: '',
	table: '',
	orgTable: '',
	name,
	orgName: name,
	characterSet: 33,
	columnLength: 1024,
	columnType: type,
	flags: 0,
	decimals: 0,
});

/** mysql2 自带的协议服务端：握手、`SELECT 1`、`CONNECTION_ID()`，业务查询按脚本逐行吐、可断开。 */
function mysqlServer() {
	const server = mysql.createServer(() => undefined) as unknown as {
		on(event: 'connection', listener: (conn: any) => void): void;
		listen(port: number, host: string, callback: () => void): void;
		close(): void;
		_server: { address(): AddressInfo };
	};
	const state = { script: { rows: 0 } as MysqlScript, connections: 0, closedSockets: 0, killed: 0 };
	server.on('connection', (conn) => {
		state.connections++;
		const id = 100 + state.connections;
		conn.on('error', () => undefined);
		conn.stream.on('close', () => state.closedSockets++);
		conn.serverHandshake({
			protocolVersion: 10,
			serverVersion: '8.4.0-fake',
			connectionId: id,
			statusFlags: 2,
			characterSet: 8,
			capabilityFlags: 0xffffff,
		});
		conn.on('query', (sql: string) => {
			// 回包的序号从 1 开始（客户端的 COM_QUERY 是 0）。
			(conn as unknown as { sequenceId: number }).sequenceId = 1;
			const script = state.script;
			if (/CONNECTION_ID/u.test(sql)) {
				if (script.dropOnSession) return conn.stream.destroy();
				return conn.writeTextResult([{ id: String(id) }], [column('id', 8)]);
			}
			if (/^select 1$/iu.test(sql.trim())) return conn.writeTextResult([{ 1: '1' }], [column('1', 8)]);
			const wide = Array.from({ length: 8 }, (_, index) => column(`c${index}`));
			conn.writeColumns(wide);
			for (let i = 0; i < script.rows; i++) {
				if (script.dropAfter !== undefined && i === script.dropAfter) {
					setTimeout(() => conn.stream.destroy(), 20);
					return;
				}
				conn.writeTextRow(wide.map((_, index) => (i === script.wideRowAt ? 'W'.repeat(300) : `r${i}c${index}`)));
			}
			conn.writeEof();
		});
	});
	return { server, state };
}

describe('真实 mysql2 连接池 + mysql2 协议服务端', () => {
	let fake: ReturnType<typeof mysqlServer>;
	let url: string;
	beforeAll(async () => {
		fake = mysqlServer();
		await new Promise<void>((resolve) => fake.server.listen(0, '127.0.0.1', () => resolve()));
		const { port } = fake.server._server.address();
		url = `mysql://u@127.0.0.1:${port}/t`;
	});
	afterAll(() => {
		fake.server.close();
	});

	async function rawProvider(): Promise<{ provide: SqlRawConnectionProvider; close: () => Promise<void> }> {
		const { db, rawConnection } = await createKyselyInstance(url, 'mysql');
		return { provide: rawConnection as SqlRawConnectionProvider, close: () => db.destroy() };
	}

	test('正常读完：逐行、连接归还（同一个连接池下一次复用，不新建连接）', async () => {
		fake.state.script = { rows: 200 };
		const { provide, close } = await rawProvider();
		try {
			const before = fake.state.connections;
			const first = await executeBoundedQuery(provide, 'select * from t', {
				limits: { maxRows: 1_000, maxResultBytes: 1 << 24 },
			});
			expect(first.rows).toHaveLength(200);
			await executeBoundedQuery(provide, 'select * from t', { limits: { maxRows: 1_000, maxResultBytes: 1 << 24 } });
			expect(fake.state.connections).toBe(before);
		} finally {
			await close();
		}
	});

	test('业务查询中断网（mysql2 只在连接上发 end/error，Query 不发）→ 以连接错误结束、不挂住、连接销毁；连接池随后新建连接可用', async () => {
		fake.state.script = { rows: 1_000, dropAfter: 50 };
		const { provide, close } = await rawProvider();
		try {
			const started = performance.now();
			await expect(
				executeBoundedQuery(provide, 'select * from t', { limits: { maxRows: 10_000, maxResultBytes: 1 << 24 } }),
			).rejects.toThrow(/Connection|terminated|lost|closed/iu);
			expect(performance.now() - started).toBeLessThan(5_000);
			fake.state.script = { rows: 3 };
			const before = fake.state.connections;
			const again = await executeBoundedQuery(provide, 'select * from t', {
				limits: { maxRows: 10, maxResultBytes: 1 << 20 },
			});
			expect(again.rows).toHaveLength(3);
			expect(fake.state.connections).toBe(before + 1);
		} finally {
			await close();
		}
	}, 20_000);

	test('读会话 ID 时断网 → 同样结束、不挂住', async () => {
		fake.state.script = { rows: 10, dropOnSession: true };
		const { provide, close } = await rawProvider();
		try {
			const started = performance.now();
			await expect(
				executeBoundedQuery(provide, 'select * from t', { limits: { maxRows: 10, maxResultBytes: 1 << 20 } }),
			).rejects.toThrow();
			expect(performance.now() - started).toBeLessThan(5_000);
		} finally {
			fake.state.script = { rows: 0 };
			await close();
		}
	}, 20_000);

	test('第二行起的超大单行（table 模式，8 列各 256 字符）→ row_too_large、连接销毁不归还（下次新建连接）', async () => {
		fake.state.script = { rows: 1_000, wideRowAt: 1 };
		const { provide, close } = await rawProvider();
		try {
			const before = fake.state.connections;
			const result = await executeBoundedQuery(provide, 'select * from t', {
				limits: { maxRows: 10_000, maxResultBytes: 1_024 },
				encoding: 'table',
			});
			expect(result.rows).toHaveLength(1);
			expect(result.truncated).toMatchObject({ reason: 'row_too_large' });
			fake.state.script = { rows: 2 };
			await executeBoundedQuery(provide, 'select * from t', { limits: { maxRows: 10, maxResultBytes: 1 << 20 } });
			expect(fake.state.connections).toBe(before + 1);
		} finally {
			await close();
		}
	}, 20_000);
});
