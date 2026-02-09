import { implement } from '@orpc/server';
import type { Context, Next } from 'hono';
import { LRUCache } from 'lru-cache';
import { AuditContract, type AuditEvent } from '../contracts';
import { RequestLogEntity } from '../entities';
import { ensureDbInitialized, configureDb } from './db';
import type { AuditConfig, DbConfig } from './schema';

/**
 * Convert Headers to a plain record
 */
function headersToRecord(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, key) => {
		record[key] = value;
	});
	return record;
}

// In-memory audit store using LRU cache
const auditStore = new LRUCache<string, AuditEvent>({
	max: 10000, // Keep last 10k events
	ttl: 1000 * 60 * 60 * 24, // 24 hours
});

// Counter for IDs
let eventCounter = 0;

// Audit configuration state
let auditEnabled = true; // default to enabled
let dbConfigured = false;

/**
 * Configure audit module with settings
 * Call this before using audit features
 *
 * @param auditConfig - Audit config section
 * @param fallbackDbConfig - Fallback db config from root config
 */
export function configureAudit(auditConfig?: AuditConfig, fallbackDbConfig?: DbConfig): void {
	// Determine if audit is enabled (default: true)
	auditEnabled = auditConfig?.enabled !== false;

	if (auditEnabled) {
		// Use audit.db config if present, otherwise fallback to root db config
		const dbConfig = auditConfig?.db ?? fallbackDbConfig;
		configureDb(dbConfig);
		dbConfigured = true;
	}
}

/**
 * Check if audit is enabled
 */
export function isAuditEnabled(): boolean {
	return auditEnabled;
}

/**
 * Persist audit event to database (lazy init)
 */
async function persistToDb(event: AuditEvent, id: string): Promise<void> {
	if (!auditEnabled || !dbConfigured) {
		return;
	}

	try {
		// Lazy initialize DB on first persist
		const orm = await ensureDbInitialized();
		const em = orm.em.fork();

		const logEntry = new RequestLogEntity();
		logEntry.requestId = id;
		logEntry.timestamp = new Date(event.timestamp);
		logEntry.method = event.method;
		logEntry.path = event.path;
		logEntry.serverName = event.serverName ?? undefined;
		logEntry.serverType = event.serverType ?? undefined;
		logEntry.status = event.status ?? undefined;
		logEntry.durationMs = event.durationMs ?? undefined;
		logEntry.error = event.error ?? undefined;
		logEntry.requestHeaders = event.requestHeaders ?? undefined;
		// Determine request type
		if (event.path.startsWith('/mcp/')) {
			logEntry.requestType = 'mcp';
		} else if (event.path.startsWith('/v1/')) {
			logEntry.requestType = 'chat';
		} else {
			logEntry.requestType = 'api';
		}
		em.persist(logEntry);
		await em.flush();
	} catch (e) {
		// Log persistence errors but don't throw - in-memory store is the primary
		console.error('Failed to persist audit log:', e);
	}
}

/**
 * Add an audit event
 */
export function addAuditEvent(event: Omit<AuditEvent, 'id'>): AuditEvent {
	const id = `${Date.now()}-${++eventCounter}`;
	const fullEvent: AuditEvent = { ...event, id };
	auditStore.set(id, fullEvent);

	// Persist to database asynchronously (lazy init)
	persistToDb(fullEvent, id).catch(() => {
		// Already logged in persistToDb
	});

	return fullEvent;
}

/**
 * Query audit events
 */
export function queryAuditEvents(options: {
	limit?: number;
	offset?: number;
	serverName?: string | null;
	serverType?: string | null;
	method?: string | null;
	from?: string | null;
	to?: string | null;
}): { events: AuditEvent[]; total: number } {
	const { limit = 50, offset = 0, serverName, serverType, method, from, to } = options;

	// Get all events as array
	let events: AuditEvent[] = [];
	for (const [, event] of auditStore.entries()) {
		events.push(event);
	}

	// Sort by timestamp desc
	events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	// Apply filters
	if (serverName) {
		events = events.filter((e) => e.serverName === serverName);
	}
	if (serverType) {
		events = events.filter((e) => e.serverType === serverType);
	}
	if (method) {
		events = events.filter((e) => e.method === method);
	}
	if (from) {
		const fromTime = new Date(from).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
	}
	if (to) {
		const toTime = new Date(to).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() <= toTime);
	}

	const total = events.length;

	// Paginate
	events = events.slice(offset, offset + limit);

	return { events, total };
}

/**
 * Get audit statistics
 */
export function getAuditStats(options: { from?: string | null; to?: string | null }) {
	let events: AuditEvent[] = [];
	for (const [, event] of auditStore.entries()) {
		events.push(event);
	}

	// Apply time filters
	if (options.from) {
		const fromTime = new Date(options.from).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
	}
	if (options.to) {
		const toTime = new Date(options.to).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() <= toTime);
	}

	// Calculate stats
	const totalRequests = events.length;
	const totalErrors = events.filter((e) => e.error || (e.status && e.status >= 400)).length;

	const durations = events.map((e) => e.durationMs).filter((d): d is number => d != null);
	const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

	// Group by server
	const serverCounts = new Map<string, number>();
	for (const event of events) {
		const name = event.serverName || 'unknown';
		serverCounts.set(name, (serverCounts.get(name) || 0) + 1);
	}
	const byServer = Array.from(serverCounts.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	// Group by method
	const methodCounts = new Map<string, number>();
	for (const event of events) {
		const method = event.method || 'unknown';
		methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
	}
	const byMethod = Array.from(methodCounts.entries())
		.map(([method, count]) => ({ method, count }))
		.sort((a, b) => b.count - a.count);

	return { totalRequests, totalErrors, avgDurationMs, byServer, byMethod };
}

/**
 * Clear audit events before a timestamp
 */
export function clearAuditEvents(before: string): number {
	const beforeTime = new Date(before).getTime();
	let deleted = 0;

	for (const [id, event] of auditStore.entries()) {
		if (new Date(event.timestamp).getTime() < beforeTime) {
			auditStore.delete(id);
			deleted++;
		}
	}

	return deleted;
}

/**
 * Audit Router implementation
 */
export const AuditRouter = implement(AuditContract).router({
	list: implement(AuditContract.list).handler(async ({ input }) => {
		return queryAuditEvents(input);
	}),

	get: implement(AuditContract.get).handler(async ({ input }) => {
		return auditStore.get(input.id) ?? null;
	}),

	stats: implement(AuditContract.stats).handler(async ({ input }) => {
		return getAuditStats(input);
	}),

	clear: implement(AuditContract.clear).handler(async ({ input }) => {
		const deleted = clearAuditEvents(input.before);
		return { deleted };
	}),
});

/**
 * Hono middleware for audit logging
 */
export function auditMiddleware() {
	return async (c: Context, next: Next) => {
		const startTime = Date.now();
		const path = c.req.path;

		// Extract server info from path
		let serverName: string | undefined;
		let serverType: string | undefined;

		const mcpMatch = path.match(/^\/mcp\/([^/]+)/);
		if (mcpMatch) {
			serverName = mcpMatch[1];
			// Infer type from well-known paths
			if (serverName === 'tencent-cls') serverType = 'tencent-cls';
			else if (serverName === 'sql') serverType = 'sql';
			else if (serverName === 'prometheus') serverType = 'prometheus';
			else if (serverName === 'relay') serverType = 'relay';
			else serverType = 'custom';
		}

		// Extract model info from chat requests
		if (path.startsWith('/v1/')) {
			serverType = 'chat';
		}

		let error: string | undefined;

		try {
			await next();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			throw e;
		} finally {
			const durationMs = Date.now() - startTime;

			// Audit MCP requests, Chat API requests, and other API requests
			const shouldAudit =
				path.startsWith('/mcp/') || path.startsWith('/v1/') || (path.startsWith('/api/') && c.req.method !== 'GET');

			if (shouldAudit) {
				addAuditEvent({
					timestamp: new Date().toISOString(),
					method: c.req.method,
					path,
					serverName,
					serverType,
					status: c.res.status,
					durationMs,
					error,
					requestHeaders: headersToRecord(c.req.raw.headers),
				});
			}
		}
	};
}
