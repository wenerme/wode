import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';
import { registerDocumentTools, registerImTools, registerWikiTools } from './tools';

const log = consola.withTag('feishu-mcp');

export interface CreateFeishuMcpServerOptions {
	appId: string;
	appSecret: string;
	/** 'feishu' (China) or 'lark' (International) or custom domain */
	domain?: string;
	name?: string;
	version?: string;
}

export interface FeishuMcpContext {
	server: McpServer;
	getClient: () => Promise<any>;
	log: typeof log;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

export function createFeishuMcpServer(options: CreateFeishuMcpServerOptions) {
	const { appId, appSecret, domain = 'feishu', name = 'feishu', version = '1.0.0' } = options;

	const server = new McpServer({ name, version });

	let _client: any;
	const getClient = async () => {
		if (!_client) {
			const lark = await import('@larksuiteoapi/node-sdk');
			const larkDomain = domain === 'feishu' ? lark.Domain.Feishu : domain === 'lark' ? lark.Domain.Lark : domain;
			_client = new lark.Client({
				appId,
				appSecret,
				domain: larkDomain,
				appType: lark.AppType.SelfBuild,
				loggerLevel: lark.LoggerLevel.error,
			});
		}
		return _client;
	};

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({
		content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
	});

	const ctx: FeishuMcpContext = { server, getClient, log, textResult, jsonResult };

	registerImTools(ctx);
	registerDocumentTools(ctx);
	registerWikiTools(ctx);

	return {
		server,
		getClient,
		async close() {
			await server.close();
		},
	};
}
