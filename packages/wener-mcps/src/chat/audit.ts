/**
 * Chat Request Audit Service
 * Records all chat/LLM API requests for auditing and metering
 */
import type { Context } from 'hono';
import consola from 'consola';
import type { ChatProtocolType, RequestStatus as RequestStatusType, ChatAuditStats } from '../entities/types';

const log = consola.withTag('chat-audit');

/**
 * Re-export protocol and status constants for convenience
 */
export const ChatProtocol = {
	OPENAI: 'openai' as ChatProtocolType,
	ANTHROPIC: 'anthropic' as ChatProtocolType,
	GEMINI: 'gemini' as ChatProtocolType,
};

export const RequestStatus = {
	PENDING: 'pending' as RequestStatusType,
	SUCCESS: 'success' as RequestStatusType,
	ERROR: 'error' as RequestStatusType,
	TIMEOUT: 'timeout' as RequestStatusType,
};

/**
 * Chat audit record (in-memory representation)
 */
export interface ChatAuditRecord {
	requestId: string;
	requestedAt: Date;
	completedAt?: Date;
	status: RequestStatusType;
	method: string;
	endpoint: string;
	inputProtocol: ChatProtocolType;
	outputProtocol: ChatProtocolType;
	model: string;
	resolvedModel?: string;
	provider?: string;
	upstreamUrl?: string;
	streaming: boolean;
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	durationMs?: number;
	ttftMs?: number;
	httpStatus?: number;
	errorMessage?: string;
	errorCode?: string;
	clientIp?: string;
	userAgent?: string;
	userId?: string;
	orgId?: string;
	apiKeyId?: string;
	requestMeta?: Record<string, unknown>;
	responseMeta?: Record<string, unknown>;
	cost?: string;
	currency?: string;
}

/**
 * Audit store interface
 */
export interface ChatAuditStore {
	/**
	 * Save a chat audit record
	 */
	save(record: ChatAuditRecord): Promise<void>;

	/**
	 * Query audit records
	 */
	query(options: ChatAuditQueryOptions): Promise<{ records: ChatAuditRecord[]; total: number }>;

	/**
	 * Get aggregate statistics
	 */
	getStats(options: { from?: Date; to?: Date }): Promise<import('../entities/types').ChatAuditStats>;
}

export interface ChatAuditQueryOptions {
	limit?: number;
	offset?: number;
	model?: string;
	provider?: string;
	status?: RequestStatusType;
	from?: Date;
	to?: Date;
	userId?: string;
	orgId?: string;
}

// Re-export ChatAuditStats from entities
export type { ChatAuditStats } from '../entities/types';

/**
 * In-memory audit store implementation
 */
export class InMemoryChatAuditStore implements ChatAuditStore {
	private records: ChatAuditRecord[] = [];
	private maxSize: number;

	constructor(maxSize = 10000) {
		this.maxSize = maxSize;
	}

	async save(record: ChatAuditRecord): Promise<void> {
		this.records.unshift(record);

		// Trim to max size
		if (this.records.length > this.maxSize) {
			this.records = this.records.slice(0, this.maxSize);
		}

		log.debug(`Saved audit record: ${record.requestId} model=${record.model} status=${record.status}`);
	}

	async query(options: ChatAuditQueryOptions): Promise<{ records: ChatAuditRecord[]; total: number }> {
		let filtered = [...this.records];

		if (options.model) {
			filtered = filtered.filter((r) => r.model === options.model);
		}
		if (options.provider) {
			filtered = filtered.filter((r) => r.provider === options.provider);
		}
		if (options.status) {
			filtered = filtered.filter((r) => r.status === options.status);
		}
		if (options.userId) {
			filtered = filtered.filter((r) => r.userId === options.userId);
		}
		if (options.orgId) {
			filtered = filtered.filter((r) => r.orgId === options.orgId);
		}
		if (options.from) {
			const from = options.from;
			filtered = filtered.filter((r) => r.requestedAt >= from);
		}
		if (options.to) {
			const to = options.to;
			filtered = filtered.filter((r) => r.requestedAt <= to);
		}

		const total = filtered.length;
		const offset = options.offset || 0;
		const limit = options.limit || 50;

		return {
			records: filtered.slice(offset, offset + limit),
			total,
		};
	}

	async getStats(options: { from?: Date; to?: Date }): Promise<ChatAuditStats> {
		let filtered = [...this.records];

		if (options.from) {
			const from = options.from;
			filtered = filtered.filter((r) => r.requestedAt >= from);
		}
		if (options.to) {
			const to = options.to;
			filtered = filtered.filter((r) => r.requestedAt <= to);
		}

		const totalRequests = filtered.length;
		const successfulRequests = filtered.filter((r) => r.status === RequestStatus.SUCCESS).length;
		const failedRequests = filtered.filter((r) => r.status === RequestStatus.ERROR).length;

		const totalInputTokens = filtered.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
		const totalOutputTokens = filtered.reduce((sum, r) => sum + (r.outputTokens || 0), 0);

		const durations = filtered.map((r) => r.durationMs).filter((d): d is number => d != null);
		const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

		// Group by model
		const modelMap = new Map<string, { count: number; tokens: number }>();
		for (const r of filtered) {
			const existing = modelMap.get(r.model) || { count: 0, tokens: 0 };
			existing.count++;
			existing.tokens += (r.inputTokens || 0) + (r.outputTokens || 0);
			modelMap.set(r.model, existing);
		}
		const byModel = Array.from(modelMap.entries())
			.map(([model, data]) => ({ model, ...data }))
			.sort((a, b) => b.count - a.count);

		// Group by provider
		const providerMap = new Map<string, { count: number; tokens: number }>();
		for (const r of filtered) {
			const provider = r.provider || 'unknown';
			const existing = providerMap.get(provider) || { count: 0, tokens: 0 };
			existing.count++;
			existing.tokens += (r.inputTokens || 0) + (r.outputTokens || 0);
			providerMap.set(provider, existing);
		}
		const byProvider = Array.from(providerMap.entries())
			.map(([provider, data]) => ({ provider, ...data }))
			.sort((a, b) => b.count - a.count);

		return {
			totalRequests,
			successfulRequests,
			failedRequests,
			totalInputTokens,
			totalOutputTokens,
			avgDurationMs,
			byModel,
			byProvider,
		};
	}
}

// Global audit store instance
let auditStore: ChatAuditStore = new InMemoryChatAuditStore();

/**
 * Set the audit store implementation
 */
export function setChatAuditStore(store: ChatAuditStore) {
	auditStore = store;
}

/**
 * Get the current audit store
 */
export function getChatAuditStore(): ChatAuditStore {
	return auditStore;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
	return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an audit context for tracking a request
 */
export function createAuditContext(options: {
	method: string;
	endpoint: string;
	model: string;
	inputProtocol: ChatProtocolType;
	outputProtocol: ChatProtocolType;
	streaming: boolean;
	clientIp?: string;
	userAgent?: string;
	userId?: string;
	requestMeta?: Record<string, unknown>;
}): ChatAuditContext {
	return new ChatAuditContext(options);
}

/**
 * Audit context for tracking a single request lifecycle
 */
export class ChatAuditContext {
	private record: ChatAuditRecord;
	private startTime: number;
	private firstTokenTime?: number;

	constructor(options: {
		method: string;
		endpoint: string;
		model: string;
		inputProtocol: ChatProtocolType;
		outputProtocol: ChatProtocolType;
		streaming: boolean;
		clientIp?: string;
		userAgent?: string;
		userId?: string;
		requestMeta?: Record<string, unknown>;
	}) {
		this.startTime = Date.now();
		this.record = {
			requestId: generateRequestId(),
			requestedAt: new Date(),
			status: RequestStatus.PENDING,
			method: options.method,
			endpoint: options.endpoint,
			inputProtocol: options.inputProtocol,
			outputProtocol: options.outputProtocol,
			model: options.model,
			streaming: options.streaming,
			clientIp: options.clientIp,
			userAgent: options.userAgent,
			userId: options.userId,
			requestMeta: options.requestMeta,
		};
	}

	get requestId(): string {
		return this.record.requestId;
	}

	/**
	 * Set the resolved model and provider info
	 */
	setProvider(options: { resolvedModel?: string; provider?: string; upstreamUrl?: string }) {
		Object.assign(this.record, options);
	}

	/**
	 * Record first token received (for TTFT)
	 */
	recordFirstToken() {
		if (!this.firstTokenTime) {
			this.firstTokenTime = Date.now();
			this.record.ttftMs = this.firstTokenTime - this.startTime;
		}
	}

	/**
	 * Record token usage
	 */
	setTokenUsage(input: number, output: number) {
		this.record.inputTokens = input;
		this.record.outputTokens = output;
		this.record.totalTokens = input + output;
	}

	/**
	 * Set response metadata
	 */
	setResponseMeta(meta: Record<string, unknown>) {
		this.record.responseMeta = meta;
	}

	/**
	 * Get current duration in ms
	 */
	getDuration(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * Complete the request successfully
	 */
	async complete(httpStatus: number = 200) {
		this.record.status = RequestStatus.SUCCESS;
		this.record.httpStatus = httpStatus;
		this.record.completedAt = new Date();
		this.record.durationMs = Date.now() - this.startTime;

		await auditStore.save(this.record);
	}

	/**
	 * Complete the request with an error
	 */
	async error(errorMessage: string, errorCode?: string, httpStatus: number = 500) {
		this.record.status = RequestStatus.ERROR;
		this.record.httpStatus = httpStatus;
		this.record.errorMessage = errorMessage;
		this.record.errorCode = errorCode;
		this.record.completedAt = new Date();
		this.record.durationMs = Date.now() - this.startTime;

		await auditStore.save(this.record);
	}
}

/**
 * Extract client IP from Hono context
 */
export function extractClientIp(c: Context): string | undefined {
	return (
		c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
		c.req.header('x-real-ip') ||
		c.req.header('cf-connecting-ip')
	);
}
