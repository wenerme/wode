import { defineContractOperation } from '../runtime/contract';
import { RedisServiceContract } from './RedisServiceContract';
import { RedisServiceCapability } from './IRedisService';

export const RedisOperations = {
	ping: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.ping,
		invoke: (service, input, options) => service.ping(input, options),
	}),
	get: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.get,
		invoke: (service, input, options) => service.get(input, options),
	}),
	getType: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.getType,
		invoke: (service, input, options) => service.getType(input, options),
	}),
	getTtl: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.getTtl,
		invoke: (service, input, options) => service.getTtl(input, options),
	}),
	scan: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.scan,
		invoke: (service, input, options) => service.scan(input, options),
	}),
	getHash: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.getHash,
		invoke: (service, input, options) => service.getHash(input, options),
	}),
	rangeStream: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisServiceContract.rangeStream,
		invoke: (service, input, options) => service.rangeStream(input, options),
	}),
};
