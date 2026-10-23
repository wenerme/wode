import { OpenObserveServiceProvider } from '../openobserve';
import { BaseFetchServiceProvider } from '../providers/base';
import { DuckDuckGoSearchServiceProvider } from '../providers/duckduckgo';
import { JinaFetchServiceProvider } from '../providers/jina';
import { SqlServiceProvider } from '../providers/sql';
import type { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';

export const BuiltinServiceProviders = Object.freeze([
	DuckDuckGoSearchServiceProvider,
	JinaFetchServiceProvider,
	BaseFetchServiceProvider,
	SqlServiceProvider,
	OpenObserveServiceProvider,
]);

/** 显式安装内置 provider；配置、创建实例和网络请求留到 registry.load。 */
export function registerBuiltinServices(registry: ServiceRegistry): ServiceRegistry {
	for (const provider of BuiltinServiceProviders) registry.register(provider);
	return registry;
}

/** CLI/RPC transport 与 typed registry 使用同一组 provider。 */
export function createBuiltinServiceProviders() {
	return BuiltinServiceProviders.map((provider) => createServiceProviderAdapter(provider));
}
