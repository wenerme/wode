import { sql } from 'kysely';
import {
	encodeSqlRowsJson,
	fitSqlResultText,
	type SqlBoundedResult,
	type SqlResultEncoding,
	type SqlResultLimits,
	SqlResultLimitsDefault,
	SqlTableMaxCellChars,
} from '../boundedQuery';
import { SqlInputSchema, SqlQueryInputSchema } from '../schemas';
import type { SqlContext } from '../server';
import { formatTable } from '../utils';
import { describeSqlToolError, queryErrorResult } from './queryError';

/** 截断提示（给模型和人看）：只给数字与原因，不回显 SQL。 */
export function sqlTruncationNotice(result: SqlBoundedResult<unknown>): string | undefined {
	const truncated = result.truncated;
	if (!truncated) return undefined;
	if (truncated.reason === 'row_too_large') {
		return `Result truncated: a single row exceeds ${truncated.limits.maxResultBytes} bytes (returned ${result.rows.length} rows before it; reason: row_too_large). Select fewer or shorter columns (for example substring large text/blob fields), or add LIMIT.`;
	}
	const limit =
		truncated.reason === 'max_rows' ? `${truncated.limits.maxRows} rows` : `${truncated.limits.maxResultBytes} bytes`;
	return `Result truncated at ${limit} (returned ${result.rows.length} rows; reason: ${truncated.reason}). Add LIMIT, filter, or aggregate the query to get a complete result.`;
}

/** table 输出里被截断显示的单元格：完整值用 query_json 取。 */
export function sqlCellTruncationNotice(result: SqlBoundedResult<unknown>): string | undefined {
	if (!result.cellsTruncated) return undefined;
	return `${result.cellsTruncated} cell(s) were longer than ${SqlTableMaxCellChars} characters and are shown cut with "…"; use query_json to get full values.`;
}

/**
 * 只读查询工具的结果：第一项内容保持原样（JSON 数组 / 表格文本），截断时追加一项提示，并在 `structuredContent` 里给
 * `{ truncated, rowCount, reason, limits }`。没截断时与之前逐字相同（不加 structuredContent）。
 * 第一项的字节数按最终输出收尾（{@link fitSqlResultText}）：超过 `maxResultBytes` 就从末尾删行。
 */
function boundedResult(
	bounded: SqlBoundedResult<unknown> & { limits?: SqlResultLimits },
	encode: (rows: unknown[]) => string,
	encoding: SqlResultEncoding,
	fallbackLimits: SqlResultLimits,
) {
	// runQuery 由宿主实现时可能不带 limits（旧实现、测试替身）：按服务端上限收尾。table 收尾时同样截断单元格、只渲染保留的行，
	// 所以即使 runQuery 交回的是原始行（没经过收集器），也不会先按大列宽把整张表格式化出来。
	const limits = bounded.limits ?? bounded.truncated?.limits ?? fallbackLimits;
	const { text: primary, result } = fitSqlResultText({ ...bounded, limits }, encode, encoding);
	const notices = [sqlTruncationNotice(result), sqlCellTruncationNotice(result)].filter((text): text is string =>
		Boolean(text),
	);
	if (!notices.length) return { content: [{ type: 'text' as const, text: primary }] };
	return {
		content: [{ type: 'text' as const, text: primary }, ...notices.map((text) => ({ type: 'text' as const, text }))],
		structuredContent: {
			truncated: Boolean(result.truncated),
			rowCount: result.rows.length,
			...(result.truncated ? { reason: result.truncated.reason, limits: { ...result.truncated.limits } } : {}),
			...(result.cellsTruncated ? { cellsTruncated: result.cellsTruncated } : {}),
		},
	};
}

export function registerQueryTools(ctx: SqlContext) {
	const { server, readOnly, getDb, runQuery, textResult, jsonResult, describeQueryError } = ctx;
	const limits = ctx.resultLimits ?? SqlResultLimitsDefault;
	/** 可写工具的错误文案：有宿主摘要（脱敏、限长）时用摘要，没有时保持原有的 `Error: <原文>`。 */
	const writeError = (e: unknown) =>
		textResult(`Error: ${describeSqlToolError(e, describeQueryError) ?? (e instanceof Error ? e.message : e)}`);

	server.registerTool(
		'query_json',
		{
			description:
				'Execute a SELECT query and return results as JSON array. Results are capped (default 10000 rows / 8 MiB); ' +
				'when truncated the response says so — use LIMIT or aggregation for large tables.',
			inputSchema: SqlQueryInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql: sqlStr, maxRows, maxResultBytes }, extra) => {
			try {
				// 调用方断开或取消时（signal 中止）连同数据库上的查询一起取消；到上限时截断（不报错）。
				const result = await runQuery(sqlStr, extra.mcpReq.signal, 'query_json', {
					maxRows,
					maxResultBytes,
					encoding: 'json',
				});
				return boundedResult(result, encodeSqlRowsJson, 'json', limits);
			} catch (e) {
				return queryErrorResult(e, extra.mcpReq.signal, describeQueryError);
			}
		},
	);

	server.registerTool(
		'exec_query',
		{
			description:
				'Execute a SELECT query and return formatted text result. Results are capped (default 10000 rows / 8 MiB) and ' +
				`cells longer than ${SqlTableMaxCellChars} characters are shown cut; the response says so — use LIMIT or ` +
				'aggregation for large tables, and query_json for full values.',
			inputSchema: SqlQueryInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ sql: sqlStr, maxRows, maxResultBytes }, extra) => {
			try {
				const result = await runQuery(sqlStr, extra.mcpReq.signal, 'exec_query', {
					maxRows,
					maxResultBytes,
					encoding: 'table',
				});
				return boundedResult(result, formatTable, 'table', limits);
			} catch (e) {
				return queryErrorResult(e, extra.mcpReq.signal, describeQueryError);
			}
		},
	);

	if (!readOnly) {
		server.registerTool(
			'exec_dml',
			{
				description: 'Execute DML statements (INSERT, UPDATE, DELETE)',
				inputSchema: SqlInputSchema,
			},
			async ({ sql: sqlStr }) => {
				try {
					const { db } = await getDb();
					const result = await sql.raw(sqlStr).execute(db);
					return textResult(`Affected rows: ${result.numAffectedRows ?? 0}`);
				} catch (e) {
					return writeError(e);
				}
			},
		);

		server.registerTool(
			'exec_ddl',
			{
				description: 'Execute DDL statements (CREATE, ALTER, DROP)',
				inputSchema: SqlInputSchema.pick({ sql: true }),
			},
			async ({ sql: sqlStr }) => {
				try {
					const { db } = await getDb();
					await sql.raw(sqlStr).execute(db);
					return textResult('DDL executed successfully');
				} catch (e) {
					return writeError(e);
				}
			},
		);

		server.registerTool(
			'exec_sql',
			{
				description: 'Execute any SQL statement',
				inputSchema: SqlInputSchema,
			},
			async ({ sql: sqlStr }) => {
				try {
					const { db } = await getDb();
					const result = await sql.raw(sqlStr).execute(db);
					if (result.rows && result.rows.length > 0) {
						return jsonResult(result.rows);
					}
					return textResult('SQL executed successfully');
				} catch (e) {
					return writeError(e);
				}
			},
		);
	}
}
