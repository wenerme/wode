import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

/** Redis service exposes read-only operations only; every procedure shares this annotation. */
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

const DurationSchema = z.object({ durationMs: z.number().min(0) });
const FieldValueSchema = z.object({ field: z.string(), value: z.string() });

export const RedisFieldInputSchema = z.strictObject({ key: z.string().min(1) });
export const RedisScanInputSchema = z.strictObject({
	cursor: z.string().regex(/^\d+$/u).optional(),
	match: z.string().optional(),
	count: z.number().int().min(1).max(10_000).optional(),
	type: z.enum(['string', 'list', 'set', 'zset', 'hash', 'stream']).optional(),
});
export const RedisPingInputSchema = z.strictObject({});
export const RedisRangeStreamInputSchema = RedisFieldInputSchema.extend({
	start: z.string().min(1).optional(),
	end: z.string().min(1).optional(),
	count: z.number().int().min(1).max(10_000).optional(),
});

export const RedisPingOutputSchema = DurationSchema.extend({
	success: z.boolean(),
	version: z.string().optional(),
	errorCode: z.string().optional(),
});
export const RedisGetOutputSchema = DurationSchema.extend({ value: z.string().optional() });
export const RedisTypeOutputSchema = DurationSchema.extend({ type: z.string() });
export const RedisTtlOutputSchema = DurationSchema.extend({ ttlSeconds: z.number().int() });
export const RedisScanOutputSchema = DurationSchema.extend({ cursor: z.string(), keys: z.array(z.string()) });
export const RedisHashOutputSchema = DurationSchema.extend({ data: z.array(FieldValueSchema) });
export const RedisRangeStreamOutputSchema = DurationSchema.extend({
	data: z.array(z.object({ id: z.string(), fields: z.array(FieldValueSchema) })),
});

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). Mirrors packages/wener-common/src/service/cls/TencentClsContract.ts.
 * `defineContractOperation` (packages/wener-common/src/service/runtime/contract.ts) derives the
 * local `ServiceOperation` tool metadata from this contract.
 */
export const RedisContract = {
	ping: oc.input(RedisPingInputSchema).output(RedisPingOutputSchema).meta(readOnlyTool),
	get: oc.input(RedisFieldInputSchema).output(RedisGetOutputSchema).meta(readOnlyTool),
	getType: oc.input(RedisFieldInputSchema).output(RedisTypeOutputSchema).meta(readOnlyTool),
	getTtl: oc.input(RedisFieldInputSchema).output(RedisTtlOutputSchema).meta(readOnlyTool),
	scan: oc.input(RedisScanInputSchema).output(RedisScanOutputSchema).meta(readOnlyTool),
	getHash: oc.input(RedisFieldInputSchema).output(RedisHashOutputSchema).meta(readOnlyTool),
	rangeStream: oc.input(RedisRangeStreamInputSchema).output(RedisRangeStreamOutputSchema).meta(readOnlyTool),
};
