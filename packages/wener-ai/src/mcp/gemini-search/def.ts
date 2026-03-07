import { defineMcpServer } from '../McpServerDef';
import { type CreateGeminiSearchMcpServerOptions, createGeminiSearchMcpServer } from './server';

export const GeminiSearchMcpServerDef = defineMcpServer<CreateGeminiSearchMcpServerOptions>({
	name: 'gemini-web-search',
	title: 'Gemini Web Search',
	description: 'Web Search MCP Server using Google Search grounding via Gemini',
	version: '1.0.0',
	tags: ['search', 'web', 'gemini', 'google'],

	validateOptions(opts) {
		const apiKey = opts?.apiKey || process.env.GEMINI_API_KEY;
		if (!apiKey) return { valid: false, error: 'apiKey is required (option or GEMINI_API_KEY env)' };
		return { valid: true };
	},

	getCacheKey(opts) {
		return `gemini-search:${opts.baseUrl || 'default'}:${opts.model || 'default'}`;
	},

	create: createGeminiSearchMcpServer,
});
