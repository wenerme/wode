/**
 * Entity Type Definitions
 * These types can be used with MikroORM or other ORMs
 * Avoids decorator issues in test environments
 */

/**
 * Base entity fields
 */
export interface BaseEntity {
	id: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Request status
 */
export type RequestStatus = 'pending' | 'success' | 'error' | 'timeout';

/**
 * Chat protocol type
 */
export type ChatProtocolType = 'openai' | 'anthropic' | 'gemini';

/**
 * MCP server type
 */
export type McpServerType = 'tencent-cls' | 'sql' | 'prometheus' | 'relay' | 'custom';

/**
 * MCP request type
 */
export type McpRequestType =
	| 'initialize'
	| 'tools/list'
	| 'tools/call'
	| 'resources/list'
	| 'resources/read'
	| 'prompts/list'
	| 'prompts/get'
	| 'completion/complete'
	| 'logging/setLevel'
	| 'ping'
	| 'other';

/**
 * Chat request entity for auditing and metering
 */
export interface ChatRequest extends BaseEntity {
	/** Unique request ID for tracing */
	requestId: string;
	/** Request timestamp */
	requestedAt: Date;
	/** Response timestamp */
	completedAt?: Date;
	/** Request status */
	status: RequestStatus;
	/** HTTP method */
	method: string;
	/** Request path/endpoint */
	endpoint: string;
	/** Input protocol (client-facing) */
	inputProtocol: ChatProtocolType;
	/** Output protocol (upstream provider) */
	outputProtocol: ChatProtocolType;
	/** Model name requested */
	model: string;
	/** Resolved model name */
	resolvedModel?: string;
	/** Provider name */
	provider?: string;
	/** Upstream base URL */
	upstreamUrl?: string;
	/** Whether request was streaming */
	streaming: boolean;
	/** Input token count */
	inputTokens?: number;
	/** Output token count */
	outputTokens?: number;
	/** Total token count */
	totalTokens?: number;
	/** Request duration in ms */
	durationMs?: number;
	/** Time to first token in ms */
	ttftMs?: number;
	/** HTTP status code */
	httpStatus?: number;
	/** Error message */
	errorMessage?: string;
	/** Error code */
	errorCode?: string;
	/** Client IP */
	clientIp?: string;
	/** User agent */
	userAgent?: string;
	/** User ID */
	userId?: string;
	/** Organization ID */
	orgId?: string;
	/** API key ID (not the actual key) */
	apiKeyId?: string;
	/** Request metadata */
	requestMeta?: Record<string, unknown>;
	/** Response metadata */
	responseMeta?: Record<string, unknown>;
	/** Cost in credits */
	cost?: string;
	/** Currency */
	currency?: string;
}

/**
 * MCP request entity for auditing
 */
export interface McpRequest extends BaseEntity {
	/** Unique request ID */
	requestId: string;
	/** MCP session ID */
	sessionId?: string;
	/** Request timestamp */
	requestedAt: Date;
	/** Response timestamp */
	completedAt?: Date;
	/** Request status */
	status: RequestStatus;
	/** HTTP method */
	method: string;
	/** Request path */
	path: string;
	/** MCP server name */
	serverName: string;
	/** MCP server type */
	serverType: McpServerType;
	/** MCP request type */
	mcpMethod: McpRequestType;
	/** Tool name (for tools/call) */
	toolName?: string;
	/** Resource URI (for resources/read) */
	resourceUri?: string;
	/** Prompt name (for prompts/get) */
	promptName?: string;
	/** Request duration in ms */
	durationMs?: number;
	/** HTTP status code */
	httpStatus?: number;
	/** Error message */
	errorMessage?: string;
	/** Error code */
	errorCode?: string;
	/** Client IP */
	clientIp?: string;
	/** User agent */
	userAgent?: string;
	/** User ID */
	userId?: string;
	/** Request headers */
	requestHeaders?: Record<string, string>;
	/** Request body */
	requestBody?: Record<string, unknown>;
	/** Response metadata */
	responseMeta?: Record<string, unknown>;
}

/**
 * Chat audit statistics
 */
export interface ChatAuditStats {
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	totalInputTokens: number;
	totalOutputTokens: number;
	avgDurationMs: number;
	byModel: { model: string; count: number; tokens: number }[];
	byProvider: { provider: string; count: number; tokens: number }[];
}

/**
 * MCP audit statistics
 */
export interface McpAuditStats {
	totalRequests: number;
	totalErrors: number;
	avgDurationMs: number;
	byServer: { name: string; count: number }[];
	byMethod: { method: string; count: number }[];
}
