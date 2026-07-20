import { defineMcpServer } from '../McpServerDef';
import { type CreateGeminiToolsMcpServerOptions, createGeminiToolsMcpServer } from './server';

export const GeminiToolsMcpServerDef = defineMcpServer<CreateGeminiToolsMcpServerOptions>({
	name: 'gemini-tools',
	title: 'Gemini Tools',
	description: 'MCP Server exposing Gemini model capabilities: web search (Google Search grounding) and code execution',
	version: '1.0.0',
	tags: ['search', 'web', 'gemini', 'google', 'code-execution'],

	validateOptions(opts) {
		const apiKey = opts?.apiKey || process.env.GEMINI_API_KEY;
		if (!apiKey) return { valid: false, error: 'apiKey is required (option or GEMINI_API_KEY env)' };
		return { valid: true };
	},

	getCacheKey(opts) {
		return `gemini-tools:${opts.baseUrl || 'default'}:${opts.model || 'default'}`;
	},

	create: createGeminiToolsMcpServer,
});
