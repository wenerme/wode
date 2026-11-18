import {
	oc,
	type ContractRouterClient,
	type InferContractRouterInputs,
	type InferContractRouterOutputs,
} from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const redis = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

const DurationSchema = z.object({ durationMs: z.number().min(0) });
const FieldValueSchema = z.object({ field: z.string(), value: z.string() });

export const RedisFieldInputSchema = z.strictObject({ key: z.string().min(1) });
export const RedisScanInputSchema = z.strictObject({
	cursor: z.string().regex(/^\d+$/u).optional(),
	match: z.string().optional(),
	count: z.number().int().min(1).max(10_000).optional(),
	type: z.enum(['string', 'list', 'set', 'zset', 'hash', 'stream']).optional(),
}).default({});
export const RedisPingInputSchema = z.strictObject({}).default({});
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

/** oRPC contract is the source of truth for Redis input/output schemas and tool metadata. */
export const RedisServiceContract = {
	ping: redis.input(RedisPingInputSchema).output(RedisPingOutputSchema).meta(readOnlyTool),
	get: redis.input(RedisFieldInputSchema).output(RedisGetOutputSchema).meta(readOnlyTool),
	getType: redis.input(RedisFieldInputSchema).output(RedisTypeOutputSchema).meta(readOnlyTool),
	getTtl: redis.input(RedisFieldInputSchema).output(RedisTtlOutputSchema).meta(readOnlyTool),
	scan: redis.input(RedisScanInputSchema).output(RedisScanOutputSchema).meta(readOnlyTool),
	getHash: redis.input(RedisFieldInputSchema).output(RedisHashOutputSchema).meta(readOnlyTool),
	rangeStream: redis.input(RedisRangeStreamInputSchema).output(RedisRangeStreamOutputSchema).meta(readOnlyTool),
};

export type RedisServiceInputs = InferContractRouterInputs<typeof RedisServiceContract>;
export type RedisServiceOutputs = InferContractRouterOutputs<typeof RedisServiceContract>;
/** Per-call transport settings stay in the oRPC client context; cancellation remains in signal. */
export type RedisServiceClientContext = { timeoutMs?: number };
export type IRedisServiceContract = ContractRouterClient<typeof RedisServiceContract, RedisServiceClientContext>;
export type RedisServiceCallOptions = NonNullable<Parameters<IRedisServiceContract['get']>[1]>;
export type RedisServiceClient = IRedisServiceContract;
