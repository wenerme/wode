import { defineMcpServer } from '../McpServerDef';
import { createTencentClsMcpServer, type CreateTencentClsMcpServerOptions } from './server';

export const TencentClsMcpServerDef = defineMcpServer<CreateTencentClsMcpServerOptions>({
	name: 'tencent-cls',
	title: 'Tencent CLS',
	description: 'Tencent Cloud Log Service (CLS) MCP Server for log search and analysis',
	version: '1.0.0',
	tags: ['tencent', 'cloud', 'logging', 'cls', 'search'],
	validateOptions(options) {
		if (!options.clientId || !options.clientSecret) {
			return { valid: false, error: 'Missing clientId or clientSecret for tencent-cls' };
		}
		return { valid: true };
	},
	getCacheKey(options) {
		return `cls::${options.clientId}::${options.region || 'ap-shanghai'}::${options.endpoint || ''}`;
	},
	create: createTencentClsMcpServer,
});
