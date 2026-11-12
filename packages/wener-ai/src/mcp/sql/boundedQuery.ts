import { SqlQueryAbortedError, type SqlQueryCanceller, settleSqlQueryCancel } from './cancellableQuery';

/**
 * 查询结果上限：行数与序列化后的字节数（按 JSON 的 UTF-8 长度计，与返回给调用方的文本同量级）。
 * 服务端给默认值和上界，工具参数只能调小（{@link resolveSqlResultLimits}）。
 */
export type SqlResultLimits = { maxRows: number; maxResultBytes: number };

/** 服务端缺省上限（也是工具参数能取到的最大值，除非宿主另配）：防止不带 LIMIT 的明细查询把整个结果集读进进程堆。 */
export const SqlResultLimitsDefault: Readonly<SqlResultLimits> = Object.freeze({
	maxRows: 10_000,
	maxResultBytes: 8 * 1024 * 1024,
});

/**
 * 截断原因：行数或字节数到上限；`row_too_large` 是单独一行就超过字节上限（例如巨大的 text/blob 字段），
 * 立即停止读取并销毁连接。
 */
export type SqlResultTruncation = { reason: 'max_rows' | 'max_bytes' | 'row_too_large'; limits: SqlResultLimits };

export type SqlBoundedResult<Row> = {
	rows: Row[];
	/** 到上限后停止读取；`rows` 是上限以内的部分。 */
	truncated?: SqlResultTruncation;
	/** table 模式下被截断显示的单元格数（完整值用 query_json 取）。 */
	cellsTruncated?: number;
};

/**
 * 字节上限按**最终输出的编码**计：
 * - `json`：`JSON.stringify(rows, bigintReplacer, 2)`（query_json 的输出）。逐行累加的结果与整体序列化的 UTF-8 字节数**相等**；
 * - `table`：`formatTable(rows)`（exec_query 的输出）。列宽取决于所有行，逐行时只能算下界（不含填充），
 *   读完后用 {@link fitSqlResultText} 按格式化后的实际字节从末尾删行。
 */
export type SqlResultEncoding = 'json' | 'table';

/** query_json 的 JSON 缩进；逐行计数与最终输出必须一致。 */
export const SqlJsonIndent = 2;

/**
 * 字节上限的下限：太小的上限连 `[]`、`(no results)`、表头都放不下，结果照样超限。
 * 服务端配置与工具参数都不能低于它，低于时按它算。
 */
export const SqlResultMinBytes = 1024;

/**
 * 工具参数只能调小：取 `min(请求值, 服务端上限)`；不是正整数的忽略（用服务端上限）。
 * 字节上限不低于 {@link SqlResultMinBytes}。
 */
export function resolveSqlResultLimits(
	server: SqlResultLimits,
	requested: { maxRows?: number; maxResultBytes?: number } | undefined,
): SqlResultLimits {
	const pick = (value: number | undefined, cap: number) =>
		typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? Math.min(value, cap) : cap;
	return {
		maxRows: pick(requested?.maxRows, server.maxRows),
		maxResultBytes: Math.max(SqlResultMinBytes, pick(requested?.maxResultBytes, server.maxResultBytes)),
	};
}

/** JSON 序列化时把 BigInt 写成字符串（驱动可能返回 BigInt，原生 JSON.stringify 会抛错）。 */
export function bigintReplacer(_key: string, value: unknown): unknown {
	return typeof value === 'bigint' ? value.toString() : value;
}

/** 整个结果的 JSON 输出（query_json）。 */
export function encodeSqlRowsJson(rows: readonly unknown[]): string {
	return JSON.stringify(rows, bigintReplacer, SqlJsonIndent);
}

/**
 * 一行在 JSON 输出（缩进 2 的数组）里占的字节：数组里的元素按 4 个空格缩进、内部每行再缩进 2 个空格，
 * 加上前面的 `\n  `（换行 + 2 空格）与分隔逗号。空数组是 `[]`（2 字节），n 行时总字节 =
 * `2 + Σ(元素 + 3) + (n - 1) + 1`（`[`、`]`、每个元素前的 `\n  `、n-1 个逗号、最后一个 `\n`），见 {@link createSqlRowCollector}。
 */
function jsonElementBytes(row: unknown): number {
	const text = JSON.stringify(row, bigintReplacer, SqlJsonIndent) ?? 'null';
	// 数组元素内部的每个换行之后多缩进 2 个空格。
	let newlines = 0;
	for (let index = text.indexOf('\n'); index !== -1; index = text.indexOf('\n', index + 1)) newlines++;
	return Buffer.byteLength(text, 'utf8') + newlines * SqlJsonIndent;
}

/**
 * table 输出（exec_query）里单元格的最大字符数（按 code point，含截断时的 `…`）：超出的截断为前 255 个 + `…`。
 * 截断后恰好 256 个 code point，再截一次不变（幂等：收尾时会对已截断的行再过一遍，不能重复计数）。
 * 只截显示：完整值用 query_json 取（提示里会说）。这样单元格、列宽、整张表的大小都有界，
 * 不会因为一行里有个接近 8 MiB 的字段，把每一行都按那个列宽补齐。
 */
export const SqlTableMaxCellChars = 256;
const Ellipsis = '…';

/**
 * 单元格文本（与 `formatTable` 相同：`null`/`undefined` 写成空串、其它值 `String(v)`），超过 {@link SqlTableMaxCellChars}
 * 截断加 `…`。巨大的字符串、Buffer、TypedArray 只取前缀转换，不把整个值转成字符串。
 */
export function capSqlTableCell(value: unknown): { text: string; cut: boolean } {
	const max = SqlTableMaxCellChars;
	if (value === null || value === undefined) return { text: '', cut: false };
	let text: string;
	/** 只取了前缀（原值更长）：不论前缀多长都要标截断。 */
	let partial = false;
	if (typeof value === 'string') text = value;
	else if (Buffer.isBuffer(value)) {
		// utf8 一个 code point 最多 4 字节：取前 (max + 1) * 4 字节足够得到 max + 1 个 code point。
		const prefix = (max + 1) * 4;
		text = value.subarray(0, prefix).toString('utf8');
		partial = value.byteLength > prefix;
	} else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
		const view = value as unknown as ArrayLike<unknown>;
		const parts: string[] = [];
		let length = 0;
		for (let index = 0; index < view.length && length <= max; index++) {
			const part = String(view[index]);
			parts.push(part);
			length += part.length + 1;
		}
		text = parts.join(',');
		partial = parts.length < view.length;
	} else text = String(value);
	// 前 max - 1 个 code point 的结束位置；数到第 max + 1 个才说明超长（恰好 max 个不截）。
	let count = 0;
	let keepEnd = 0;
	let end = 0;
	for (const char of text) {
		count++;
		if (count === max) keepEnd = end;
		end += char.length;
		if (count > max) return { text: `${text.slice(0, keepEnd)}${Ellipsis}`, cut: true };
	}
	if (!partial) return { text, cut: false };
	return { text: `${count >= max ? text.slice(0, keepEnd) : text}${Ellipsis}`, cut: true };
}

/**
 * 截断后的一行（table 用）：键取第一行的键（与 `formatTable` 一致），值都是截断后的字符串。
 * 收集器在 table 模式下只保留这个，不保留原始行（原始行里的巨大字段不留在内存里）。
 */
function capSqlTableRow(
	row: unknown,
	keys: readonly string[],
): { row: Record<string, string>; widths: number[]; cut: number } {
	const record = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
	const capped: Record<string, string> = {};
	const widths: number[] = [];
	let cut = 0;
	for (const key of keys) {
		const cell = capSqlTableCell(record[key]);
		capped[key] = cell.text;
		widths.push(cell.text.length);
		if (cell.cut) cut++;
	}
	return { row: capped, widths, cut };
}

/**
 * `formatTable` 输出字节数的增量计算（精确）：表头、分隔线、每行都按当前列宽补齐。列宽变大时已有的每一行都多出相应的填充，
 * 所以用「每列的 UTF-8 字节和」+「各行按最终列宽的填充」算：
 * 总字节 = 表头（Σ (wᵢ + 表头填充)）+ 分隔线（Σ wᵢ + 3(C-1)）+ 行（Σ 行内字节 + n·Σ wᵢ − Σ 行内字符数）+ 分隔符与换行。
 * 填充只用空格（1 字节），所以「按列宽补齐」的字节 = 列宽 − 单元格字符数（UTF-16 长度，与 `padEnd` 一致）。
 */
function createTableSizer(keys: readonly string[]) {
	const columns = keys.length;
	const widths = keys.map((key) => key.length);
	const headerBytes = keys.reduce((sum, key) => sum + Buffer.byteLength(key, 'utf8') - key.length, 0);
	let rowCount = 0;
	/** Σ 行内单元格的 (UTF-8 字节 − UTF-16 长度)：多字节字符比填充多出来的部分。 */
	let extraBytes = 0;
	const separators = Math.max(0, columns - 1) * 3;
	const total = (rows: number, columnWidths: readonly number[]) => {
		const width = columnWidths.reduce((sum, value) => sum + value, 0);
		// 表头行 + 分隔线 + 每行；行之间、表头与分隔线、分隔线与第一行之间各一个换行（共 rows + 1 个）。
		return (
			width + headerBytes + separators + (width + separators) + rows * (width + separators) + extraBytes + rows + 1
		);
	};
	return {
		/** 加入这一行之后的总字节（不改变状态）。 */
		bytesWith(cells: { row: Record<string, string>; widths: number[] }): number {
			const next = widths.map((value, index) => Math.max(value, cells.widths[index] ?? 0));
			let extra = extraBytes;
			for (const key of keys) {
				const text = cells.row[key] ?? '';
				extra += Buffer.byteLength(text, 'utf8') - text.length;
			}
			const saved = extraBytes;
			extraBytes = extra;
			const bytes = total(rowCount + 1, next);
			extraBytes = saved;
			return bytes;
		},
		add(cells: { row: Record<string, string>; widths: number[] }): void {
			for (let index = 0; index < columns; index++)
				widths[index] = Math.max(widths[index] ?? 0, cells.widths[index] ?? 0);
			for (const key of keys) {
				const text = cells.row[key] ?? '';
				extraBytes += Buffer.byteLength(text, 'utf8') - text.length;
			}
			rowCount++;
		},
	};
}

/**
 * 不序列化就能算的下界：字符串至少它的长度（JSON 转义只会更长）、Buffer/TypedArray 至少字节数
 * （JSON 是数字数组，table 是十进制列表，都更长）。超过上限就判 `row_too_large`，不为了算精确值把巨大的字段再复制一份。
 */
function cheapLowerBound(row: unknown): number {
	if (!row || typeof row !== 'object') return 0;
	let bytes = 0;
	for (const value of Object.values(row as Record<string, unknown>)) {
		if (typeof value === 'string') bytes += value.length;
		else if (ArrayBuffer.isView(value)) bytes += value.byteLength;
	}
	return bytes;
}

/**
 * 边读边计数：到上限就不再保留，`push` 返回 false 让调用方停止读取（后续行一律丢弃）。
 * - json：字节按最终输出精确计（缩进 2）；保留原始行；
 * - table：先把单元格截断到 {@link SqlTableMaxCellChars}，按 `formatTable` 的输出精确计字节；**只保留截断后的行**
 *   （格式化之前就算好保留几行，只渲染保留的行）；
 * - 导致超出字节上限的那一行不保留；单独一行就超过上限时原因是 `row_too_large`。
 */
export function createSqlRowCollector<Row>(limits: SqlResultLimits, encoding: SqlResultEncoding = 'json') {
	const rows: Row[] = [];
	let bytes = encoding === 'json' ? 2 : 0;
	let truncated: SqlResultTruncation | undefined;
	let cellsTruncated = 0;
	let table: { keys: string[]; sizer: ReturnType<typeof createTableSizer> } | undefined;
	const pushJson = (row: Row): boolean => {
		if (cheapLowerBound(row) > limits.maxResultBytes) {
			truncated = { reason: 'row_too_large', limits };
			return false;
		}
		// 元素 + `\n  `（3）+ 逗号或末尾换行（1）。
		const size = jsonElementBytes(row) + 4;
		if (2 + size > limits.maxResultBytes) {
			truncated = { reason: 'row_too_large', limits };
			return false;
		}
		if (bytes + size > limits.maxResultBytes) {
			truncated = { reason: 'max_bytes', limits };
			return false;
		}
		bytes += size;
		rows.push(row);
		return true;
	};
	const pushTable = (row: Row): boolean => {
		if (!table) {
			const keys = row && typeof row === 'object' ? Object.keys(row as Record<string, unknown>) : [];
			table = { keys, sizer: createTableSizer(keys) };
		}
		const cells = capSqlTableRow(row, table.keys);
		// 这一行**单独**编码（表头 + 这一行）就超过上限 → row_too_large，不论前面保留了几行
		// （只看「前面有没有行」时，第二行起的超大行会被记成 max_bytes，取消后连接被归还）。
		if (createTableSizer(table.keys).bytesWith(cells) > limits.maxResultBytes) {
			truncated = { reason: 'row_too_large', limits };
			return false;
		}
		const next = table.sizer.bytesWith(cells);
		if (next > limits.maxResultBytes) {
			truncated = { reason: 'max_bytes', limits };
			return false;
		}
		table.sizer.add(cells);
		cellsTruncated += cells.cut;
		rows.push(cells.row as Row);
		return true;
	};
	return {
		rows,
		get truncated() {
			return truncated;
		},
		/** table 模式下被截断（加了 `…`）的单元格数。 */
		get cellsTruncated() {
			return cellsTruncated;
		},
		push(row: Row): boolean {
			if (truncated) return false;
			if (rows.length >= limits.maxRows) {
				truncated = { reason: 'max_rows', limits };
				return false;
			}
			return encoding === 'json' ? pushJson(row) : pushTable(row);
		},
	};
}

/**
 * 按最终输出收尾：
 * - table：**先**用与收集器相同的截断与精确计数决定保留几行（原始行或已截断的行都可以，截断是幂等的），只渲染保留的行，
 *   峰值字符串不超过上限（不会先把全部行按大列宽格式化出来）；
 * - json：逐行计数已经精确，这里只做兜底：超过上限就从末尾二分删行。
 * 都会在最后再核对一次；删到 0 行的输出（`[]`、`(no results)`）小于 {@link SqlResultMinBytes}。
 */
export function fitSqlResultText<Row>(
	result: SqlBoundedResult<Row> & { limits: SqlResultLimits },
	encode: (rows: Row[]) => string,
	encoding: SqlResultEncoding = 'json',
): { text: string; result: SqlBoundedResult<Row> } {
	const max = result.limits.maxResultBytes;
	if (encoding === 'table') {
		const collector = createSqlRowCollector<Row>({ maxRows: Number.MAX_SAFE_INTEGER, maxResultBytes: max }, 'table');
		for (const row of result.rows) if (!collector.push(row)) break;
		const kept = collector.rows;
		const cellsTruncated = (result.cellsTruncated ?? 0) + collector.cellsTruncated;
		const truncated =
			kept.length < result.rows.length
				? (result.truncated ?? { reason: 'max_bytes' as const, limits: result.limits })
				: result.truncated;
		const fitted = { rows: kept, truncated, cellsTruncated };
		const text = encode(kept);
		if (Buffer.byteLength(text, 'utf8') <= max) return { text, result: compact(fitted) };
		// 兜底（精确计数下不会发生）：从末尾删行。
		const trimmed = trimTail(fitted, encode, max, result.limits);
		return { text: trimmed.text, result: compact(trimmed.result) };
	}
	const text = encode(result.rows);
	if (Buffer.byteLength(text, 'utf8') <= max) return { text, result };
	return trimTail(result, encode, max, result.limits);
}

function trimTail<Row>(
	result: SqlBoundedResult<Row>,
	encode: (rows: Row[]) => string,
	max: number,
	limits: SqlResultLimits,
): { text: string; result: SqlBoundedResult<Row> } {
	let low = 0;
	let high = result.rows.length - 1;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		if (Buffer.byteLength(encode(result.rows.slice(0, mid)), 'utf8') <= max) low = mid;
		else high = mid - 1;
	}
	const rows = result.rows.slice(0, low);
	return {
		text: encode(rows),
		result: { ...result, rows, truncated: result.truncated ?? { reason: 'max_bytes', limits } },
	};
}

function compact<Row>(result: SqlBoundedResult<Row>): SqlBoundedResult<Row> {
	return {
		rows: result.rows,
		...(result.truncated ? { truncated: result.truncated } : {}),
		...(result.cellsTruncated ? { cellsTruncated: result.cellsTruncated } : {}),
	};
}

type SqlRawEmitter = { on: (event: string, listener: (...args: any[]) => void) => unknown };

/** 连接级事件（`error`、`end`）：断网、服务端关闭时驱动在连接上发，查询本身不一定再发 error/end。 */
type SqlRawConnectionEvents = {
	on: (event: 'error' | 'end', listener: (...args: any[]) => void) => unknown;
	removeListener: (event: 'error' | 'end', listener: (...args: any[]) => void) => unknown;
};

/**
 * 原生驱动连接（与 Kysely 同一个连接池借出）。两种驱动在**不传回调**时都只逐行 emit、不累积结果集：
 * - pg：`client.query(new Query(text))`，emit `row`/`error`/`end`。**前提**是这次查询不带 `query_timeout`：
 *   pg 8.23 有 `query_timeout` 时会给 Query 补一个 callback，结果改为内部累积、错误只走 callback 不 emit。
 *   用 {@link createPgRawConnection} 包一层：执行时关掉连接级 `query_timeout`，由 {@link executeBoundedQuery} 自己计时取消；
 * - mysql2（callback 风格 PoolConnection）：`connection.query(text)`，emit `result`/`error`/`end`。
 * `readTimeoutMs`：客户端读超时（到点取消并销毁连接）；不给就不计时（MySQL/Doris 靠服务端 `query_timeout`）。
 */
export type SqlRawConnection =
	| {
			dialect: 'postgres';
			client: SqlRawConnectionEvents & {
				query: (query: SqlRawEmitter) => unknown;
				release: (destroy?: boolean) => void;
			};
			createQuery: (text: string) => SqlRawEmitter;
			readTimeoutMs?: number;
	  }
	| {
			dialect: 'mysql';
			connection: SqlRawConnectionEvents & {
				query: (sql: string) => SqlRawEmitter;
				release: () => void;
				destroy: () => void;
			};
			readTimeoutMs?: number;
	  };

/** pg `Client`（Pool 借出的）里 {@link createPgRawConnection} 用到的部分。 */
type PgClientLike = SqlRawConnectionEvents & {
	query: (query: unknown) => unknown;
	release: (destroy?: boolean | Error) => void;
	connectionParameters?: { query_timeout?: number };
};

/**
 * 把 pg Pool 借出的 Client 包成 {@link SqlRawConnection}：
 * - 每次 `query` 执行时把连接级 `query_timeout` 关掉（pg 在 `Client.query` 里**同步**读它，读完立刻恢复，不影响这条连接上的
 *   Kysely 查询）。这样 Query 不会被补 callback：逐行 emit、不在内部累积，出错 emit `error`；
 * - 执行后核对 Query 确实没有 callback（pg 升级后行为变了就 fail closed：抛错，连接销毁），不悄悄回到累积；
 * - 原来的 `query_timeout` 作为 `readTimeoutMs` 交给 executeBoundedQuery：自己计时，到点 `pg_cancel_backend` 并销毁连接。
 * 服务端 `statement_timeout` 不受影响（它是连接启动参数）。
 */
export function createPgRawConnection(
	client: PgClientLike,
	createQuery: (text: string) => SqlRawEmitter,
): Extract<SqlRawConnection, { dialect: 'postgres' }> {
	const readTimeoutMs = client.connectionParameters?.query_timeout || undefined;
	return {
		dialect: 'postgres',
		readTimeoutMs,
		createQuery,
		client: {
			on: (event, listener) => client.on(event, listener),
			removeListener: (event, listener) => client.removeListener(event, listener),
			release: (destroy) => client.release(destroy),
			query: (query) => {
				const params = client.connectionParameters;
				const saved = params?.query_timeout;
				if (params) params.query_timeout = undefined;
				try {
					client.query(query);
				} finally {
					if (params) params.query_timeout = saved;
				}
				if (typeof (query as { callback?: unknown }).callback === 'function') {
					throw new Error(
						'pg Query has a callback (query_timeout is still set): rows would accumulate inside the driver, refusing to execute',
					);
				}
			},
		},
	};
}

/** 宿主提供：借一条原生连接。 */
export type SqlRawConnectionProvider = () => Promise<SqlRawConnection>;

/** 截断后等取消生效（查询以取消错误结束）的最长时间；超时就销毁这条连接（不归还连接池）。 */
export const SqlTruncateCancelGraceMs = 3_000;

/**
 * 有上限地执行一条只读查询：
 * 1. 逐行读取，驱动不累积整个结果集；到行数或字节上限就停止保留；
 * 2. 同时用 {@link SqlQueryCanceller} 取消数据库上的查询（MySQL/Doris `KILL QUERY`、PG `pg_cancel_backend`），
 *    查询以取消错误结束后归还连接；没有取消器、取消没生效、或 {@link SqlTruncateCancelGraceMs} 内没结束，就销毁这条连接；
 * 3. 截断不是错误：返回 `truncated`，取消产生的数据库错误被吞掉。
 *
 * `signal` 中止的语义与 `executeCancellableQuery` 相同：取消查询，以 {@link SqlQueryAbortedError} 结束。
 */
export async function executeBoundedQuery<Row = Record<string, unknown>>(
	provide: SqlRawConnectionProvider,
	sqlText: string,
	options: {
		limits: SqlResultLimits;
		/** 字节上限按哪种输出编码计，缺省 json。 */
		encoding?: SqlResultEncoding;
		signal?: AbortSignal;
		cancel?: SqlQueryCanceller;
		cancelTimeoutMs?: number;
		truncateGraceMs?: number;
		onCancel?: (result: SqlQueryAbortedError['cancel']) => void;
	},
): Promise<SqlBoundedResult<Row>> {
	const { limits, signal, cancel, onCancel } = options;
	const graceMs = options.truncateGraceMs ?? SqlTruncateCancelGraceMs;
	signal?.throwIfAborted();
	const raw = await provide();
	const events = raw.dialect === 'postgres' ? raw.client : raw.connection;
	/**
	 * 连接级断开：mysql2 断网时 `error`/`end` 发在连接上，Query 不一定再发 error/end。读会话 ID 与业务查询期间
	 * 一直监听，一旦断开就让当前在等的那一步结束（{@link lostSignal}），连接销毁；结束时摘掉监听（归还连接池前）。
	 */
	let lost: Error | undefined;
	const lostWaiters = new Set<(error: Error) => void>();
	const onConnectionError = (error: unknown) => {
		lost ??= error instanceof Error ? error : new Error('connection error');
		for (const waiter of lostWaiters) waiter(lost);
	};
	const onConnectionEnd = () => onConnectionError(new Error('Connection terminated unexpectedly'));
	events.on('error', onConnectionError);
	events.on('end', onConnectionEnd);
	const lostSignal = (): Promise<never> =>
		new Promise<never>((_, reject) => {
			if (lost) return reject(lost);
			lostWaiters.add(reject);
		});
	let settled = false;
	const finish = (mode: 'release' | 'destroy') => {
		if (settled) return;
		settled = true;
		lostWaiters.clear();
		events.removeListener('error', onConnectionError);
		events.removeListener('end', onConnectionEnd);
		// 销毁的连接不再复用：挂一个空的 error 监听，驱动之后再发的 error 不成为未捕获异常。
		if (mode === 'destroy') events.on('error', () => undefined);
		if (raw.dialect === 'postgres') raw.client.release(mode === 'destroy');
		else if (mode === 'destroy') raw.connection.destroy();
		else raw.connection.release();
	};
	/** 客户端读超时（pg 的 query_timeout 改由这里计）：从借到连接起算，覆盖读会话 ID 与业务查询。 */
	let readTimer: ReturnType<typeof setTimeout> | undefined;
	let readTimedOut = false;
	const readTimeout = new Promise<never>((_, reject) => {
		if (!raw.readTimeoutMs) return;
		readTimer = setTimeout(() => {
			readTimedOut = true;
			reject(new Error('Query read timeout'));
		}, raw.readTimeoutMs);
		readTimer.unref?.();
	});
	readTimeout.catch(() => undefined);

	try {
		const session = await Promise.race([readSession(raw), lostSignal(), readTimeout]);
		signal?.throwIfAborted();
		const collector = createSqlRowCollector<Row>(limits, options.encoding ?? 'json');
		let stopped: 'truncate' | 'oversize' | 'abort' | undefined;
		let cancelling: Promise<{ outcome: string; startedAt: number; result: SqlQueryAbortedError['cancel'] }> | undefined;
		const requestCancel = () => {
			if (cancelling || !cancel || !session) return;
			const startedAt = Date.now();
			cancelling = settleSqlQueryCancel(
				cancel({ dialect: raw.dialect, session, sql: sqlText }),
				options.cancelTimeoutMs,
			).then((result) => ({
				outcome: result.outcome,
				startedAt,
				result: { ...result, session, durationMs: Date.now() - startedAt },
			}));
		};

		let graceTimer: ReturnType<typeof setTimeout> | undefined;
		let graceExpired = false;
		let onAbort: (() => void) | undefined;
		const outcome = await new Promise<'end' | 'truncated' | 'oversize' | 'aborted'>((resolve, reject) => {
			const query = run(raw, sqlText);
			const stop = (why: 'truncate' | 'oversize' | 'abort') => {
				if (stopped) return;
				stopped = why;
				requestCancel();
				if (why === 'oversize') {
					// 单行就超过上限：不等取消、不等查询结束，立刻销毁这条连接（不归还连接池），取消在后台继续发。
					// 残余风险（接受）：驱动把一整行（含巨大的单个字段）组装完才 emit，这一行在被我们丢弃之前已经整个在内存里，
					// 这里挡不住，需要宿主给足堆空间。下一行起不会再读。
					finish('destroy');
					resolve('oversize');
					return;
				}
				if (why === 'abort') {
					// 中止：等取消结果（最多 cancelTimeoutMs）就结束，不等查询本身。
					void (cancelling ?? Promise.resolve(undefined)).then(() => resolve('aborted'));
					return;
				}
				// 截断：最多再等 graceMs 让查询以取消错误结束；到点就销毁连接，不等。
				graceTimer = setTimeout(() => {
					graceExpired = true;
					resolve('truncated');
				}, graceMs);
				graceTimer.unref?.();
			};
			const settledAs = () => (stopped === 'abort' ? 'aborted' : stopped === 'oversize' ? 'oversize' : 'truncated');
			query.on(raw.dialect === 'postgres' ? 'row' : 'result', (row: Row) => {
				if (stopped) return;
				if (!collector.push(row)) stop(collector.truncated?.reason === 'row_too_large' ? 'oversize' : 'truncate');
			});
			// 截断、中止或销毁后的错误（PG `57014 canceling statement`、连接被关闭，MySQL `Query execution was interrupted`）是预期的。
			// 监听一直挂着：销毁之后驱动还可能再 emit error，没有监听会成为未捕获异常。
			query.on('error', (error: unknown) => (stopped ? resolve(settledAs()) : reject(error)));
			query.on('end', () => resolve(stopped ? settledAs() : 'end'));
			// 连接断开（Query 不再发 error/end）：截断或中止之后断开按已停止处理，否则以连接错误失败（连接随后销毁）。
			lostSignal().catch((error: Error) => (stopped ? resolve(settledAs()) : reject(error)));
			// 读超时：取消数据库上的查询，以超时错误失败（连接随后销毁）。截断之后到点按截断结束。
			readTimeout.catch((error: Error) => {
				if (stopped) return resolve(settledAs());
				requestCancel();
				reject(error);
			});
			if (signal) {
				onAbort = () => stop('abort');
				signal.addEventListener('abort', onAbort, { once: true });
			}
		}).finally(() => {
			if (graceTimer) clearTimeout(graceTimer);
			if (onAbort) signal?.removeEventListener('abort', onAbort);
		});

		if (outcome === 'aborted') {
			const cancelled = cancelling ? await cancelling : undefined;
			finish('destroy');
			const error = new SqlQueryAbortedError(
				cancelled?.result ?? { outcome: 'not_found', session: session ?? 0, durationMs: 0 },
				{ cause: signal?.reason },
			);
			try {
				onCancel?.(error.cancel);
			} catch {
				// 记录失败不影响结果。
			}
			throw error;
		}
		const done = () =>
			compact({ rows: collector.rows, truncated: collector.truncated, cellsTruncated: collector.cellsTruncated });
		if (outcome === 'oversize') {
			// 连接已经销毁；后台的取消不等（settleSqlQueryCancel 不会 reject）。
			void cancelling;
			return done();
		}
		if (outcome === 'truncated') {
			// 查询已经以取消错误或正常结束（不是 grace 超时）且取消确认生效 → 连接干净，归还；否则销毁。
			const cancelled = cancelling ? await cancelling : undefined;
			finish(cancelled?.outcome === 'killed' && !graceExpired && !lost && !readTimedOut ? 'release' : 'destroy');
			return done();
		}
		finish(lost || readTimedOut ? 'destroy' : 'release');
		return done();
	} catch (error) {
		finish('destroy');
		throw error;
	} finally {
		if (readTimer) clearTimeout(readTimer);
	}
}

function run(raw: SqlRawConnection, text: string): SqlRawEmitter {
	if (raw.dialect === 'postgres') {
		const query = raw.createQuery(text);
		raw.client.query(query);
		return query;
	}
	return raw.connection.query(text);
}

async function readSession(raw: SqlRawConnection): Promise<number | undefined> {
	const text = raw.dialect === 'postgres' ? 'SELECT pg_backend_pid() AS id' : 'SELECT CONNECTION_ID() AS id';
	const rows = await new Promise<unknown[]>((resolve, reject) => {
		const query = run(raw, text);
		const collected: unknown[] = [];
		query.on(raw.dialect === 'postgres' ? 'row' : 'result', (row: unknown) => collected.push(row));
		query.on('error', reject);
		query.on('end', () => resolve(collected));
	});
	const id = Number((rows[0] as { id?: unknown } | undefined)?.id);
	return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
