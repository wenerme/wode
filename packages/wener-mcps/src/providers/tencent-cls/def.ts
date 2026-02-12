import { TencentClsMcpServerDef, type CreateTencentClsMcpServerOptions } from '@wener/ai/mcp/tencent-cls';
import type { TencentClsConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const TencentClsHeaderNames = Object.freeze({
	__proto__: null,
	CLS_SECRET_ID: 'X-CLS-SECRET-ID',
	CLS_SECRET_KEY: 'X-CLS-SECRET-KEY',
	CLS_REGION: 'X-CLS-REGION',
	CLS_ENDPOINT: 'X-CLS-ENDPOINT',
} as const);

export const TencentClsMcpServerHandlerDef = defineMcpServerHandler<
	CreateTencentClsMcpServerOptions,
	TencentClsConfig
>(TencentClsMcpServerDef, {
	headerMappings: [
		{ header: TencentClsHeaderNames.CLS_SECRET_ID, property: 'clientId', required: true },
		{ header: TencentClsHeaderNames.CLS_SECRET_KEY, property: 'clientSecret', required: true },
		{ header: TencentClsHeaderNames.CLS_REGION, property: 'region', default: 'ap-shanghai' },
		{ header: TencentClsHeaderNames.CLS_ENDPOINT, property: 'endpoint' },
	],

	resolveConfig(config, headers) {
		const clientId =
			config.clientId ||
			headers?.get(TencentClsHeaderNames.CLS_SECRET_ID) ||
			config.headers?.[TencentClsHeaderNames.CLS_SECRET_ID];
		const clientSecret =
			config.clientSecret ||
			headers?.get(TencentClsHeaderNames.CLS_SECRET_KEY) ||
			config.headers?.[TencentClsHeaderNames.CLS_SECRET_KEY];
		const region =
			config.region ||
			headers?.get(TencentClsHeaderNames.CLS_REGION) ||
			config.headers?.[TencentClsHeaderNames.CLS_REGION] ||
			'ap-shanghai';
		const endpoint =
			config.endpoint ||
			headers?.get(TencentClsHeaderNames.CLS_ENDPOINT) ||
			config.headers?.[TencentClsHeaderNames.CLS_ENDPOINT];

		if (!clientId || !clientSecret) return null;

		return { clientId, clientSecret, region, endpoint };
	},
});
