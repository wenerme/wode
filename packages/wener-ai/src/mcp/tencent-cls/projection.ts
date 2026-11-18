/**
 * 日志条目的字段投影与单字段截断。
 *
 * 背景：网关类日志常把完整的请求/响应体写进单个字段（如 `request_body`），
 * 实测单字段可达 50KB、单次 search（limit=200）约 15MB，超过 MCP 客户端
 * 的响应上限后整次调用失败。调用方调小 limit 并不能解决“单条太大”，因此在
 * 服务端按字段截断，并允许只取需要的字段。
 */

/** 单字段默认最多保留的字符数 */
export const DEFAULT_MAX_FIELD_CHARS = 2000;

/** 投影时始终保留的元数据字段（用于 log_context 定位与时间排序） */
const META_FIELDS = new Set(['_time', '_topic', '_pkgId', '_pkgLogId']);

export interface ProjectionOptions {
	/** 只保留这些字段（元数据字段始终保留）；为空表示保留全部 */
	fields?: string[];
	/** 单个字符串字段最多保留的字符数；0 表示不截断 */
	maxFieldChars?: number;
}

export interface ProjectionStats {
	/** 被截断的字段名 → 被截断的条数 */
	truncatedFields: Record<string, number>;
	/** 被截断字段中最长的原始字符数 */
	maxOriginalChars: number;
}

export function createProjectionStats(): ProjectionStats {
	return { truncatedFields: Object.create(null), maxOriginalChars: 0 };
}

/** 截断单个字符串，保留开头并注明被省略的字符数 */
export function truncateText(value: string, maxChars: number): string {
	if (maxChars <= 0 || value.length <= maxChars) return value;
	return `${value.slice(0, maxChars)}…[truncated ${value.length - maxChars} of ${value.length} chars]`;
}

/**
 * 对单条日志做字段投影和截断，原对象不变。
 * 只截断顶层字符串字段：CLS 的 LogJson 是扁平键值，嵌套对象为罕见情况，
 * 超长时按其 JSON 文本整体截断。
 */
export function projectLog(
	log: Record<string, unknown>,
	options: ProjectionOptions,
	stats: ProjectionStats,
): Record<string, unknown> {
	const { fields, maxFieldChars = DEFAULT_MAX_FIELD_CHARS } = options;
	const keep = fields?.length ? new Set(fields) : undefined;
	const out: Record<string, unknown> = Object.create(null);
	for (const [key, value] of Object.entries(log)) {
		if (keep && !keep.has(key) && !META_FIELDS.has(key)) continue;
		if (maxFieldChars <= 0 || META_FIELDS.has(key)) {
			out[key] = value;
			continue;
		}
		const text =
			typeof value === 'string'
				? value
				: value !== null && typeof value === 'object'
					? JSON.stringify(value)
					: undefined;
		if (text === undefined || text.length <= maxFieldChars) {
			out[key] = value;
			continue;
		}
		out[key] = truncateText(text, maxFieldChars);
		stats.truncatedFields[key] = (stats.truncatedFields[key] ?? 0) + 1;
		stats.maxOriginalChars = Math.max(stats.maxOriginalChars, text.length);
	}
	return out;
}

/** 生成返回给调用方的截断说明；没有截断时返回 undefined */
export function describeTruncation(stats: ProjectionStats, maxFieldChars: number) {
	const fields = Object.keys(stats.truncatedFields);
	if (!fields.length) return undefined;
	return {
		maxFieldChars,
		fields: stats.truncatedFields,
		maxOriginalChars: stats.maxOriginalChars,
		hint: 'Fields were truncated. For full content, narrow the query (e.g. by trace_id), set `fields` to only the needed fields and `maxFieldChars: 0`.',
	};
}
