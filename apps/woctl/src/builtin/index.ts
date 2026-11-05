import { ApolloServiceProvider } from '@wener/common/service/apollo';
import { OpenObserveServiceProvider } from '@wener/common/service/openobserve';
import { PrometheusServiceProvider } from '@wener/common/service/prometheus';
import { BaseFetchServiceProvider } from '@wener/common/service/providers/base';
import { DuckDuckGoSearchServiceProvider } from '@wener/common/service/providers/duckduckgo';
import { ExaServiceProvider } from '@wener/common/service/providers/exa';
import { JinaFetchServiceProvider } from '@wener/common/service/providers/jina';
import { SqlServiceProvider } from '@wener/common/service/providers/sql';
import { RedisServiceProvider } from '@wener/common/service/providers/redis';
import { LinearServiceProvider } from '@wener/common/service/providers/linear';
import { EdgeTtsServiceProvider } from '@wener/common/service/providers/edge-tts';
import { OpenAiTtsServiceProvider } from '@wener/common/service/providers/openai-tts';
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
