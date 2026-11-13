import { createHash } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/server';
import type { Kysely } from 'kysely';
import {
	createSqlRowCollector,
	executeBoundedQuery,
	resolveSqlResultLimits,
	type SqlBoundedResult,
	type SqlRawConnectionProvider,
	type SqlResultEncoding,
	type SqlResultLimits,
	SqlResultLimitsDefault,
} from './boundedQuery';
import {
	createSqlQueryCanceller,
	executeCancellableQuery,
	type SqlQueryAbortedError,
	type SqlQueryCanceller,
	type SqlQueryCancelResult,
} from './cancellableQuery';
import { registerMetadataTools, registerQueryTools } from './tools';
import { createKyselyInstance, type Dialect, detectDialect } from './utils';

export interface CreateSqlMcpServerOptions {
	/** Database connection URL (mysql://, postgres://, sqlite://, mssql://) */
	url?: string;
	/** Database URL for read operations (overrides url for reads) */
	readUrl?: string;
	/** Database URL for write operations (overrides url for writes) */
	writeUrl?: string;
	/** When true, only register read-only tools (query_json, exec_query, get_version, list_objects, describe_object). Defaults to true when writeUrl is not provided. */
	readOnly?: boolean;
	/** Server name */
	name?: string;
	/** Server version */
	version?: string;
	/** 取消正在执行的查询；默认按方言用同一个 URL 新开连接取消，测试可替换。 */
	createCanceller?: (dialect: Dialect, url: string) => SqlQueryCanceller | undefined;
	/**
	 * 调用方中止、查询被取消后回调一次（在工具调用的异步上下文里），宿主据此写日志与 span。
	 * 不含 SQL 原文与连接信息，只有 hash。
	 */
	onQueryCancel?: (event: SqlQueryCancelEvent) => void;
	/**
	 * 把驱动错误整理成给调用方看的摘要（宿主负责脱敏与限长）。查询工具的错误文案为 `<code>: <摘要>`；
	 * 其它工具为 `Error: <摘要>`。不传、返回 undefined 或抛错时：查询工具用固定文案（不回显驱动原文），
	 * 其它工具保持原样（`Error: <原文>`）。
	 */
	describeQueryError?: SqlQueryErrorDescriber;
	/**
	 * 只读查询工具（query_json、exec_query）的结果上限，缺省 {@link SqlResultLimitsDefault}（1 万行、8 MiB）。
	 * 工具参数 `maxRows`/`maxResultBytes` 只能在这个上限内调小。到上限时截断并返回 `truncated`，不报错；
	 * pg、mysql 逐行读取、到上限即取消数据库上的查询，其它方言读完后截断。
	 */
	resultLimits?: Partial<SqlResultLimits>;
}

/** 驱动错误 → 已脱敏、限长的摘要；返回 undefined 表示不透出。 */
export type SqlQueryErrorDescriber = (error: unknown) => string | undefined;

/** 一次查询取消的记录。 */
export type SqlQueryCancelEvent = SqlQueryCancelResult & {
	tool: string;
	dialect: Dialect;
	/** 数据库会话 ID（MySQL/Doris CONNECTION_ID()、PG pid）。 */
	session: number;
	/** 从中止到拿到取消结果的毫秒数。 */
	durationMs: number;
	/** SQL 原文的 sha256 前 16 位。 */
	sqlHash: string;
};

export interface SqlContext {
	server: McpServer;
	readOnly: boolean;
	getDb: () => Promise<{ db: Kysely<any>; dialect: Dialect }>;
	/**
	 * 执行原始 SQL；`signal` 中止（MCP 请求被取消、客户端断开）时取消数据库上的查询，
	 * 以 SqlQueryAbortedError 结束并回调 onQueryCancel。
	 */
	runQuery: (
		sqlText: string,
		signal: AbortSignal | undefined,
		tool: string,
		/** 工具参数里的上限（只能调小，不传用服务端上限）与输出编码（字节按它计，缺省 json）。 */
		limits?: { maxRows?: number; maxResultBytes?: number; encoding?: SqlResultEncoding },
	) => Promise<SqlBoundedResult<unknown> & { limits?: SqlResultLimits }>;
	/** 服务端结果上限（工具参数的上界）。 */
	resultLimits: SqlResultLimits;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
	/** 见 {@link CreateSqlMcpServerOptions.describeQueryError}。 */
	describeQueryError?: SqlQueryErrorDescriber;
}

/**
 * Create an MCP server for database operations using Kysely.
 * Uses the high-level McpServer API with zod schema validation.
 *
 * @example
 * ```ts
 * // With URL
 * const { server, close } = createSqlMcpServer({ url: 'postgres://localhost/mydb' });
 *
 * // Connect to transport
 * await server.connect(transport);
 * ```
 */
export function createSqlMcpServer(options: CreateSqlMcpServerOptions) {
	const { name = 'sql-mcp-server', version = '1.0.0' } = options;

	let _db: Kysely<any> | undefined;
	let _dialect: Dialect | undefined;
	let _ownsConnection = false;
	let _rawConnection: SqlRawConnectionProvider | undefined;
	let _loadPromise: Promise<{ db: Kysely<any>; dialect: Dialect }> | undefined;

	const server = new McpServer({ name, version });

	// Lazy load kysely - cached promise
	const getDb = async (): Promise<{ db: Kysely<any>; dialect: Dialect }> => {
		if (_db && _dialect) {
			return { db: _db, dialect: _dialect };
		}
		if (!_loadPromise) {
			_loadPromise = (async () => {
				const url = options.url;
				if (!url) {
					throw new Error('Database URL must be provided');
				}
				const dialect = detectDialect(url);
				const result = await createKyselyInstance(url, dialect);
				_db = result.db;
				_dialect = dialect;
				_ownsConnection = result.ownsConnection;
				_rawConnection = result.rawConnection;
				return { db: result.db, dialect };
			})();
		}
		return _loadPromise;
	};

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

	// =========================================================================
	// Register Tools
	// =========================================================================

	const resultLimits = resolveSqlResultLimits(SqlResultLimitsDefault, options.resultLimits);
	/**
	 * executeCancellableQuery 销毁了 `db`（取消失败、结果不明，或取消后原查询迟迟不结束）：丢弃缓存，下次 getDb 重新建连。
	 * rawConnection 与 db 共用同一个连接池，一并丢弃。只在被销毁的就是当前缓存的实例时才清：
	 * 并发的另一个查询晚到的销毁通知不能把已经重建的新实例清掉（新实例会因此泄漏，close 也关不到）。
	 */
	const discardDb = (db: Kysely<any>) => {
		if (_db !== db) return;
		_db = undefined;
		_dialect = undefined;
		_loadPromise = undefined;
		_rawConnection = undefined;
		_ownsConnection = false;
	};
	let canceller: SqlQueryCanceller | undefined;
	const runQuery: SqlContext['runQuery'] = async (sqlText, signal, tool, requested) => {
		const { db, dialect } = await getDb();
		canceller ??= (options.createCanceller ?? createSqlQueryCanceller)(dialect, options.url ?? '');
		const limits = resolveSqlResultLimits(resultLimits, requested);
		const encoding = requested?.encoding ?? 'json';
		const onCancel = (result: SqlQueryAbortedError['cancel']) =>
			options.onQueryCancel?.({
				...result,
				tool,
				dialect,
				sqlHash: createHash('sha256').update(sqlText).digest('hex').slice(0, 16),
			});
		// pg、mysql：逐行读取，到上限停止并取消数据库上的查询。
		if (_rawConnection && (dialect === 'postgres' || dialect === 'mysql')) {
			const result = await executeBoundedQuery(_rawConnection, sqlText, {
				limits,
				encoding,
				signal,
				cancel: canceller,
				onCancel,
			});
			return { ...result, limits };
		}
		// 其它方言（sqlite、mssql）没有逐行接口，pg/mysql 拿不到原生连接时也走这里：读完后截断，至少不把超限的结果交给调用方。
		const { rows } = await executeCancellableQuery(db, dialect, sqlText, {
			signal,
			cancel: canceller,
			onCancel,
			onDestroy: () => discardDb(db),
		});
		return { ...truncateRows(rows, limits, encoding), limits };
	};

	const readOnly = options.readOnly ?? false;
	const ctx: SqlContext = {
		server,
		readOnly,
		getDb,
		runQuery,
		resultLimits,
		textResult,
		jsonResult,
		...(options.describeQueryError ? { describeQueryError: options.describeQueryError } : {}),
	};

	registerQueryTools(ctx);
	registerMetadataTools(ctx);

	return {
		server,

		/**
		 * Get the detected dialect (available after first tool call)
		 */
		get dialect() {
			return _dialect;
		},

		/**
		 * Lazy load database connection
		 */
		loadDb: getDb,

		/**
		 * Close the database connection (if owned by this server)
		 */
		async close() {
			if (_ownsConnection && _db) {
				await _db.destroy();
			}
			await server.close();
			_db = undefined;
			_dialect = undefined;
			_loadPromise = undefined;
		},
	};
}

/** 读完后再截断（没有逐行接口的方言）：与 executeBoundedQuery 同一套计数规则。 */
function truncateRows(
	rows: unknown[],
	limits: SqlResultLimits,
	encoding: SqlResultEncoding,
): SqlBoundedResult<unknown> {
	const collector = createSqlRowCollector<unknown>(limits, encoding);
	for (const row of rows) if (!collector.push(row)) break;
	return {
		rows: collector.rows,
		...(collector.truncated ? { truncated: collector.truncated } : {}),
		...(collector.cellsTruncated ? { cellsTruncated: collector.cellsTruncated } : {}),
	};
}
