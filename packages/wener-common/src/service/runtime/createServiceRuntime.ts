import type { SqlAdapterFactory } from '../sql/types';
import { getEnabledService } from './getEnabledService';
import type { ServiceProviderRegistry } from './ServiceProviderRegistry';
import type { ResolvedServiceContext, ServiceClient, ServiceRuntimeClient } from './types';

/** 一个执行 context 一个 runtime；懒创建 client，关闭权由宿主持有。 */
export function createServiceRuntime(options: {
	context: ResolvedServiceContext;
	providers: ServiceProviderRegistry;
	fetch?: typeof globalThis.fetch;
	sqlDriver?: SqlAdapterFactory;
	getEnv?(name: string): string | undefined;
}): ServiceRuntimeClient & { close(): Promise<void> } {
	const context: ResolvedServiceContext = structuredClone({
		services: options.context.services,
		...(options.context.configuredServices ? { configuredServices: options.context.configuredServices } : {}),
	});
	const clients = new Map<string, Promise<ServiceClient>>();
	let closed = false;
	async function client(name: string): Promise<ServiceClient> {
		if (closed) throw new Error('Service runtime is closed');
		const config = getEnabledService(context, name);
		let pending = clients.get(name);
		if (!pending) {
			const provider = options.providers.get(config.provider);
			pending = Promise.resolve().then(() =>
				provider.create({
					name,
					config,
					context,
					fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
					sqlDriver: options.sqlDriver,
					getEnv: options.getEnv,
				}),
			);
			clients.set(name, pending);
		}
		return pending;
	}
	return {
		async getSchema({ params }, callOptions) {
			callOptions?.signal?.throwIfAborted();
			const result = await (await client(params.service)).getSchema(callOptions);
			callOptions?.signal?.throwIfAborted();
			return result;
		},
		async call({ params, body }, callOptions) {
			callOptions?.signal?.throwIfAborted();
			const service = await client(params.service);
			const schema = await service.getSchema(callOptions);
			callOptions?.signal?.throwIfAborted();
			if (!Object.hasOwn(schema.tools, body.toolName)) throw new Error('Unknown service operation; inspect its schema');
			const tool = schema.tools[body.toolName];
			if (context.services[params.service].readOnly !== false && tool.annotations?.readOnlyHint !== true)
				throw new Error('Selected service is read-only');
			const result = await service.call(body.toolName, body.input, callOptions);
			callOptions?.signal?.throwIfAborted();
			return result;
		},
		async close() {
			if (closed) return;
			closed = true;
			const settled = await Promise.allSettled(clients.values());
			const results = await Promise.allSettled(
				settled.flatMap((entry) =>
					entry.status === 'fulfilled' ? [Promise.resolve().then(() => entry.value.close?.())] : [],
				),
			);
			const failed = results.find((entry) => entry.status === 'rejected');
			if (failed?.status === 'rejected') throw failed.reason;
		},
	};
}
