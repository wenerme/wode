import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { RedisToolInputs, RedisTools } from '../runtime/redis-tools';

export const RedisOperations = {
	ping: defineServiceOperation({ capability: 'redis', tool: RedisTools.ping, input: RedisToolInputs.ping,
		invoke: (service, _input, options) => service.ping(options) }),
	get: defineServiceOperation({ capability: 'redis', tool: RedisTools.get, input: RedisToolInputs.get,
		invoke: (service, input, options) => service.get(input, options) }),
	getType: defineServiceOperation({ capability: 'redis', tool: RedisTools.getType, input: RedisToolInputs.getType,
		invoke: (service, input, options) => service.getType(input, options) }),
	getTtl: defineServiceOperation({ capability: 'redis', tool: RedisTools.getTtl, input: RedisToolInputs.getTtl,
		invoke: (service, input, options) => service.getTtl(input, options) }),
	scan: defineServiceOperation({ capability: 'redis', tool: RedisTools.scan, input: RedisToolInputs.scan,
		invoke: (service, input, options) => service.scan(input, options) }),
	getHash: defineServiceOperation({ capability: 'redis', tool: RedisTools.getHash, input: RedisToolInputs.getHash,
		invoke: (service, input, options) => service.getHash(input, options) }),
	rangeStream: defineServiceOperation({ capability: 'redis', tool: RedisTools.rangeStream, input: RedisToolInputs.rangeStream,
		invoke: (service, input, options) => service.rangeStream(input, options) }),
};
