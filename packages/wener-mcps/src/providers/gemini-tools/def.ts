import { type CreateGeminiToolsMcpServerOptions, GeminiToolsMcpServerDef } from '@wener/ai/mcp/gemini-tools';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const GeminiToolsHeaderNames = Object.freeze({
	__proto__: null,
	API_KEY: 'X-GEMINI-API-KEY',
	BASE_URL: 'X-GEMINI-BASE-URL',
	MODEL: 'X-GEMINI-MODEL',
} as const);

export type GeminiToolsConfig = {
	type: 'gemini-tools';
	apiKey?: string;
	baseUrl?: string;
	model?: string;
	headers?: Record<string, string>;
	disabled?: boolean;
};

export const GeminiToolsMcpServerHandlerDef = defineMcpServerHandler<
	CreateGeminiToolsMcpServerOptions,
	GeminiToolsConfig
>(GeminiToolsMcpServerDef, {
	headerMappings: [
		{ header: GeminiToolsHeaderNames.API_KEY, property: 'apiKey', required: true },
		{ header: GeminiToolsHeaderNames.BASE_URL, property: 'baseUrl' },
		{ header: GeminiToolsHeaderNames.MODEL, property: 'model' },
	],

	resolveConfig(config, headers) {
		const apiKey =
			config.apiKey ||
			headers?.get(GeminiToolsHeaderNames.API_KEY) ||
			config.headers?.[GeminiToolsHeaderNames.API_KEY];
		const baseUrl =
			config.baseUrl ||
			headers?.get(GeminiToolsHeaderNames.BASE_URL) ||
			config.headers?.[GeminiToolsHeaderNames.BASE_URL];
		const model =
			config.model || headers?.get(GeminiToolsHeaderNames.MODEL) || config.headers?.[GeminiToolsHeaderNames.MODEL];

		const opts: CreateGeminiToolsMcpServerOptions = {};
		if (apiKey) opts.apiKey = apiKey;
		if (baseUrl) opts.baseUrl = baseUrl;
		if (model) opts.model = model;
		return opts;
	},
});
