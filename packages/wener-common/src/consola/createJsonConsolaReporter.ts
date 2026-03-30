import type { ConsolaReporter, LogObject } from 'consola/core';

/**
 * 结构化 JSON 日志 reporter，参考 Pino/Bunyan 格式
 *
 * 字段顺序：ts → level → tag → msg → 业务字段 → error → args
 *
 * - `ts`    ISO 8601 时间戳
 * - `level` 日志级别（info/warn/error/debug/trace...）
 * - `tag`   consola tag（可选）
 * - `msg`   第一个 string arg 作为消息，后续 string 追加
 * - 对象 arg 展开为顶层字段
 * - Error 序列化为 `error` 字段（name/message/stack/cause）
 *
 * @example
 * consola.withTag('sidecar').info('request', { path: '/api', method: 'GET', duration: 8 })
 * // {"ts":"2026-02-25T05:26:13.132Z","level":"info","tag":"sidecar","msg":"request","path":"/api","method":"GET","duration":8}
 */
export function createJsonConsolaReporter(): ConsolaReporter {
	return {
		log: (logObj: LogObject) => {
			// 先构建头部字段（保持顺序）
			let msg: string | undefined;
			let errorObj: Record<string, unknown> | undefined;
			const fields: Record<string, unknown> = {};
			const rest: unknown[] = [];

			for (const arg of logObj.args) {
				if (typeof arg === 'string') {
					msg = msg ? `${msg} ${arg}` : arg;
				} else if (arg instanceof Error) {
					errorObj = {
						name: arg.name,
						message: arg.message,
						stack: arg.stack,
						...(arg.cause ? { cause: String(arg.cause) } : undefined),
					};
				} else if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
					Object.assign(fields, arg);
				} else if (arg !== undefined) {
					rest.push(arg);
				}
			}

			// 按顺序组装最终对象
			const record: Record<string, unknown> = {
				ts: logObj.date.toISOString(),
				level: logObj.type === 'log' ? 'info' : logObj.type,
			};
			if (logObj.tag) record.tag = logObj.tag;
			if (msg) record.msg = msg;

			// 业务字段
			Object.assign(record, fields);

			// error 和 args 放最后
			if (errorObj) record.error = errorObj;
			if (rest.length) record.args = rest;

			const fn = logObj.level < 2 ? console.error : console.log;
			try {
				fn(JSON.stringify(record, jsonReplacer));
			} catch {
				// 兜底：序列化失败时降级输出
				fn(
					JSON.stringify({
						ts: record.ts,
						level: record.level,
						tag: record.tag,
						msg: record.msg,
						error: 'JSON serialization failed',
					}),
				);
			}
		},
	};
}

function jsonReplacer(_key: string, value: unknown): unknown {
	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
	if (typeof value === 'symbol') return value.toString();
	return value;
}
