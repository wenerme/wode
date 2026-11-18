import {
	type CompiledQuery,
	type DatabaseConnection,
	type Driver,
	Kysely,
	MysqlAdapter,
	MysqlIntrospector,
	MysqlQueryCompiler,
	type QueryResult,
} from 'kysely';
import { describe, expect, test, vi } from 'vitest';
import {
	createMysqlQueryCanceller,
	createPgQueryCanceller,
	executeCancellableQuery,
	SqlQueryAbortedError,
	type SqlQueryCanceller,
} from './cancellableQuery';

/** 假数据库：会话 ID 固定 42；业务查询挂起，直到被取消（模拟 KILL 后数据库返回错误）。 */
function createFakeDb() {
	const executed: string[] = [];
	const pending: Array<(error: Error) => void> = [];
	let released = 0;
	let destroyed = 0;
	const connection: DatabaseConnection = {
		async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
			executed.push(compiled.sql);
			if (compiled.sql.includes('CONNECTION_ID()')) return { rows: [{ id: 42 } as R] };
			if (compiled.sql.includes('fast')) return { rows: [{ ok: 1 } as R] };
			return new Promise((_, reject) => pending.push(reject));
		},
		async *streamQuery() {},
	};
	const driver: Driver = {
		async init() {},
		async acquireConnection() {
			return connection;
		},
		async beginTransaction() {},
		async commitTransaction() {},
		async rollbackTransaction() {},
		async releaseConnection() {
			released++;
		},
		async destroy() {
			destroyed++;
		},
	};
	const db = new Kysely<any>({
		dialect: {
			createAdapter: () => new MysqlAdapter(),
			createDriver: () => driver,
			createIntrospector: (kysely) => new MysqlIntrospector(kysely),
			createQueryCompiler: () => new MysqlQueryCompiler(),
		},
	});
	const killAll = () => {
		for (const reject of pending.splice(0)) reject(new Error('[CANCELLED] user kill query'));
	};
	return {
		db,
		executed,
		killAll,
		pendingCount: () => pending.length,
		released: () => released,
		destroyed: () => destroyed,
	};
}

describe('executeCancellableQuery：调用方中止时取消数据库上的查询', () => {
	test('中止：用会话 ID 发取消，立即以 SqlQueryAbortedError 结束，连接在原查询结束后释放', async () => {
		const fake = createFakeDb();
		const cancel = vi.fn<SqlQueryCanceller>(async () => {
			fake.killAll();
			return { outcome: 'killed', matches: 1 };
		});
		const controller = new AbortController();
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow FROM t', {
			signal: controller.signal,
			cancel,
		});
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		controller.abort(new DOMException('client closed', 'AbortError'));
		const error = await running.catch((reason: unknown) => reason);
		expect(error).toBeInstanceOf(SqlQueryAbortedError);
		expect(error).toMatchObject({ name: 'AbortError', cancel: { outcome: 'killed', matches: 1, session: 42 } });
		expect(cancel).toHaveBeenCalledWith({ dialect: 'mysql', session: 42, sql: 'SELECT slow FROM t' });
		await vi.waitFor(() => expect(fake.released()).toBe(1));
		// 会话 ID 与业务查询在同一条连接上执行。
		expect(fake.executed).toEqual(['SELECT CONNECTION_ID() AS id', 'SELECT slow FROM t']);
	});

	test('取消确认返回前原查询未结束时，不提前释放连接', async () => {
		const fake = createFakeDb();
		const controller = new AbortController();
		const cancel = vi.fn<SqlQueryCanceller>(async () => ({ outcome: 'killed' }));
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow FROM t', {
			signal: controller.signal,
			cancel,
		});
		const settled = running.catch((error: unknown) => error);
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		controller.abort();
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(fake.released()).toBe(0);
		fake.killAll();
		expect(await settled).toBeInstanceOf(SqlQueryAbortedError);
		await vi.waitFor(() => expect(fake.released()).toBe(1));
	});

	test('正常结束不取消；没有 signal、或方言不支持时不多查会话 ID', async () => {
		const fake = createFakeDb();
		const cancel = vi.fn<SqlQueryCanceller>(async () => ({ outcome: 'killed' }));
		const result = await executeCancellableQuery(fake.db, 'mysql', 'SELECT fast', {
			signal: new AbortController().signal,
			cancel,
		});
		expect(result.rows).toEqual([{ ok: 1 }]);
		expect(cancel).not.toHaveBeenCalled();
		fake.executed.length = 0;
		await executeCancellableQuery(fake.db, 'mysql', 'SELECT fast', { cancel });
		await executeCancellableQuery(fake.db, 'sqlite', 'SELECT fast', { signal: new AbortController().signal, cancel });
		expect(fake.executed).toEqual(['SELECT fast', 'SELECT fast']);
	});

	test('开始前已中止：不执行业务查询', async () => {
		const fake = createFakeDb();
		const controller = new AbortController();
		controller.abort();
		await expect(
			executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', { signal: controller.signal, cancel: vi.fn() }),
		).rejects.toBeDefined();
		expect(fake.executed).not.toContain('SELECT slow');
	});
});

describe('取消器', () => {
	const sqlText = '\n      SELECT date_add(date_trunc(convert_tz(record_at, ?, ?), ?), INTERVAL 8 HOUR) AS hour FROM t';
	const fakeMysql = (rows: Array<Record<string, unknown>>) => {
		const queries: string[] = [];
		const end = vi.fn(async () => undefined);
		return {
			queries,
			end,
			connect: async () => ({
				query: async (text: string) => {
					queries.push(text);
					return [text === 'SHOW PROCESSLIST' ? rows : [], []] as [unknown, unknown];
				},
				end,
			}),
		};
	};

	test('Doris：按 processlist 的 QueryId 取消（连接 ID 只在所属 FE 有效）；会话 ID 与 SQL 前缀都要对上', async () => {
		const mysql = fakeMysql([
			// 另一个 FE 上同 ID 的其它查询：不能误杀。
			{ Id: 42, Command: 'Query', Info: 'SELECT other FROM x', QueryId: 'aaaa1111-bbbb2222' },
			{ Id: 42, Command: 'Query', Info: sqlText.slice(0, 100), QueryId: '1dc507c0378643c0-838cd447dff26a91' },
		]);
		expect(await createMysqlQueryCanceller(mysql.connect)({ dialect: 'mysql', session: 42, sql: sqlText })).toEqual({
			outcome: 'killed',
			matches: 1,
		});
		expect(mysql.queries).toEqual(['SHOW PROCESSLIST', "KILL QUERY '1dc507c0378643c0-838cd447dff26a91'"]);
		expect(mysql.end).toHaveBeenCalled();
	});

	test('MySQL：没有 QueryId 列时 KILL QUERY <id>；找不到对应查询（已结束）就不取消；非法 QueryId 不拼进 SQL', async () => {
		const plain = fakeMysql([{ Id: 42, Command: 'Query', Info: sqlText }]);
		await createMysqlQueryCanceller(plain.connect)({ dialect: 'mysql', session: 42, sql: sqlText });
		expect(plain.queries).toEqual(['SHOW PROCESSLIST', 'KILL QUERY 42']);

		const gone = fakeMysql([{ Id: 7, Command: 'Query', Info: sqlText, QueryId: 'abcdef12-34567890' }]);
		expect(await createMysqlQueryCanceller(gone.connect)({ dialect: 'mysql', session: 42, sql: sqlText })).toEqual({
			outcome: 'not_found',
			matches: 0,
		});
		expect(gone.queries).toEqual(['SHOW PROCESSLIST']);

		// 两个 FE 上同一会话 ID、同一模板的查询：有歧义，不取消。
		const ambiguous = fakeMysql([
			{ Id: 42, FE: '10.0.0.1', Command: 'Query', Info: sqlText, QueryId: 'aaaa1111-bbbb2222' },
			{ Id: 42, FE: '10.0.0.2', Command: 'Query', Info: sqlText, QueryId: 'cccc3333-dddd4444' },
		]);
		expect(await createMysqlQueryCanceller(ambiguous.connect)({ dialect: 'mysql', session: 42, sql: sqlText })).toEqual(
			{ outcome: 'not_found', matches: 2 },
		);
		expect(ambiguous.queries).toEqual(['SHOW PROCESSLIST']);

		// Doris（有 QueryId 列）但 QueryId 非法或为空：不拼进 SQL，也不回退到按连接 ID（可能误杀别的 FE 上同号连接）。
		for (const QueryId of ["x'; DROP TABLE t; --", '', null]) {
			const doris = fakeMysql([{ Id: 42, Command: 'Query', Info: sqlText, QueryId }]);
			expect(await createMysqlQueryCanceller(doris.connect)({ dialect: 'mysql', session: 42, sql: sqlText })).toEqual({
				outcome: 'not_found',
				matches: 1,
			});
			expect(doris.queries).toEqual(['SHOW PROCESSLIST']);
		}
	});

	test('PostgreSQL：pg_cancel_backend(pid)', async () => {
		const query = vi.fn(async () => ({ rows: [{ ok: true }] }));
		const end = vi.fn(async () => undefined);
		const result = await createPgQueryCanceller(async () => ({ connect: async () => undefined, query, end }))({
			dialect: 'postgres',
			session: 1234,
			sql: 'SELECT pg_sleep(60)',
		});
		expect(result).toEqual({ outcome: 'killed' });
		expect(query).toHaveBeenCalledWith('SELECT pg_cancel_backend($1) AS ok', [1234]);
		expect(end).toHaveBeenCalled();
	});
});

describe('取消结果的记录（onCancel，宿主据此写日志与 span）', () => {
	test('killed 回调一次；取消超时记 error；不中止时不回调', async () => {
		const fake = createFakeDb();
		const results: unknown[] = [];
		const controller = new AbortController();
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', {
			signal: controller.signal,
			cancel: async () => {
				fake.killAll();
				return { outcome: 'killed', matches: 1 };
			},
			onCancel: (result) => results.push(result),
		});
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		controller.abort();
		await expect(running).rejects.toBeInstanceOf(SqlQueryAbortedError);
		expect(results).toEqual([expect.objectContaining({ outcome: 'killed', matches: 1, session: 42 })]);

		const timedOutQuery = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', {
			signal: AbortSignal.timeout(20),
			cancel: async () => new Promise(() => undefined),
			cancelTimeoutMs: 30,
			onCancel: (result) => results.push(result),
		});
		setTimeout(() => fake.killAll(), 60);
		const timedOut = await timedOutQuery.catch((reason: unknown) => reason);
		expect(timedOut).toMatchObject({ cancel: { outcome: 'error', error: 'cancel timed out' } });
		expect(results).toHaveLength(2);

		const fastFake = createFakeDb();
		await executeCancellableQuery(fastFake.db, 'mysql', 'SELECT fast', {
			signal: new AbortController().signal,
			cancel: async () => ({ outcome: 'killed' }),
			onCancel: (result) => results.push(result),
		});
		expect(results).toHaveLength(2);
	});

	test('取消器同步抛错也会转成 error，并等待原查询结束后释放连接', async () => {
		const fake = createFakeDb();
		const controller = new AbortController();
		const cancel = (() => {
			throw new Error('synchronous cancel failure');
		}) as SqlQueryCanceller;
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', {
			signal: controller.signal,
			cancel,
		});
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		setTimeout(() => fake.killAll(), 20);
		controller.abort();
		await expect(running).rejects.toMatchObject({ cancel: { outcome: 'error', error: 'synchronous cancel failure' } });
	});

	test('取消失败且原查询永久 pending：到期限销毁数据库并返回结构化取消错误', async () => {
		const fake = createFakeDb();
		const controller = new AbortController();
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', {
			signal: controller.signal,
			cancel: async () => ({ outcome: 'not_found' }),
			cancelTimeoutMs: 10,
		});
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		controller.abort();
		await expect(running).rejects.toMatchObject({ cancel: { outcome: 'not_found' } });
		expect(fake.released()).toBe(0);
		expect(fake.destroyed()).toBe(1);
	});
});

describe('onDestroy：销毁传入的 Kysely 实例前通知调用方丢弃缓存', () => {
	/** 发起一个挂起的查询并中止；记下 onDestroy 被调用时 db 是否已经销毁。 */
	async function abortSlow(
		cancel: SqlQueryCanceller,
		options: { cancelTimeoutMs?: number; onDestroy?: () => void } = {},
	) {
		const fake = createFakeDb();
		const destroyedAtCallback: number[] = [];
		const onDestroy = vi.fn(() => {
			destroyedAtCallback.push(fake.destroyed());
			options.onDestroy?.();
		});
		const controller = new AbortController();
		const running = executeCancellableQuery(fake.db, 'mysql', 'SELECT slow', {
			signal: controller.signal,
			cancel,
			cancelTimeoutMs: options.cancelTimeoutMs ?? 50,
			onDestroy,
		});
		await vi.waitFor(() => expect(fake.pendingCount()).toBe(1));
		controller.abort();
		const error = await running.catch((reason: unknown) => reason);
		expect(error).toBeInstanceOf(SqlQueryAbortedError);
		return { fake, onDestroy, destroyedAtCallback, error: error as SqlQueryAbortedError };
	}

	test.each([
		['返回 error', (async () => ({ outcome: 'error', error: 'boom' })) as SqlQueryCanceller],
		['返回 not_found', (async () => ({ outcome: 'not_found' })) as SqlQueryCanceller],
		[
			'异步抛错',
			(async () => {
				throw new Error('cancel failed');
			}) as SqlQueryCanceller,
		],
		[
			'同步抛错',
			(() => {
				throw new Error('cancel failed');
			}) as SqlQueryCanceller,
		],
	])('取消器%s：立即销毁，onDestroy 在 destroy 之前调用一次', async (_label, cancel) => {
		const { fake, onDestroy, destroyedAtCallback } = await abortSlow(cancel);
		await vi.waitFor(() => expect(fake.destroyed()).toBe(1));
		expect(onDestroy).toHaveBeenCalledTimes(1);
		expect(destroyedAtCallback).toEqual([0]);
		fake.killAll();
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(onDestroy).toHaveBeenCalledTimes(1);
	});

	test('onDestroy 抛错被吞掉：仍然销毁，调用方仍拿到结构化取消错误', async () => {
		const { fake, onDestroy, error } = await abortSlow(async () => ({ outcome: 'error' }), {
			onDestroy: () => {
				throw new Error('callback failed');
			},
		});
		expect(error.cancel).toMatchObject({ outcome: 'error' });
		await vi.waitFor(() => expect(fake.destroyed()).toBe(1));
		expect(onDestroy).toHaveBeenCalledTimes(1);
		fake.killAll();
	});

	test('取消成功且原查询在 cancelTimeoutMs 内结束：不销毁、不调用 onDestroy，连接归还', async () => {
		const { fake, onDestroy } = await abortSlow(async () => ({ outcome: 'killed', matches: 1 }), {
			cancelTimeoutMs: 200,
		});
		// 取消生效：原查询在宽限内以取消错误结束。
		fake.killAll();
		await vi.waitFor(() => expect(fake.released()).toBe(1));
		await new Promise((resolve) => setTimeout(resolve, 250));
		expect(fake.destroyed()).toBe(0);
		expect(onDestroy).not.toHaveBeenCalled();
	});

	test('取消成功但原查询在 cancelTimeoutMs 内未结束：到点销毁，onDestroy 调用一次', async () => {
		const { fake, onDestroy, destroyedAtCallback } = await abortSlow(async () => ({ outcome: 'killed' }), {
			cancelTimeoutMs: 30,
		});
		expect(onDestroy).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(fake.destroyed()).toBe(1));
		expect(onDestroy).toHaveBeenCalledTimes(1);
		expect(destroyedAtCallback).toEqual([0]);
		fake.killAll();
	});
});
