import { TencentClsMcpServerDef, type CreateTencentClsMcpServerOptions } from '@wener/ai/mcp/tencent-cls';
import { HeaderNames, type TencentClsConfig } from '../../server/schema';
import { defineMcpServerHandler, registerMcpServerHandler } from '../McpServerHandlerDef';

export const TencentClsMcpServerHandlerDef = defineMcpServerHandler<
	CreateTencentClsMcpServerOptions,
	TencentClsConfig
>(TencentClsMcpServerDef, {
	headerMappings: [
		{ header: HeaderNames.CLS_SECRET_ID, property: 'clientId', required: true },
		{ header: HeaderNames.CLS_SECRET_KEY, property: 'clientSecret', required: true },
		{ header: HeaderNames.CLS_REGION, property: 'region', default: 'ap-shanghai' },
		{ header: HeaderNames.CLS_ENDPOINT, property: 'endpoint' },
	],

	resolveConfig(config, headers) {
		const clientId =
			config.clientId || headers?.get(HeaderNames.CLS_SECRET_ID) || config.headers?.[HeaderNames.CLS_SECRET_ID];
		const clientSecret =
			config.clientSecret || headers?.get(HeaderNames.CLS_SECRET_KEY) || config.headers?.[HeaderNames.CLS_SECRET_KEY];
		const region =
			config.region ||
			headers?.get(HeaderNames.CLS_REGION) ||
			config.headers?.[HeaderNames.CLS_REGION] ||
			'ap-shanghai';
		const endpoint =
			config.endpoint || headers?.get(HeaderNames.CLS_ENDPOINT) || config.headers?.[HeaderNames.CLS_ENDPOINT];

		if (!clientId || !clientSecret) return null;

		return { clientId, clientSecret, region, endpoint };
	},
});

registerMcpServerHandler(TencentClsMcpServerHandlerDef);

// backward compatibility
export { TencentClsMcpServerHandlerDef as TencentClsMcpServerDef };
