import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Chat protocol type
 */
export const ChatProtocolType = Object.freeze({
	OpenAI: 'openai',
	Anthropic: 'anthropic',
	Gemini: 'gemini',
} as const);
export type ChatProtocolType = (typeof ChatProtocolType)[keyof typeof ChatProtocolType];

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
 * Chat Request Entity for auditing and metering
 */
@Entity({ tableName: 'chat_request' })
export class ChatRequestEntity {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	/** Unique request ID for tracing */
	@Property({ type: 'string', unique: true })
	requestId!: string;

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

	/** Request path/endpoint */
	@Property({ type: 'string' })
	endpoint!: string;

	/** Input protocol (client-facing) */
	@Enum(() => ChatProtocolType)
	inputProtocol!: ChatProtocolType;

	/** Output protocol (upstream provider) */
	@Enum(() => ChatProtocolType)
	outputProtocol!: ChatProtocolType;

	/** Model name requested */
	@Property({ type: 'string' })
	model!: string;

	/** Resolved model name */
	@Property({ type: 'string', nullable: true })
	resolvedModel?: string;

	/** Provider name */
	@Property({ type: 'string', nullable: true })
	provider?: string;

	/** Upstream base URL */
	@Property({ type: 'string', nullable: true })
	upstreamUrl?: string;

	/** Whether request was streaming */
	@Property({ type: 'boolean', default: false })
	streaming: boolean = false;

	/** Input token count */
	@Property({ type: 'integer', nullable: true })
	inputTokens?: number;

	/** Output token count */
	@Property({ type: 'integer', nullable: true })
	outputTokens?: number;

	/** Total token count */
	@Property({ type: 'integer', nullable: true })
	totalTokens?: number;

	/** Request duration in ms */
	@Property({ type: 'integer', nullable: true })
	durationMs?: number;

	/** Time to first token in ms */
	@Property({ type: 'integer', nullable: true })
	ttftMs?: number;

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

	/** Organization ID */
	@Property({ type: 'string', nullable: true })
	orgId?: string;

	/** API key ID (not the actual key) */
	@Property({ type: 'string', nullable: true })
	apiKeyId?: string;

	/** Request metadata (JSON) */
	@Property({ type: 'json', nullable: true })
	requestMeta?: Record<string, unknown>;

	/** Response metadata (JSON) */
	@Property({ type: 'json', nullable: true })
	responseMeta?: Record<string, unknown>;

	/** Cost in credits (decimal string) */
	@Property({ type: 'string', nullable: true })
	cost?: string;

	/** Currency */
	@Property({ type: 'string', nullable: true })
	currency?: string;

	@Property({ type: 'datetime' })
	createdAt: Date = new Date();

	@Property({ type: 'datetime', onUpdate: () => new Date() })
	updatedAt: Date = new Date();
}
