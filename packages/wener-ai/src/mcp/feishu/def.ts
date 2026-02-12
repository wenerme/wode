import { defineMcpServer } from '../McpServerDef';
import { createFeishuMcpServer, type CreateFeishuMcpServerOptions } from './server';

export const FeishuMcpServerDef = defineMcpServer<CreateFeishuMcpServerOptions>({
	name: 'feishu',
	title: 'Feishu/Lark',
	description: 'Feishu/Lark MCP Server for messaging and document operations using tenant token authentication',
	version: '1.0.0',
	tags: ['feishu', 'lark', 'messaging', 'documents'],
	validateOptions(options) {
		if (!options.appId) return { valid: false, error: 'Missing appId for feishu' };
		if (!options.appSecret) return { valid: false, error: 'Missing appSecret for feishu' };
		return { valid: true };
	},
	getCacheKey(options) {
		return `feishu::${options.appId}::${options.domain || 'feishu'}`;
	},
	create: createFeishuMcpServer,
});
