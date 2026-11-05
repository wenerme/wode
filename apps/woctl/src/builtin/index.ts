import { ApolloServiceProvider } from '@wener/common/service/apollo';
import { OpenObserveServiceProvider } from '@wener/common/service/openobserve';
import { PrometheusServiceProvider } from '@wener/common/service/prometheus';
import { BaseFetchServiceProvider } from '@wener/common/service/provider/base';
import { DuckDuckGoSearchServiceProvider } from '@wener/common/service/provider/duckduckgo';
import { ExaServiceProvider } from '@wener/common/service/provider/exa';
import { JinaFetchServiceProvider } from '@wener/common/service/provider/jina';
import { SqlServiceProvider } from '@wener/common/service/sql';
import { RedisServiceProvider } from '@wener/common/service/redis';
import { LinearServiceProvider } from '@wener/common/service/linear';
import { EdgeTtsServiceProvider } from '@wener/common/service/provider/edge-tts';
import { OpenAiTtsServiceProvider } from '@wener/common/service/provider/openai-tts';
import type { ServiceRegistry } from '@wener/common/service/registry';
import { createServiceProviderAdapter } from '@wener/common/service/runtime';

export const BuiltinServiceProviders = Object.freeze([
	DuckDuckGoSearchServiceProvider,
	ExaServiceProvider,
	JinaFetchServiceProvider,
	BaseFetchServiceProvider,
	SqlServiceProvider,
	RedisServiceProvider,
	OpenObserveServiceProvider,
	ApolloServiceProvider,
	PrometheusServiceProvider,
	LinearServiceProvider,
	EdgeTtsServiceProvider,
	OpenAiTtsServiceProvider,
]);

/** Explicitly install built-in providers; configuration, instance creation and network requests stay with registry.load. */
export function registerBuiltinServices(registry: ServiceRegistry): ServiceRegistry {
	for (const provider of BuiltinServiceProviders) registry.register(provider);
	return registry;
}

/** The CLI/RPC transport and typed registry use the same provider set. */
export function createBuiltinServiceProviders() {
	return BuiltinServiceProviders.map((provider) => createServiceProviderAdapter(provider));
}
