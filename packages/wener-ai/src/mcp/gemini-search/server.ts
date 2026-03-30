// Backward compatibility - re-export from gemini-tools
export {
	type CreateGeminiToolsMcpServerOptions as CreateGeminiSearchMcpServerOptions,
	type CreateGeminiToolsMcpServerOptions,
	createGeminiToolsMcpServer as createGeminiSearchMcpServer,
	createGeminiToolsMcpServer,
} from '../gemini-tools/server';
