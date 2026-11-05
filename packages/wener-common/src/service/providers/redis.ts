import type { ServiceProviderDefinition } from '../registry';
import { RedisServiceOptionsSchema, resolveRedisConnectionOptions } from '../redis/config';
import { createRedisService } from '../redis/createRedisService';
import { RedisServiceError, RedisServiceErrorCodes } from '../redis/errors';
import { RedisServiceContract } from '../redis/RedisServiceContract';
import { RedisOperations } from '../redis/operations';

export const RedisServiceProvider: ServiceProviderDefinition<'redis'> = {
	name: 'redis', aliases: ['valkey'], provides: ['redis'],
	title: 'Redis',
	description: 'Read keys, hashes and streams from Redis or Valkey without modifying data.',
	examples: [
		{ command: 'woctl redis ping', description: 'Check the Redis connection.' },
		{ command: 'woctl redis get example:key', description: 'Read a string key.' },
	],
	optionsSchema: RedisServiceOptionsSchema, contract: RedisServiceContract,
	operations: RedisOperations,
	async create(context) {
		if (context.config.readOnly === false)
			throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'Redis service must be read-only');
		if (typeof context.redisDriver !== 'function')
			throw new RedisServiceError(RedisServiceErrorCodes.InvalidConfig, 'Redis driver is unavailable');
		const connection = resolveRedisConnectionOptions({ baseUrl: context.config.baseUrl, options: context.config.options, readOnly: true });
		return { redis: await createRedisService(connection, { createAdapter: context.redisDriver }) };
	},
};
