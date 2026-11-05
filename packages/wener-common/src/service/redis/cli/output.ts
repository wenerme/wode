import { z } from 'zod';
import type { CliTable } from '../../../cli/render/CliTable';
import { RedisFieldInputSchema, RedisGetOutputSchema, RedisHashOutputSchema, RedisPingOutputSchema, RedisRangeStreamOutputSchema, RedisScanOutputSchema, RedisTtlOutputSchema, RedisTypeOutputSchema } from '../schema';

const ScanResultSchema = RedisScanOutputSchema.extend({ pages: z.array(RedisScanOutputSchema).optional() });
export interface RedisCliQueryResult { columns: string[]; rows: Record<string, unknown>[]; durationMs: number }
export function redisCliQueryResult(operation: string, value: unknown): RedisCliQueryResult {
	switch (operation) {
		case 'get': {
			const result = RedisGetOutputSchema.extend(RedisFieldInputSchema.shape).parse(value);
			return { columns: ['key', 'value'], rows: [{ key: result.key, value: result.value ?? null }], durationMs: result.durationMs };
		}
		case 'type': {
			const result = RedisTypeOutputSchema.extend(RedisFieldInputSchema.shape).parse(value);
			return { columns: ['key', 'value'], rows: [{ key: result.key, value: result.type }], durationMs: result.durationMs };
		}
		case 'ttl': {
			const result = RedisTtlOutputSchema.extend(RedisFieldInputSchema.shape).parse(value);
			return { columns: ['key', 'value'], rows: [{ key: result.key, value: result.ttlSeconds }], durationMs: result.durationMs };
		}
		case 'scan': {
			const result = ScanResultSchema.parse(value);
			const rows = result.pages ? result.pages.flatMap((page) => page.keys.map((key) => ({ cursor: page.cursor, key })))
				: result.keys.length ? result.keys.map((key) => ({ cursor: result.cursor, key })) : [{ cursor: result.cursor, key: null }];
			return { columns: ['cursor', 'key'], rows, durationMs: result.durationMs };
		}
		case 'hgetall': {
			const result = RedisHashOutputSchema.parse(value);
			return { columns: ['field', 'value'], rows: result.data, durationMs: result.durationMs };
		}
		case 'xrange': {
			const result = RedisRangeStreamOutputSchema.parse(value);
			return { columns: ['id', 'field', 'value'], rows: result.data.flatMap((entry) => entry.fields.map((field) => ({ id: entry.id, ...field }))), durationMs: result.durationMs };
		}
		default: throw new Error(`Unsupported Redis result: ${operation}`);
	}
}
export function redisCliTable(operation: string): (value: unknown) => CliTable {
	return (value) => { const result = redisCliQueryResult(operation, value); return { headers: result.columns, rows: result.rows.map((row) => result.columns.map((key) => row[key])) }; };
}
export function redisPingTable(value: unknown): CliTable {
	const result = RedisPingOutputSchema.parse(value);
	return { headers: ['success', 'version', 'errorCode', 'durationMs'], rows: [[result.success, result.version, result.errorCode, result.durationMs]] };
}
