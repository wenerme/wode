import { implement } from '@orpc/server';
import { McpsContract, type ModelInfo, type ServerInfo, type ServerTypeInfo, type ToolInfo } from '../contracts';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import type { McpsConfig } from './schema';
import type { StatsProvider } from './server';

function matchGlob(pattern: string, text: string): boolean {
	const regexPattern = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.');
	return new RegExp(`^${regexPattern}$`, 'i').test(text);
}

function getServerTypes(): ServerTypeInfo[] {
	return findMcpServerDef().map((def) => ({
		type: def.name,
		description: def.description,
		dynamicEndpoint: `/mcp/${def.name}`,
	}));
}

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
	/** Optional stats provider (e.g. from audit plugin) */
	statsProvider?: StatsProvider;
}

const emptyStats = {
	totalRequests: 0,
	totalErrors: 0,
	avgDurationMs: 0,
	byServer: [] as Array<{ name: string; count: number }>,
	byMethod: [] as Array<{ method: string; count: number }>,
};

export function createMcpsRouter(ctx: McpsRouterContext) {
	const { config, statsProvider } = ctx;

	const servers: ServerInfo[] = Object.entries(config.servers).map(([name, serverConfig]) => ({
		name,
		type: serverConfig.type,
		disabled: serverConfig.disabled,
	}));

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
			if (!statsProvider) {
				return { ...emptyStats, byEndpoint: [] };
			}

			const auditStats = statsProvider.getStats(input);
			const { events } = statsProvider.queryEvents({ limit: 10000 });

			const endpointCounts = new Map<string, number>();
			for (const event of events) {
				const endpoint = event.path || 'unknown';
				endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
			}
			const byEndpoint = Array.from(endpointCounts.entries())
				.map(([endpoint, count]) => ({ endpoint, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 20);

			return { ...auditStats, byEndpoint };
		}),

		servers: implement(McpsContract.servers).handler(async () => {
			return { servers };
		}),

		models: implement(McpsContract.models).handler(async () => {
			return { models };
		}),

		tools: implement(McpsContract.tools).handler(async ({ input }) => {
			const tools: ToolInfo[] = [];
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
