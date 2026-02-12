// Core server
export { createServer, type CreateServerOptions, type McpsServerContext, type StatsProvider } from './server/server';

// Events (emittery-based decoupling)
export { McpsEventType, createMcpsEmitter, type McpsEmitter, type McpsEventData, type McpsRequestEvent } from './server/events';

// Configuration
export { loadConfig, substituteEnvVars, loadEnvFiles } from './server/config';
export {
	type McpsConfig,
	type ServerConfig,
	type ModelConfig,
	type AuditConfig,
	type DbConfig,
	McpsConfigSchema,
	ServerConfigSchema,
	ModelConfigSchema,
	AuditConfigSchema,
	DbConfigSchema,
	HeaderNames,
} from './server/schema';

// MCP routes and handler
export { registerMcpRoutes } from './server/mcp-routes';
export { registerChatRoutes } from './server/chat-routes';
export { registerApiRoutes } from './server/api-routes';
export { createMcpLoggingHandler } from './server/mcp-handler';
export { createMcpsRouter } from './server/mcps-router';

// Providers
export {
	type McpServerHandlerDef,
	type McpServerHandlerDef as McpServerDef,
	type HeaderMapping,
	type DefineMcpServerHandlerOptions,
	defineMcpServerHandler,
	registerMcpServerHandler,
	getAllMcpServerHandlerDefs,
	getMcpServerHandlerDef,
} from './providers/McpServerHandlerDef';
export { findMcpServerDef, resolveMcpServerDef, getMcpServerDefCount } from './providers/findMcpServerDef';

// Contracts
export * from './contracts';

// Chat
export { createChatHandler, type ChatHandlerOptions } from './chat';
