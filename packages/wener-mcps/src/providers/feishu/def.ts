import { type CreateFeishuMcpServerOptions, FeishuMcpServerDef } from '@wener/ai/mcp/feishu';
import type { FeishuConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const FeishuHeaderNames = Object.freeze({
	__proto__: null,
	FEISHU_APP_ID: 'X-FEISHU-APP-ID',
	FEISHU_APP_SECRET: 'X-FEISHU-APP-SECRET',
	FEISHU_DOMAIN: 'X-FEISHU-DOMAIN',
} as const);

export const FeishuMcpServerHandlerDef = defineMcpServerHandler<CreateFeishuMcpServerOptions, FeishuConfig>(
	FeishuMcpServerDef,
	{
		headerMappings: [
			{ header: FeishuHeaderNames.FEISHU_APP_ID, property: 'appId', required: true },
			{ header: FeishuHeaderNames.FEISHU_APP_SECRET, property: 'appSecret', required: true },
			{ header: FeishuHeaderNames.FEISHU_DOMAIN, property: 'domain' },
		],

		resolveConfig(config, headers) {
			const appId =
				config.appId ||
				headers?.get(FeishuHeaderNames.FEISHU_APP_ID) ||
				config.headers?.[FeishuHeaderNames.FEISHU_APP_ID];
			const appSecret =
				config.appSecret ||
				headers?.get(FeishuHeaderNames.FEISHU_APP_SECRET) ||
				config.headers?.[FeishuHeaderNames.FEISHU_APP_SECRET];

			if (!appId || !appSecret) return null;

			const domain =
				config.domain ||
				headers?.get(FeishuHeaderNames.FEISHU_DOMAIN) ||
				config.headers?.[FeishuHeaderNames.FEISHU_DOMAIN] ||
				'feishu';

			return { appId, appSecret, domain };
		},
	},
);
