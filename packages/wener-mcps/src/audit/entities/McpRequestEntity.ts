import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/es';

/**
 * MCP server type
 */
export const McpServerType = Object.freeze({
	TencentCls: 'tencent-cls',
	Sql: 'sql',
	Prometheus: 'prometheus',
	Relay: 'relay',
	Custom: 'custom',
} as const);
export type McpServerType = (typeof McpServerType)[keyof typeof McpServerType];

/**
 * MCP request type (JSON-RPC method)
 */
export const McpRequestType = Object.freeze({
	Initialize: 'initialize',
	ToolsList: 'tools/list',
	ToolsCall: 'tools/call',
	ResourcesList: 'resources/list',
	ResourcesRead: 'resources/read',
	PromptsList: 'prompts/list',
	PromptsGet: 'prompts/get',
	CompletionComplete: 'completion/complete',
	LoggingSetLevel: 'logging/setLevel',
	Ping: 'ping',
	Other: 'other',
} as const);
export type McpRequestType = (typeof McpRequestType)[keyof typeof McpRequestType];

/**
 * Request status
 */
export const RequestStatus = Object.freeze({
	Pending: 'pending',
	Success: 'success',
	Error: 'error',
	Timeout: 'timeout',
} as const);
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

/**
 * MCP Request Entity for auditing
 */
@Entity({ tableName: 'mcp_request' })
export class McpRequestEntity {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	/** Unique request ID */
	@Property({ type: 'string' })
	requestId!: string;

	/** MCP session ID */
	@Property({ type: 'string', nullable: true })
	sessionId?: string;

	/** Request timestamp */
	@Property({ type: 'datetime' })
	requestedAt: Date = new Date();

	/** Response timestamp */
	@Property({ type: 'datetime', nullable: true })
	completedAt?: Date;

	/** Request status */
	@Enum(() => RequestStatus)
	status: RequestStatus = RequestStatus.Pending;

	/** HTTP method */
	@Property({ type: 'string' })
	method!: string;

	/** Request path */
	@Property({ type: 'string' })
	path!: string;

	/** MCP server name */
	@Property({ type: 'string' })
	serverName!: string;

	/** MCP server type */
	@Enum(() => McpServerType)
	serverType: McpServerType = McpServerType.Custom;

	/** MCP request type (JSON-RPC method) */
	@Enum(() => McpRequestType)
	mcpMethod: McpRequestType = McpRequestType.Other;

	/** Tool name (for tools/call) */
	@Property({ type: 'string', nullable: true })
	toolName?: string;

	/** Resource URI (for resources/read) */
	@Property({ type: 'string', nullable: true })
	resourceUri?: string;

	/** Prompt name (for prompts/get) */
	@Property({ type: 'string', nullable: true })
	promptName?: string;

	/** Request duration in ms */
	@Property({ type: 'integer', nullable: true })
	durationMs?: number;

	/** HTTP status code */
	@Property({ type: 'integer', nullable: true })
	httpStatus?: number;

	/** Error message */
	@Property({ type: 'text', nullable: true })
	errorMessage?: string;

	/** Error code */
	@Property({ type: 'string', nullable: true })
	errorCode?: string;

	/** Client IP */
	@Property({ type: 'string', nullable: true })
	clientIp?: string;

	/** User agent */
	@Property({ type: 'string', nullable: true })
	userAgent?: string;

	/** User ID */
	@Property({ type: 'string', nullable: true })
	userId?: string;

	/** Request headers (JSON) */
	@Property({ type: 'json', nullable: true })
	requestHeaders?: Record<string, string>;

	/** Request body (JSON) */
	@Property({ type: 'json', nullable: true })
	requestBody?: Record<string, unknown>;

	/** Response metadata (JSON) */
	@Property({ type: 'json', nullable: true })
	responseMeta?: Record<string, unknown>;

	@Property({ type: 'datetime' })
	createdAt: Date = new Date();

	@Property({ type: 'datetime', onUpdate: () => new Date() })
	updatedAt: Date = new Date();
}
