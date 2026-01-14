/**
 * MCP Configuration Schema Definitions
 * Supports Claude, Cursor, and Gemini config formats
 */

import { z } from 'zod';

/**
 * stdio server configuration (local process)
 */
export const StdioServerConfigSchema = z.object({
	command: z.string(),
	args: z.array(z.string()).optional(),
	env: z.record(z.string(), z.string()).optional(),
	cwd: z.string().optional(),
});
export type StdioServerConfig = z.infer<typeof StdioServerConfigSchema>;

/**
 * HTTP server configuration (remote)
 * Claude/Cursor format: uses "url"
 * Gemini format: uses "serverUrl"
 */
export const HttpServerConfigSchema = z
	.object({
		url: z.string().optional(),
		serverUrl: z.string().optional(),
		headers: z.record(z.string(), z.string()).optional(),
		timeout: z.number().optional(),
	})
	.refine((data) => data.url || data.serverUrl, { message: 'Either url or serverUrl must be provided' });
export type HttpServerConfig = z.infer<typeof HttpServerConfigSchema>;

/**
 * Server configuration - either stdio or HTTP
 */
export const ServerConfigSchema = z.union([StdioServerConfigSchema, HttpServerConfigSchema]);
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Claude Desktop config format
 * File: ~/.claude.json or ./.claude.json
 * Structure: { mcpServers: { ... } }
 */
export const ClaudeConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema).optional(),
});
export type ClaudeConfig = z.infer<typeof ClaudeConfigSchema>;

/**
 * Cursor config format
 * File: ~/.cursor/mcp.json or ./.cursor/mcp.json
 * Structure: { mcpServers: { ... } }
 */
export const CursorConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema).optional(),
});
export type CursorConfig = z.infer<typeof CursorConfigSchema>;

/**
 * Gemini config format
 * File: ~/.gemini/antigravity/mcp_config.json or ./.gemini/mcp_config.json
 * Structure: { mcpServers: { ... } } with serverUrl instead of url
 */
export const GeminiConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema).optional(),
});
export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;

/**
 * Unified MCP servers config (mcp_servers.json format)
 */
export const McpServersConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema).optional(),
});
export type McpServersConfig = z.infer<typeof McpServersConfigSchema>;

/**
 * MCP-CLI specific config format with extends and discoveryConfig
 * discoveryConfig can be:
 * - false: disable all discovery
 * - true: enable all discovery (default)
 * - array: selective discovery, e.g. ["gemini", "codex", "claude"]
 */
export const McpCliConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema).optional(),
	extends: z.array(z.string()).optional(),
	discoveryConfig: z.union([z.boolean(), z.array(z.string())]).optional(),
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
});
export type McpCliConfig = z.infer<typeof McpCliConfigSchema>;

/**
 * Config source types
 */
export const ConfigSourceTypes = ['claude', 'cursor', 'gemini', 'mcp', 'codex'] as const;
export type ConfigSourceType = (typeof ConfigSourceTypes)[number];

/**
 * Config source information - tracks where the config was found
 */
export interface ConfigSource {
	path: string;
	type: ConfigSourceType;
	label: string;
}

/**
 * Server with source tracking - includes origin of the server definition
 */
export interface ServerWithSource {
	name: string;
	config: StdioServerConfig | HttpServerConfig;
	source: ConfigSource;
}

/**
 * Merged configuration from all sources
 */
export interface MergedConfig {
	servers: Map<string, ServerWithSource>;
	sources: ConfigSource[];
	duplicates: Array<{ name: string; sources: ConfigSource[] }>;
}

/**
 * Check if a server config is HTTP-based
 */
export function isHttpServer(config: ServerConfig): config is HttpServerConfig {
	return 'url' in config || 'serverUrl' in config;
}

/**
 * Check if a server config is stdio-based
 */
export function isStdioServer(config: ServerConfig): config is StdioServerConfig {
	return 'command' in config;
}

/**
 * Get the URL from an HTTP server config (handles both url and serverUrl)
 */
export function getServerUrl(config: HttpServerConfig): string {
	return config.url ?? config.serverUrl ?? '';
}

/**
 * Normalize HTTP server config to use standard 'url' field
 */
export function normalizeHttpConfig(config: HttpServerConfig): HttpServerConfig {
	if (config.serverUrl && !config.url) {
		return { ...config, url: config.serverUrl };
	}
	return config;
}
