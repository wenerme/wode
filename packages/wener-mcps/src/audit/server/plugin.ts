import { implement } from '@orpc/server';
import { LRUCache } from 'lru-cache';
import { McpsEventType } from '../../server/events';
import type { AuditConfig, DbConfig } from '../../server/schema';
import type { McpsServerContext } from '../../server/server';
import { AuditContract, type AuditEvent } from '../AuditContract';

function headersToRecord(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, key) => {
		record[key] = value;
	});
	return record;
}

const auditStore = new LRUCache<string, AuditEvent>({
	max: 10000,
	ttl: 1000 * 60 * 60 * 24,
});

let eventCounter = 0;
let dbConfigured = false;
let storedAuditConfig: AuditConfig | undefined;
let storedDbConfig: DbConfig | undefined;

async function persistToDb(event: AuditEvent, id: string): Promise<void> {
	if (!dbConfigured) return;

	try {
		const { ensureDbInitialized, RequestLogEntity } = await import('./db.js');
		const orm = await ensureDbInitialized(storedDbConfig);
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
		console.error('Failed to persist audit log:', e);
	}
}

export function addAuditEvent(event: Omit<AuditEvent, 'id'>): AuditEvent {
	const id = `${Date.now()}-${++eventCounter}`;
	const fullEvent: AuditEvent = { ...event, id };
	auditStore.set(id, fullEvent);

	persistToDb(fullEvent, id).catch(() => {});

	return fullEvent;
}

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

	let events: AuditEvent[] = [];
	for (const [, event] of auditStore.entries()) {
		events.push(event);
	}

	events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	if (serverName) events = events.filter((e) => e.serverName === serverName);
	if (serverType) events = events.filter((e) => e.serverType === serverType);
	if (method) events = events.filter((e) => e.method === method);
	if (from) {
		const fromTime = new Date(from).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
	}
	if (to) {
		const toTime = new Date(to).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() <= toTime);
	}

	const total = events.length;
	events = events.slice(offset, offset + limit);

	return { events, total };
}

export function getAuditStats(options: { from?: string | null; to?: string | null }) {
	let events: AuditEvent[] = [];
	for (const [, event] of auditStore.entries()) {
		events.push(event);
	}

	if (options.from) {
		const fromTime = new Date(options.from).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
	}
	if (options.to) {
		const toTime = new Date(options.to).getTime();
		events = events.filter((e) => new Date(e.timestamp).getTime() <= toTime);
	}

	const totalRequests = events.length;
	const totalErrors = events.filter((e) => e.error || (e.status && e.status >= 400)).length;

	const durations = events.map((e) => e.durationMs).filter((d): d is number => d != null);
	const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

	const serverCounts = new Map<string, number>();
	for (const event of events) {
		const name = event.serverName || 'unknown';
		serverCounts.set(name, (serverCounts.get(name) || 0) + 1);
	}
	const byServer = Array.from(serverCounts.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	const methodCounts = new Map<string, number>();
	for (const event of events) {
		const m = event.method || 'unknown';
		methodCounts.set(m, (methodCounts.get(m) || 0) + 1);
	}
	const byMethod = Array.from(methodCounts.entries())
		.map(([method, count]) => ({ method, count }))
		.sort((a, b) => b.count - a.count);

	return { totalRequests, totalErrors, avgDurationMs, byServer, byMethod };
}

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
 * Set up audit by subscribing to the server emitter.
 * Call this from the `setup` callback of `createServer` to opt in to audit.
 *
 * @example
 * ```ts
 * createServer({
 *   setup: (ctx) => {
 *     setupAudit(ctx);
 *   },
 * });
 * ```
 */
export function setupAudit(ctx: McpsServerContext, options?: { auditConfig?: AuditConfig; dbConfig?: DbConfig }) {
	const auditConfig = options?.auditConfig ?? ctx.config.audit;
	const dbConfig = options?.dbConfig ?? ctx.config.db;

	const enabled = auditConfig?.enabled !== false;
	if (!enabled) return;

	const auditDbConfig = auditConfig?.db ?? dbConfig;
	if (auditDbConfig) {
		storedDbConfig = auditDbConfig;
		dbConfigured = true;
	}
	storedAuditConfig = auditConfig;

	// Subscribe to request events
	ctx.emitter.on(McpsEventType.Request, (event) => {
		const shouldAudit =
			event.path.startsWith('/mcp/') ||
			event.path.startsWith('/v1/') ||
			(event.path.startsWith('/api/') && event.method !== 'GET');

		if (shouldAudit) {
			addAuditEvent({
				timestamp: event.timestamp,
				method: event.method,
				path: event.path,
				serverName: event.serverName,
				serverType: event.serverType,
				status: event.status,
				durationMs: event.durationMs,
				error: event.error,
				requestHeaders: event.requestHeaders,
			});
		}
	});

	// Register audit API router
	ctx.apiRouters.audit = AuditRouter;

	// Register stats provider so mcps-router can access stats
	ctx.statsProvider = {
		getStats: getAuditStats,
		queryEvents: (opts) => {
			const result = queryAuditEvents(opts);
			return { events: result.events.map((e) => ({ path: e.path })), total: result.total };
		},
	};
}
