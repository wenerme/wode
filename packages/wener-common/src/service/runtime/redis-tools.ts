import { z } from 'zod';
import {
	RedisFieldInputSchema, RedisGetOutputSchema, RedisHashOutputSchema, RedisPingInputSchema, RedisPingOutputSchema,
	RedisRangeStreamInputSchema, RedisRangeStreamOutputSchema, RedisScanInputSchema, RedisScanOutputSchema,
	RedisTtlOutputSchema, RedisTypeOutputSchema,
} from '../redis/schema';
import type { ServiceSchema } from './types';

export const RedisToolInputs = {
	ping: RedisPingInputSchema, get: RedisFieldInputSchema, getType: RedisFieldInputSchema, getTtl: RedisFieldInputSchema,
	scan: RedisScanInputSchema, getHash: RedisFieldInputSchema, rangeStream: RedisRangeStreamInputSchema,
};
const outputs = {
	ping: RedisPingOutputSchema, get: RedisGetOutputSchema, getType: RedisTypeOutputSchema, getTtl: RedisTtlOutputSchema,
	scan: RedisScanOutputSchema, getHash: RedisHashOutputSchema, rangeStream: RedisRangeStreamOutputSchema,
};
export const RedisTools: ServiceSchema['tools'] = Object.fromEntries(
	(Object.keys(RedisToolInputs) as Array<keyof typeof RedisToolInputs>).map((name) => [name, {
		description: `Redis ${name}`,
		inputSchema: z.toJSONSchema(RedisToolInputs[name]), outputSchema: z.toJSONSchema(outputs[name]),
		annotations: { readOnlyHint: true, destructiveHint: false },
	}]),
);
