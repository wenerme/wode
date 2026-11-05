import { z } from 'zod';

const DurationSchema = z.object({ durationMs: z.number().min(0) });
const FieldValueSchema = z.object({ field: z.string(), value: z.string() });
export const RedisFieldInputSchema = z.strictObject({ key: z.string().min(1) });
export const RedisScanInputSchema = z.strictObject({
	cursor: z.string().regex(/^\d+$/u).optional(), match: z.string().optional(),
	count: z.number().int().min(1).max(10_000).optional(),
	type: z.enum(['string', 'list', 'set', 'zset', 'hash', 'stream']).optional(),
});
export const RedisPingInputSchema = z.strictObject({});
export const RedisRangeStreamInputSchema = RedisFieldInputSchema.extend({
	start: z.string().min(1).optional(), end: z.string().min(1).optional(), count: z.number().int().min(1).max(10_000).optional(),
});
export const RedisPingOutputSchema = DurationSchema.extend({ success: z.boolean(), version: z.string().optional(), errorCode: z.string().optional() });
export const RedisGetOutputSchema = DurationSchema.extend({ value: z.string().optional() });
export const RedisTypeOutputSchema = DurationSchema.extend({ type: z.string() });
export const RedisTtlOutputSchema = DurationSchema.extend({ ttlSeconds: z.number().int() });
export const RedisScanOutputSchema = DurationSchema.extend({ cursor: z.string(), keys: z.array(z.string()) });
export const RedisHashOutputSchema = DurationSchema.extend({ data: z.array(FieldValueSchema) });
export const RedisRangeStreamOutputSchema = DurationSchema.extend({ data: z.array(z.object({ id: z.string(), fields: z.array(FieldValueSchema) })) });
