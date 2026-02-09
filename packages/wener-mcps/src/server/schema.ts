import { z } from 'zod';

// Header name constants for config parsing
export const HeaderNames = {
	CLS_SECRET_ID: 'X-CLS-SECRET-ID',
	CLS_SECRET_KEY: 'X-CLS-SECRET-KEY',
	CLS_REGION: 'X-CLS-REGION',
	CLS_ENDPOINT: 'X-CLS-ENDPOINT',
	DB_URL: 'X-DB-URL',
	DB_READ_URL: 'X-DB-READ-URL',
	DB_WRITE_URL: 'X-DB-WRITE-URL',
	SERVICE_URL: 'X-SERVICE-URL',
	TOKEN: 'X-TOKEN',
	MCP_URL: 'X-MCP-URL',
	MCP_TYPE: 'X-MCP-TYPE',
	MCP_COMMAND: 'X-MCP-COMMAND',
	// Tool filtering headers
	MCP_READONLY: 'X-MCP-Readonly',
	MCP_INCLUDE: 'X-MCP-Include',
	MCP_EXCLUDE: 'X-MCP-Exclude',
} as const;

// Base server config with common fields
export const BaseServerConfigSchema = z.object({
	disabled: z.boolean().optional(),
	// Headers can be used as alternative to direct config properties
	headers: z.record(z.string(), z.string()).optional(),
});

// Tencent CLS config - supports both direct config and headers
export const TencentClsConfigSchema = BaseServerConfigSchema.extend({
	type: z.literal('tencent-cls'),
	clientId: z.string().optional().describe('Tencent Cloud Secret ID'),
	clientSecret: z.string().optional().describe('Tencent Cloud Secret Key'),
	region: z.string().optional().describe('CLS region'),
	endpoint: z.string().optional().describe('CLS endpoint'),
});
export type TencentClsConfig = z.infer<typeof TencentClsConfigSchema>;

// SQL config with read/write separation
export const SqlConfigSchema = BaseServerConfigSchema.extend({
	type: z.literal('sql'),
	dbUrl: z.string().optional().describe('Database URL (for both read and write)'),
	dbReadUrl: z.string().optional().describe('Database URL for read operations'),
	dbWriteUrl: z.string().optional().describe('Database URL for write operations'),
});
export type SqlConfig = z.infer<typeof SqlConfigSchema>;

// Prometheus config
export const PrometheusConfigSchema = BaseServerConfigSchema.extend({
	type: z.literal('prometheus'),
	url: z.string().optional().describe('Prometheus server URL'),
});
export type PrometheusConfig = z.infer<typeof PrometheusConfigSchema>;

// Relay config for proxying to other MCP servers
export const RelayConfigSchema = BaseServerConfigSchema.extend({
	type: z.literal('relay'),
	url: z.string().optional().describe('Target MCP server URL'),
	transport: z.enum(['http', 'sse']).optional().describe('MCP transport type'),
	command: z.string().optional().describe('Command to run (stdio transport)'),
	args: z.array(z.string()).optional().describe('Command arguments'),
});
export type RelayConfig = z.infer<typeof RelayConfigSchema>;

// Union of all server configs
export const ServerConfigSchema = z.discriminatedUnion('type', [
	TencentClsConfigSchema,
	SqlConfigSchema,
	PrometheusConfigSchema,
	RelayConfigSchema,
]);
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Resolve config from headers - merge headers into config properties
 * @deprecated Use McpServerDef.resolveConfig instead. This function is kept for backward compatibility.
 */
export function resolveServerConfig<T extends ServerConfig>(config: T): T {
	// This function is now a pass-through - actual resolution is done in McpServerDef.resolveConfig
	// Keeping it for backward compatibility with any external code that might use it
	return config;
}

// ============================================================================
// Chat/LLM Gateway Configuration
// ============================================================================

/**
 * Adapter types for protocol conversion
 */
export const AdapterType = z.enum(['openai', 'anthropic', 'gemini']);
export type AdapterType = z.infer<typeof AdapterType>;

/**
 * Adapter endpoint configuration for chat models
 */
export const AdapterEndpointConfigSchema = z.object({
	baseUrl: z.string().optional(),
	headers: z.record(z.string(), z.string()).optional(),
	processors: z.array(z.string()).optional(),
});
export type AdapterEndpointConfig = z.infer<typeof AdapterEndpointConfigSchema>;

/**
 * Model configuration for chat gateway
 */
export const ModelConfigSchema = z.object({
	/** Model name or pattern (supports wildcards like "gpt-*") */
	name: z.string(),
	/** Base URL for the API */
	baseUrl: z.string().optional(),
	/** API key (uses Authorization: Bearer header) */
	apiKey: z.string().optional(),
	/** Additional headers */
	headers: z.record(z.string(), z.string()).optional(),
	/** Default adapter to use for protocol conversion */
	adapter: AdapterType.optional(),
	/** Adapter-specific endpoint configurations */
	adapters: z
		.object({
			openai: AdapterEndpointConfigSchema.optional(),
			anthropic: AdapterEndpointConfigSchema.optional(),
			gemini: AdapterEndpointConfigSchema.optional(),
		})
		.optional(),
	/** Processor chain */
	processors: z.array(z.string()).optional(),
	/** Context window size (max total tokens) */
	contextWindow: z.number().optional(),
	/** Max input tokens */
	maxInputTokens: z.number().optional(),
	/** Max output tokens */
	maxOutputTokens: z.number().optional(),
	/** Whether to fetch models from upstream on /v1/models */
	fetchUpstreamModels: z.boolean().optional(),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/**
 * Database configuration for audit storage
 */
export const DbConfigSchema = z.object({
	/** Path to SQLite database file (default: .mcps.db) */
	path: z.string().optional(),
});
export type DbConfig = z.infer<typeof DbConfigSchema>;

/**
 * Audit configuration
 */
export const AuditConfigSchema = z.object({
	/** Enable audit logging (default: true) */
	enabled: z.boolean().optional(),
	/** Database configuration for audit storage (overrides root db config) */
	db: DbConfigSchema.optional(),
});
export type AuditConfig = z.infer<typeof AuditConfigSchema>;

// Main config file schema
export const McpsConfigSchema = z.object({
	servers: z.record(z.string(), ServerConfigSchema).default({}),
	/** Model configurations for chat gateway (array format) */
	models: z.array(ModelConfigSchema).optional(),
	/** Whether to expose server config discovery endpoints (default: false) */
	discoveryConfig: z.boolean().optional(),
	/** Database configuration (shared, used as fallback for audit.db) */
	db: DbConfigSchema.optional(),
	/** Audit configuration */
	audit: AuditConfigSchema.optional(),
});
export type McpsConfig = z.infer<typeof McpsConfigSchema>;

// Legacy ChatConfig type alias for backwards compatibility
export type ChatConfig = { models?: ModelConfig[] };
