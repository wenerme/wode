import { ApolloServiceProvider } from '../apollo';
import { OpenObserveServiceProvider } from '../openobserve';
import { PrometheusServiceProvider } from '../prometheus';
import { BaseFetchServiceProvider } from '../provider/base';
import { DuckDuckGoSearchServiceProvider } from '../provider/duckduckgo';
import { JinaFetchServiceProvider } from '../provider/jina';
import { SqlServiceProvider } from '../sql';
import type { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';

/** @deprecated Import individual providers from `@wener/common/service/*` instead. */
export const BuiltinServiceProviders = Object.freeze([
	DuckDuckGoSearchServiceProvider,
	JinaFetchServiceProvider,
	BaseFetchServiceProvider,
	SqlServiceProvider,
	OpenObserveServiceProvider,
	ApolloServiceProvider,
	PrometheusServiceProvider,
]);

/** @deprecated Register the providers needed by the application explicitly instead. */
export function registerBuiltinServices(registry: ServiceRegistry): ServiceRegistry {
	for (const provider of BuiltinServiceProviders) registry.register(provider);
	return registry;
}

/** @deprecated Prefer `createServiceProviderAdapter` for an individual provider. */
export function createBuiltinServiceProviders() {
	return BuiltinServiceProviders.map((provider) => createServiceProviderAdapter(provider));
}
