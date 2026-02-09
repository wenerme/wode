import { defineMcpServer } from '../McpServerDef';
import { createApolloConfigMcpServer, type CreateApolloConfigMcpServerOptions } from './server';

export const ApolloConfigMcpServerDef = defineMcpServer<CreateApolloConfigMcpServerOptions>({
	name: 'apolloconfig',
	title: 'Apollo Config',
	description: 'Apollo Config configuration center MCP Server for reading application configurations',
	version: '1.0.0',
	tags: ['config', 'apolloconfig', 'configuration-center'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing url for apolloconfig' };
		if (!options.appId) return { valid: false, error: 'Missing appId for apolloconfig' };
		return { valid: true };
	},
	getCacheKey(options) {
		return `apollo::${options.url}::${options.appId}::${options.cluster ?? 'default'}`;
	},
	create: createApolloConfigMcpServer,
});
