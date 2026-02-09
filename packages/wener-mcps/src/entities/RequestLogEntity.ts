import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Generic HTTP Request Log Entity
 * For general request auditing
 */
@Entity({ tableName: 'request_log' })
export class RequestLogEntity {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	/** Unique request ID */
	@Property({ type: 'string' })
	requestId!: string;

	/** Request timestamp */
	@Property({ type: 'datetime' })
	timestamp: Date = new Date();

	/** HTTP method */
	@Property({ type: 'string' })
	method!: string;

	/** Request path */
	@Property({ type: 'string' })
	path!: string;

	/** Request type (chat, mcp, api, etc) */
	@Property({ type: 'string', nullable: true })
	requestType?: string;

	/** Server name (for MCP) or model (for Chat) */
	@Property({ type: 'string', nullable: true })
	serverName?: string;

	/** Server type */
	@Property({ type: 'string', nullable: true })
	serverType?: string;

	/** HTTP status code */
	@Property({ type: 'integer', nullable: true })
	status?: number;

	/** Request duration in ms */
	@Property({ type: 'integer', nullable: true })
	durationMs?: number;

	/** Error message */
	@Property({ type: 'text', nullable: true })
	error?: string;

	/** Client IP */
	@Property({ type: 'string', nullable: true })
	clientIp?: string;

	/** User agent */
	@Property({ type: 'string', nullable: true })
	userAgent?: string;

	/** Request headers (JSON) */
	@Property({ type: 'json', nullable: true })
	requestHeaders?: Record<string, string>;

	/** Request body summary (JSON) */
	@Property({ type: 'json', nullable: true })
	requestBody?: Record<string, unknown>;

	/** Response body summary (JSON) */
	@Property({ type: 'json', nullable: true })
	responseBody?: Record<string, unknown>;

	/** Additional metadata (JSON) */
	@Property({ type: 'json', nullable: true })
	metadata?: Record<string, unknown>;

	@Property({ type: 'datetime' })
	createdAt: Date = new Date();
}
