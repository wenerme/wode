import { type Kysely, sql } from 'kysely';
import type { Dialect } from './utils';

/**
 * 取消的结果：`killed` 数据库确认取消；`not_found` 没找到唯一对应的查询（已结束，或匹配到多条——有歧义时不取消，
 * 避免误杀同一会话 ID 下模板相同的其它查询，见 `matches`）；`error` 取消失败或超时。
 */
export type SqlQueryCancelResult = {
	outcome: 'killed' | 'not_found' | 'error';
	/** processlist 里与会话 ID、SQL 前缀都对上的条数（MySQL/Doris）。 */
	matches?: number;
	error?: string;
};

/**
 * 取消正在执行的查询：用另一条连接通知数据库，不依赖原连接（原连接正忙，或者已经断开）。
 * `session` 是执行查询那条连接的会话 ID（MySQL/Doris 的 CONNECTION_ID()、PG 的 pg_backend_pid()）。
 */
export type SqlQueryCanceller = (input: {
	dialect: Dialect;
	session: number;
	sql: string;
}) => Promise<SqlQueryCancelResult>;

/** Invoke an injected canceller through a promise so synchronous throws are handled as cancellation failures. */
export function callSqlQueryCanceller(
	cancel: SqlQueryCanceller,
	input: Parameters<SqlQueryCanceller>[0],
): Promise<SqlQueryCancelResult> {
	return Promise.resolve().then(() => cancel(input));
}

/** 取消最多等多久；超时记为 error，调用方照样拿到中止错误。 */
export const SqlQueryCancelTimeoutMs = 5_000;

/** 调用方中止导致查询被取消：带上取消结果，供日志与 span 记录。 */
export class SqlQueryAbortedError extends Error {
	override readonly name = 'AbortError';
	constructor(
		readonly cancel: SqlQueryCancelResult & { session: number; durationMs: number },
		options?: { cause?: unknown },
	) {
		super(`query cancelled (${cancel.outcome})`, options);
	}
}

/**
 * 执行一条原始 SQL；`signal` 中止时取消数据库上的查询，等取消结果（最多 {@link SqlQueryCancelTimeoutMs}）后立即向调用方
 * 抛出 {@link SqlQueryAbortedError}。Kysely 的连接回收回调会继续等待原查询结束；若取消未生效则关闭 Kysely 实例，避免忙连接回池复用。
 *
 * 只断开客户端连接取消不了查询：Doris 实测断开后查询照常跑到 `query_timeout`（120s），PG 也要等语句结束才发现客户端已断开。
 * 所以先在同一条连接上取得会话 ID，中止时用另一条连接发取消：
 * - MySQL/Doris：`KILL QUERY`（Doris 的连接 ID 只在所属 FE 有效，按 processlist 里的 QueryId 取消才能跨 FE）；
 * - PostgreSQL：`pg_cancel_backend(pid)`。
 * 其它方言、没有 signal 或没有取消器时按原方式执行。
 */
export async function executeCancellableQuery<Row = Record<string, unknown>>(
	db: Kysely<any>,
	dialect: Dialect,
	sqlText: string,
	options: {
		signal?: AbortSignal;
		cancel?: SqlQueryCanceller;
		cancelTimeoutMs?: number;
		/** 取消结束后回调一次（在调用方的异步上下文里），用于日志与 span；回调异常不影响结果。 */
		onCancel?: (result: SqlQueryAbortedError['cancel']) => void;
	} = {},
): Promise<{ rows: Row[]; numAffectedRows?: bigint }> {
	const { signal, cancel, cancelTimeoutMs = SqlQueryCancelTimeoutMs, onCancel } = options;
	if (!signal || !cancel || (dialect !== 'mysql' && dialect !== 'postgres')) {
		return (await sql.raw<Row>(sqlText).execute(db)) as { rows: Row[]; numAffectedRows?: bigint };
	}
	signal.throwIfAborted();
	let resolveAborted!: (error: SqlQueryAbortedError) => void;
	const callerAborted = new Promise<SqlQueryAbortedError>((resolve) => {
		resolveAborted = resolve;
	});
	const operation = db.connection().execute(async (connection) => {
		const sessionSql = dialect === 'mysql' ? 'SELECT CONNECTION_ID() AS id' : 'SELECT pg_backend_pid() AS id';
		const session = Number((await sql.raw<{ id: unknown }>(sessionSql).execute(connection)).rows[0]?.id);
		signal.throwIfAborted();
		const query = sql.raw<Row>(sqlText).execute(connection) as Promise<{ rows: Row[]; numAffectedRows?: bigint }>;
		if (!Number.isSafeInteger(session) || session <= 0) return query;
		let onAbort: (() => void) | undefined;
		const aborted = new Promise<SqlQueryAbortedError>((resolve) => {
			onAbort = () => {
				const startedAt = Date.now();
				void settleSqlQueryCancel(
					callSqlQueryCanceller(cancel, { dialect, session, sql: sqlText }),
					cancelTimeoutMs,
				).then((result) =>
					resolve(
						new SqlQueryAbortedError(
							{ ...result, session, durationMs: Date.now() - startedAt },
							{ cause: signal.reason },
						),
					),
				);
			};
			signal.addEventListener('abort', onAbort, { once: true });
		});
		try {
			const result = await Promise.race([query, aborted]);
			if (result instanceof SqlQueryAbortedError) throw result;
			return result;
		} catch (error) {
			// 取消生效后原查询可能先以数据库错误结束（`user kill query`）：统一改为报告取消结果。
			const reported = signal.aborted && !(error instanceof SqlQueryAbortedError) ? await aborted : error;
			if (reported instanceof SqlQueryAbortedError) {
				try {
					onCancel?.(reported.cancel);
				} catch {
					// 记录失败不影响结果。
				}
				resolveAborted(reported);
				// Return the structured error to the caller now, while this callback remains pending and
				// keeps the Kysely connection out of the pool until the original query settles. A failed
				// or ambiguous cancellation closes the instance immediately; a successful cancellation
				// gets a grace timer. If destruction itself fails, waiting for `query` still prevents reuse.
				let destroyTimer: ReturnType<typeof setTimeout> | undefined;
				const destroy = () =>
					void Promise.resolve()
						.then(() => db.destroy())
						.catch(() => undefined);
				if (reported.cancel.outcome === 'killed') {
					destroyTimer = setTimeout(destroy, cancelTimeoutMs);
					destroyTimer.unref?.();
				} else {
					destroy();
				}
				await query.catch(() => undefined);
				if (destroyTimer) clearTimeout(destroyTimer);
				// The caller already received `reported` through `callerAborted`. Resolve the background
				// connection operation after cleanup so Kysely does not produce a second unhandled rejection.
				return { rows: [] };
			}
			throw reported;
		} finally {
			if (onAbort) signal.removeEventListener('abort', onAbort);
			// The query is awaited on the abort path; this also handles the normal path where it settles first.
			query.catch(() => undefined);
			aborted.catch(() => undefined);
		}
	});
	operation.catch(() => undefined);
	const result = await Promise.race([
		operation.then((value) => ({ kind: 'result' as const, value })),
		callerAborted.then((error) => ({ kind: 'aborted' as const, error })),
	]);
	if (result.kind === 'aborted') throw result.error;
	return result.value;
}

/** 等取消结果，最多 `timeoutMs`；超时或抛错记为 error（不抛出）。executeBoundedQuery 共用。 */
export async function settleSqlQueryCancel(
	pending: Promise<SqlQueryCancelResult>,
	timeoutMs: number = SqlQueryCancelTimeoutMs,
): Promise<SqlQueryCancelResult> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			pending,
			new Promise<SqlQueryCancelResult>((resolve) => {
				timer = setTimeout(() => resolve({ outcome: 'error', error: 'cancel timed out' }), timeoutMs);
				timer.unref?.();
			}),
		]);
	} catch (error) {
		return { outcome: 'error', error: error instanceof Error ? error.message.slice(0, 200) : 'cancel failed' };
	} finally {
		if (timer) clearTimeout(timer);
	}
}

type MysqlLike = {
	query: (sql: string) => Promise<[unknown, unknown]>;
	end: () => Promise<void>;
};

/** 按方言创建取消器：取消用的连接与查询用同一个 URL（同一个用户），连接超时 10s。 */
export function createSqlQueryCanceller(dialect: Dialect, url: string): SqlQueryCanceller | undefined {
	if (dialect === 'mysql') {
		return createMysqlQueryCanceller(async () => {
			const mysql = await import('mysql2/promise');
			return (await mysql.createConnection({ uri: url, connectTimeout: 10_000 })) as unknown as MysqlLike;
		});
	}
	if (dialect === 'postgres') {
		return createPgQueryCanceller(async () => {
			const { Client } = await import('pg');
			const client = new Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
			// 取消用的短连接被终止时 Client 会 emit error：失败已经通过 connect/query 的结果交给调用方，这里只防止进程退出。
			client.on('error', () => undefined);
			return client as unknown as PgLike;
		});
	}
	return undefined;
}

/**
 * MySQL/Doris 取消器：新开一条连接，在 processlist 里按会话 ID 与 SQL 前缀找到正在跑的查询再 KILL。
 * - Doris：连接 ID 只在所属 FE 有效，新连接可能落在别的 FE（`KILL QUERY <id>` 报 Unknown thread id）；
 *   processlist 是集群视图（带 FE 列与 QueryId），`KILL QUERY '<QueryId>'` 可以跨 FE。
 * - MySQL：没有 QueryId 列，用 `KILL QUERY <id>`。
 * 同一个用户只能看到、取消自己的连接。不同 FE 上可能有同 ID 的连接，所以会话 ID 与 SQL 前缀都对上、
 * 且只有一条时才取消；匹配到多条（同一模板的查询）不取消，记 not_found。
 */
export function createMysqlQueryCanceller(connect: () => Promise<MysqlLike>): SqlQueryCanceller {
	return async ({ session, sql: sqlText }) => {
		const conn = await connect();
		try {
			const [rows] = await conn.query('SHOW PROCESSLIST');
			// processlist 的 Info 最多 100 个字符，按归一化空白后的前缀比对。
			const head = normalizeSql(sqlText).slice(0, 64);
			const matched = (Array.isArray(rows) ? rows : []).filter((row) => {
				const record = row as Record<string, unknown>;
				const info = normalizeSql(String(record.Info ?? ''));
				return Number(record.Id) === session && info.length >= 8 && (info.startsWith(head) || head.startsWith(info));
			}) as Array<Record<string, unknown>>;
			if (matched.length !== 1) return { outcome: 'not_found', matches: matched.length };
			const target = matched[0] as Record<string, unknown>;
			// processlist 有 QueryId 列就是 Doris：只按 QueryId 取消。QueryId 为空或格式不对时不回退到连接 ID——
			// Doris 的连接 ID 只在所属 FE 有效，取消用的连接可能在别的 FE 上，按 ID 会误杀同号的其它连接。
			if (Object.hasOwn(target, 'QueryId')) {
				const queryId = typeof target.QueryId === 'string' ? target.QueryId : '';
				// QueryId 是 Doris 生成的十六进制 ID；格式不对就不拼进 SQL。
				if (!/^[0-9a-f-]{8,64}$/iu.test(queryId)) return { outcome: 'not_found', matches: 1 };
				await conn.query(`KILL QUERY '${queryId}'`);
				return { outcome: 'killed', matches: 1 };
			}
			// MySQL：没有 QueryId 列，连接 ID 在单实例内唯一。
			await conn.query(`KILL QUERY ${session}`);
			return { outcome: 'killed', matches: 1 };
		} finally {
			await conn.end().catch(() => undefined);
		}
	};
}

function normalizeSql(text: string): string {
	return text.replace(/\s+/gu, ' ').trim();
}

type PgLike = {
	connect: () => Promise<void>;
	query: (sql: string, values: unknown[]) => Promise<{ rows?: Array<Record<string, unknown>> }>;
	end: () => Promise<void>;
};

/** PostgreSQL 取消器：新开一条连接执行 `pg_cancel_backend(pid)`；同一用户可以取消自己的会话。 */
export function createPgQueryCanceller(create: () => Promise<PgLike>): SqlQueryCanceller {
	return async ({ session }) => {
		const client = await create();
		try {
			await client.connect();
			const result = await client.query('SELECT pg_cancel_backend($1) AS ok', [session]);
			return { outcome: result.rows?.[0]?.ok === true ? 'killed' : 'not_found' };
		} finally {
			await client.end().catch(() => undefined);
		}
	};
}
