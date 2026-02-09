import { implement } from '@orpc/server';
import { McpsContract, type ModelInfo, type ServerInfo, type ServerTypeInfo, type ToolInfo } from '../contracts';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import { getAuditStats, queryAuditEvents } from './audit';
import type { McpsConfig } from './schema';

// Simple glob pattern matching
function matchGlob(pattern: string, text: string): boolean {
	const regexPattern = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except * and ?
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.');
	return new RegExp(`^${regexPattern}$`, 'i').test(text);
}

// Build server types from registry
function getServerTypes(): ServerTypeInfo[] {
	return findMcpServerDef().map((def) => ({
		type: def.name,
		description: def.description,
		dynamicEndpoint: `/mcp/${def.name}`,
	}));
}

// Build endpoints from server types
function getEndpoints(): string[] {
	const mcpEndpoints = findMcpServerDef().map((def) => `/mcp/${def.name}`);
	const chatEndpoints = [
		'/v1/chat/completions',
		'/v1/messages',
		'/v1/models',
		'/v1/responses',
		'/v1/models/:model:generateContent',
		'/v1/models/:model:streamGenerateContent',
	];
	return [...mcpEndpoints, ...chatEndpoints];
}

export interface McpsRouterContext {
	config: McpsConfig;
}

/**
 * Create MCPS Router with config context
 */
export function createMcpsRouter(ctx: McpsRouterContext) {
	const { config } = ctx;

	// Build server info list
	const servers: ServerInfo[] = Object.entries(config.servers).map(([name, serverConfig]) => ({
		name,
		type: serverConfig.type,
		disabled: serverConfig.disabled,
	}));

	// Build model info list
	const models: ModelInfo[] = (config.models ?? []).map((model) => ({
		name: model.name,
		adapter: model.adapter,
		baseUrl: model.baseUrl,
		contextWindow: model.contextWindow,
		maxInputTokens: model.maxInputTokens,
		maxOutputTokens: model.maxOutputTokens,
	}));

	return implement(McpsContract).router({
		overview: implement(McpsContract.overview).handler(async () => {
			return {
				name: '@wener/mcps',
				version: '0.1.0',
				servers,
				serverTypes: getServerTypes(),
				models,
				endpoints: getEndpoints(),
			};
		}),

		stats: implement(McpsContract.stats).handler(async ({ input }) => {
			const auditStats = getAuditStats(input);

			// Build endpoint stats from audit events
			const { events } = queryAuditEvents({ limit: 10000 });
			const endpointCounts = new Map<string, number>();
			for (const event of events) {
				const endpoint = event.path || 'unknown';
				endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
			}
			const byEndpoint = Array.from(endpointCounts.entries())
				.map(([endpoint, count]) => ({ endpoint, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 20); // Top 20 endpoints

			return {
				...auditStats,
				byEndpoint,
			};
		}),

		servers: implement(McpsContract.servers).handler(async () => {
			return { servers };
		}),

		models: implement(McpsContract.models).handler(async () => {
			return { models };
		}),

		tools: implement(McpsContract.tools).handler(async ({ input }) => {
			// TODO: This is a placeholder that returns empty tools list.
			// Full implementation would require connecting to each MCP server
			// and calling tools/list. Consider caching tool lists and
			// refreshing periodically or on demand.
			const tools: ToolInfo[] = [];

			// For now, return an empty list.
			// When MCP servers support persistent connections or when we
			// implement a tool registry, this will be populated.

			// Apply filters if provided
			let filteredTools = tools;

			if (input.server) {
				filteredTools = filteredTools.filter((t) => t.serverName === input.server);
			}

			if (input.filter) {
				const patterns = input.filter.split(',').map((p) => p.trim());
				filteredTools = filteredTools.filter((t) => patterns.some((pattern) => matchGlob(pattern, t.name)));
			}

			return { tools: filteredTools };
		}),
	});
}
