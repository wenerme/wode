import type { ServiceCallOptions, ServiceRuntimeClient } from './types';

/** typed service CLI 与 transport 解耦，保留 wcli 的 schema/call 结构。 */
export async function createRemoteServiceToolClient<S>(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<S> {
	const params = { service };
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params }, options);
	options.signal?.throwIfAborted();
	const client = Object.create(null) as Record<string, unknown>;
	for (const toolName of Object.keys(schema.tools)) {
		client[toolName] = async (input: unknown = {}, callOptions: ServiceCallOptions = {}) => {
			const signals = [options.signal, callOptions.signal].filter((value): value is AbortSignal => Boolean(value));
			const signal = signals.length ? AbortSignal.any(signals) : undefined;
			signal?.throwIfAborted();
			const result = await runtime.call({ params, body: { toolName, input } }, { signal });
			signal?.throwIfAborted();
			return result;
		};
	}
	return new Proxy(client, {
		get(target, key) {
			if (key === 'then' || typeof key === 'symbol') return undefined;
			if (Object.hasOwn(target, key)) return target[key];
			throw new Error('Service operation unavailable; inspect the service schema');
		},
	}) as S;
}
