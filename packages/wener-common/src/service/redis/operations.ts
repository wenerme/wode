import { defineContractOperation } from '../runtime/contract';
import { RedisContract } from './RedisContract';
import { RedisServiceCapability } from './IRedisService';

export const RedisOperations = {
	ping: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.ping,
		invoke: (service, _input, options) => service.ping(options),
	}),
	get: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.get,
		invoke: (service, input, options) => service.get(input, options),
	}),
	getType: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.getType,
		invoke: (service, input, options) => service.getType(input, options),
	}),
	getTtl: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.getTtl,
		invoke: (service, input, options) => service.getTtl(input, options),
	}),
	scan: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.scan,
		invoke: (service, input, options) => service.scan(input, options),
	}),
	getHash: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.getHash,
		invoke: (service, input, options) => service.getHash(input, options),
	}),
	rangeStream: defineContractOperation({
		capability: RedisServiceCapability,
		contract: RedisContract.rangeStream,
		invoke: (service, input, options) => service.rangeStream(input, options),
	}),
};
