import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

/**
 * Response Entity for storing Responses API responses
 * Enables previous_response_id support
 */
@Entity({ tableName: 'response' })
export class ResponseEntity {
	@PrimaryKey({ type: 'integer' })
	id!: number;

	/** Response ID (e.g., resp_xxx) */
	@Property({ type: 'string', unique: true })
	responseId!: string;

	/** Model name */
	@Property({ type: 'string' })
	model!: string;

	/** Response status */
	@Property({ type: 'string' })
	status!: string;

	/** Input (request) - stored as JSON */
	@Property({ type: 'json' })
	input!: unknown;

	/** Output items - stored as JSON */
	@Property({ type: 'json' })
	output!: unknown[];

	/** Usage statistics */
	@Property({ type: 'json', nullable: true })
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};

	/** Instructions/system prompt */
	@Property({ type: 'text', nullable: true })
	instructions?: string;

	/** Previous response ID for conversation chaining */
	@Property({ type: 'string', nullable: true })
	previousResponseId?: string;

	/** Tools configuration */
	@Property({ type: 'json', nullable: true })
	tools?: unknown[];

	/** Tool choice */
	@Property({ type: 'json', nullable: true })
	toolChoice?: unknown;

	/** Metadata */
	@Property({ type: 'json', nullable: true })
	metadata?: Record<string, unknown>;

	/** Error information */
	@Property({ type: 'json', nullable: true })
	error?: {
		type?: string;
		message?: string;
		code?: string;
	};

	/** Created timestamp */
	@Property({ type: 'datetime' })
	createdAt: Date = new Date();

	/** Request duration in ms */
	@Property({ type: 'integer', nullable: true })
	durationMs?: number;
}
