// Backward compatibility - re-export from gemini-tools
import type { CreateGeminiToolsMcpServerOptions } from '@wener/ai/mcp/gemini-tools';
import { type GeminiToolsConfig, GeminiToolsHeaderNames, GeminiToolsMcpServerHandlerDef } from '../gemini-tools/def';

/** @deprecated Use GeminiToolsHeaderNames instead */
export const GeminiSearchHeaderNames = GeminiToolsHeaderNames;

/** @deprecated Use GeminiToolsConfig instead */
export type GeminiSearchConfig = {
	type: 'gemini-web-search';
	apiKey?: string;
	baseUrl?: string;
	model?: string;
	headers?: Record<string, string>;
	disabled?: boolean;
};

/** @deprecated Use GeminiToolsMcpServerHandlerDef instead */
export const GeminiSearchMcpServerHandlerDef = GeminiToolsMcpServerHandlerDef;
