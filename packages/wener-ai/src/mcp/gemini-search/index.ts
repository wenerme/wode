// Backward compatibility - re-export from gemini-tools
export { GeminiToolsMcpServerDef as GeminiSearchMcpServerDef } from '../gemini-tools/def';
export {
	type CreateGeminiToolsMcpServerOptions as CreateGeminiSearchMcpServerOptions,
	createGeminiToolsMcpServer as createGeminiSearchMcpServer,
} from '../gemini-tools/server';
