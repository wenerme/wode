import { getEnabledCliService, type ResolvedCliContext } from '../../context';
import type { ServiceClient, ServiceProvider, ServiceRuntimeClient } from './types';

export class ServiceProviderRegistry {
	readonly #providers = new Map<string, ServiceProvider>();
	constructor(providers: readonly ServiceProvider[] = []) {
		for (const provider of providers) this.register(provider);
	}
	register(provider: ServiceProvider): this {
		if (this.#providers.has(provider.name)) throw new Error(`Duplicate service provider: ${provider.name}`);
		this.#providers.set(provider.name, provider);
		return this;
	}
	get(name: string): ServiceProvider {
		const provider = this.#providers.get(name);
		if (!provider) throw new Error('Unknown service provider');
		return provider;
	}
	list(): string[] {
		return [...this.#providers.keys()];
	}
}

/** 一个执行 context 一个 runtime；懒创建 client，关闭权由宿主持有。 */
export function createServiceRuntime(options: {
	context: ResolvedCliContext;
	providers: ServiceProviderRegistry;
	fetch?: typeof globalThis.fetch;
}): ServiceRuntimeClient & { close(): Promise<void> } {
	const context = structuredClone(options.context);
	const clients = new Map<string, Promise<ServiceClient>>();
	let closed = false;
	async function client(name: string): Promise<ServiceClient> {
		if (closed) throw new Error('Service runtime is closed');
		const config = getEnabledCliService(context, name);
		let pending = clients.get(name);
		if (!pending) {
			const provider = options.providers.get(config.provider);
			pending = Promise.resolve().then(() =>
				provider.create({
					name,
					config,
					context,
					fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
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
