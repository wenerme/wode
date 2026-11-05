import { createRemoteServiceToolClient } from '../runtime/createServiceToolClient';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../runtime/types';
import type { RedisServiceClient } from './IRedisService';

/** The service ping has no input, while schema/call always carries an object. */
export async function createRedisServiceToolClient(
	runtime: ServiceRuntimeClient, service: string, options: ServiceCallOptions = {},
): Promise<RedisServiceClient> {
	type RemoteClient = Omit<RedisServiceClient, 'ping'> & {
		ping(input: Record<string, never>, options?: ServiceCallOptions): ReturnType<RedisServiceClient['ping']>;
	};
	const client = await createRemoteServiceToolClient<RemoteClient>(runtime, service, options);
	return {
		ping: (callOptions) => client.ping({}, callOptions),
		get: (input, callOptions) => client.get(input, callOptions),
		getType: (input, callOptions) => client.getType(input, callOptions),
		getTtl: (input, callOptions) => client.getTtl(input, callOptions),
		scan: (input = {}, callOptions) => client.scan(input, callOptions),
		getHash: (input, callOptions) => client.getHash(input, callOptions),
		rangeStream: (input, callOptions) => client.rangeStream(input, callOptions),
	};
}
