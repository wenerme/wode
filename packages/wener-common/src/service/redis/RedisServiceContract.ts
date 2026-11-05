import { RedisTools } from '../runtime/redis-tools';
import type { ServiceContract } from '../runtime/types';

export const RedisServiceContract: ServiceContract = {
	methods: Object.fromEntries(Object.entries(RedisTools).map(([name, tool]) => [name, {
		description: tool.description, inputSchema: tool.inputSchema, outputSchema: tool.outputSchema,
	}])),
};
export type { RedisServiceClient } from './IRedisService';
