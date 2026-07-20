// Core server

// Chat
export { type ChatHandlerOptions, createChatHandler } from './chat';
// Contracts
export * from './contracts';
export { findMcpServerDef, getMcpServerDefCount, resolveMcpServerDef } from './providers/findMcpServerDef';
// Providers
export {
	type DefineMcpServerHandlerOptions,
	defineMcpServerHandler,
	getAllMcpServerHandlerDefs,
	getMcpServerHandlerDef,
	type HeaderMapping,
	type McpServerHandlerDef,
	type McpServerHandlerDef as McpServerDef,
	registerMcpServerHandler,
} from './providers/McpServerHandlerDef';
export { registerApiRoutes } from './server/api-routes';
export { registerChatRoutes } from './server/chat-routes';
// Configuration
export { loadConfig, loadEnvFiles, substituteEnvVars } from './server/config';
// Events (emittery-based decoupling)
export {
	createMcpsEmitter,
	type McpsEmitter,
	type McpsEventData,
	McpsEventType,
	type McpsRequestEvent,
} from './server/events';
export { createMcpLoggingHandler } from './server/mcp-handler';
// MCP routes and handler
export { registerMcpRoutes } from './server/mcp-routes';
export { createMcpsRouter } from './server/mcps-router';
export {
	type AuditConfig,
	AuditConfigSchema,
	type DbConfig,
	DbConfigSchema,
	type GrafanaConfig,
	GrafanaConfigSchema,
	HeaderNames,
	type McpsConfig,
	McpsConfigSchema,
	type ModelConfig,
	ModelConfigSchema,
	type ServerConfig,
	ServerConfigSchema,
} from './server/schema';
export { type CreateServerOptions, createServer, type McpsServerContext, type StatsProvider } from './server/server';
