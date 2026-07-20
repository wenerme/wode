import { ApolloConfigMcpServerDef, type CreateApolloConfigMcpServerOptions } from '@wener/ai/mcp/apolloconfig';
import type { ApolloConfigConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const ApolloConfigHeaderNames = Object.freeze({
	__proto__: null,
	APOLLO_URL: 'X-APOLLO-URL',
	APOLLO_APP_ID: 'X-APOLLO-APP-ID',
	APOLLO_APP_SECRET: 'X-APOLLO-APP-SECRET',
	APOLLO_CLUSTER: 'X-APOLLO-CLUSTER',
	APOLLO_NAMESPACE: 'X-APOLLO-NAMESPACE',
} as const);

export const ApolloConfigMcpServerHandlerDef = defineMcpServerHandler<
	CreateApolloConfigMcpServerOptions,
	ApolloConfigConfig
>(ApolloConfigMcpServerDef, {
	headerMappings: [
		{ header: ApolloConfigHeaderNames.APOLLO_URL, property: 'url', required: true },
		{ header: ApolloConfigHeaderNames.APOLLO_APP_ID, property: 'appId', required: true },
		{ header: ApolloConfigHeaderNames.APOLLO_APP_SECRET, property: 'appSecret' },
		{ header: ApolloConfigHeaderNames.APOLLO_CLUSTER, property: 'cluster', default: 'default' },
		{ header: ApolloConfigHeaderNames.APOLLO_NAMESPACE, property: 'namespace' },
	],

	resolveConfig(config, headers) {
		const url =
			config.url ||
			headers?.get(ApolloConfigHeaderNames.APOLLO_URL) ||
			config.headers?.[ApolloConfigHeaderNames.APOLLO_URL];
		const appId =
			config.appId ||
			headers?.get(ApolloConfigHeaderNames.APOLLO_APP_ID) ||
			config.headers?.[ApolloConfigHeaderNames.APOLLO_APP_ID];
		const appSecret =
			config.appSecret ||
			headers?.get(ApolloConfigHeaderNames.APOLLO_APP_SECRET) ||
			config.headers?.[ApolloConfigHeaderNames.APOLLO_APP_SECRET];
		const cluster =
			config.cluster ||
			headers?.get(ApolloConfigHeaderNames.APOLLO_CLUSTER) ||
			config.headers?.[ApolloConfigHeaderNames.APOLLO_CLUSTER] ||
			'default';
		const namespace =
			config.namespace ||
			headers?.get(ApolloConfigHeaderNames.APOLLO_NAMESPACE) ||
			config.headers?.[ApolloConfigHeaderNames.APOLLO_NAMESPACE];

		if (!url || !appId) return null;

		return { url, appId, appSecret, cluster, namespace };
	},
});
