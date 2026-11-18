import { McpServer } from '@modelcontextprotocol/server';
import consola from 'consola';
import { registerDocumentTools, registerImTools, registerWikiTools } from './tools';

type LarkHttpInstance = import('@larksuiteoapi/node-sdk').HttpInstance;

/**
 * 飞书 SDK 的 axios 不跟随重定向：每次请求加 `maxRedirects: 0`，3xx 按错误抛出。
 */
export function createNoRedirectLarkHttpInstance(base: LarkHttpInstance): LarkHttpInstance {
	const noRedirect = <T>(options?: T): T => ({ ...options, maxRedirects: 0 }) as T;
	return {
		request: (options) => base.request(noRedirect(options)),
		get: (url, options) => base.get(url, noRedirect(options)),
		delete: (url, options) => base.delete(url, noRedirect(options)),
		head: (url, options) => base.head(url, noRedirect(options)),
		options: (url, options) => base.options(url, noRedirect(options)),
		post: (url, data, options) => base.post(url, data, noRedirect(options)),
		put: (url, data, options) => base.put(url, data, noRedirect(options)),
		patch: (url, data, options) => base.patch(url, data, noRedirect(options)),
	};
}

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
				// 换 token 的请求体带 appSecret：不跟随重定向（axios 默认 307/308 会原样重发请求体）。
				httpInstance: createNoRedirectLarkHttpInstance(lark.defaultHttpInstance as unknown as LarkHttpInstance),
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
