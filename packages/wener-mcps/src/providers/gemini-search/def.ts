import { GeminiSearchMcpServerDef, type CreateGeminiSearchMcpServerOptions } from '@wener/ai/mcp/gemini-search';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const GeminiSearchHeaderNames = Object.freeze({
	__proto__: null,
	API_KEY: 'X-GEMINI-API-KEY',
	BASE_URL: 'X-GEMINI-BASE-URL',
	MODEL: 'X-GEMINI-MODEL',
} as const);

export type GeminiSearchConfig = {
	type: 'gemini-web-search';
	apiKey?: string;
	baseUrl?: string;
	model?: string;
	headers?: Record<string, string>;
	disabled?: boolean;
};

export const GeminiSearchMcpServerHandlerDef = defineMcpServerHandler<
	CreateGeminiSearchMcpServerOptions,
	GeminiSearchConfig
>(GeminiSearchMcpServerDef, {
	headerMappings: [
		{ header: GeminiSearchHeaderNames.API_KEY, property: 'apiKey', required: true },
		{ header: GeminiSearchHeaderNames.BASE_URL, property: 'baseUrl' },
		{ header: GeminiSearchHeaderNames.MODEL, property: 'model' },
	],

	resolveConfig(config, headers) {
		const apiKey =
			config.apiKey ||
			headers?.get(GeminiSearchHeaderNames.API_KEY) ||
			config.headers?.[GeminiSearchHeaderNames.API_KEY];
		const baseUrl =
			config.baseUrl ||
			headers?.get(GeminiSearchHeaderNames.BASE_URL) ||
			config.headers?.[GeminiSearchHeaderNames.BASE_URL];
		const model =
			config.model ||
			headers?.get(GeminiSearchHeaderNames.MODEL) ||
			config.headers?.[GeminiSearchHeaderNames.MODEL];

		const opts: CreateGeminiSearchMcpServerOptions = {};
		if (apiKey) opts.apiKey = apiKey;
		if (baseUrl) opts.baseUrl = baseUrl;
		if (model) opts.model = model;
		return opts;
	},
});
