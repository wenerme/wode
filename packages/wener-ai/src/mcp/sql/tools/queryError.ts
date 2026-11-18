import { SqlQueryAbortedError } from '../cancellableQuery';
import type { SqlQueryErrorDescriber } from '../server';

/** SQL 查询工具的稳定错误合同；不从供应商的自由文本推断故障类别。 */
export type SqlQueryErrorCode = 'query_cancelled' | 'invalid_query' | 'unknown';

export type SqlQueryErrorResult = {
	isError: true;
	content: { type: 'text'; text: string }[];
	structuredContent: { error: { code: SqlQueryErrorCode; retryable: boolean | null } };
};

/** 没有（或拿不到）驱动错误摘要时的固定文案：不回显驱动原文。 */
const FallbackMessages: Record<SqlQueryErrorCode, string> = {
	query_cancelled: 'SQL query was cancelled by the caller.',
	invalid_query: 'SQL query syntax or arguments are invalid.',
	unknown: 'SQL query failed; inspect the server trace for details.',
};

/** 仅识别已知异常类型和驱动的稳定语法/参数错误码；Doris 的通用 1105 不足以细分故障。 */
export function querySqlErrorCode(
	error: unknown,
	signal?: AbortSignal,
): { code: SqlQueryErrorCode; retryable: boolean | null } {
	if (error instanceof SqlQueryAbortedError || signal?.aborted) return { code: 'query_cancelled', retryable: false };
	if (hasInvalidQueryCode(error)) return { code: 'invalid_query', retryable: false };
	return { code: 'unknown', retryable: null };
}

/**
 * 查询工具的失败结果：`isError` + `structuredContent.error {code, retryable}`，文案 `<code>: <摘要>`。
 * 摘要来自宿主注入的 `describe`（已脱敏、限长的驱动原文）；没有时用固定文案。
 * 调用方取消不透出驱动原文（是我们自己中止的，原文只有取消原因）。
 */
export function queryErrorResult(
	error: unknown,
	signal?: AbortSignal,
	describe?: SqlQueryErrorDescriber,
): SqlQueryErrorResult {
	const { code, retryable } = querySqlErrorCode(error, signal);
	const detail = code === 'query_cancelled' ? undefined : describeSqlToolError(error, describe);
	return {
		isError: true,
		content: [{ type: 'text', text: `${code}: ${detail ?? FallbackMessages[code]}` }],
		structuredContent: { error: { code, retryable } },
	};
}

/** 调用宿主的摘要函数；没传、返回空或抛错时返回 undefined（调用方回退到固定文案或原有行为）。 */
export function describeSqlToolError(error: unknown, describe: SqlQueryErrorDescriber | undefined): string | undefined {
	if (!describe) return undefined;
	try {
		return describe(error) || undefined;
	} catch {
		return undefined;
	}
}

function hasInvalidQueryCode(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const candidate = error as { errno?: unknown; code?: unknown };
	return (
		(candidate.errno === 1064 && candidate.code === 'ER_PARSE_ERROR') ||
		(candidate.errno === 1210 && candidate.code === 'ER_WRONG_ARGUMENTS') ||
		candidate.code === '42601' ||
		candidate.code === '22023'
	);
}
