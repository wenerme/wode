import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

const SiftBasePath = '/api/plugins/grafana-ml-app/resources/sift/api/v1';

async function siftRequest(ctx: GrafanaContext, path: string, options?: { method?: 'GET' | 'POST'; body?: unknown }) {
	return ctx.client.request({
		path: `${SiftBasePath}${path}`,
		method: options?.method ?? 'GET',
		body: options?.body,
	});
}

async function createInvestigation(
	ctx: GrafanaContext,
	input: {
		name: string;
		labels: Record<string, string>;
		start?: string | null;
		end?: string | null;
		checkName: 'ErrorPatternLogs' | 'SlowRequests';
	},
) {
	const range = resolveTimeRange({ from: input.start, to: input.end }, 30 * 60 * 1000);
	return siftRequest(ctx, '/investigations', {
		method: 'POST',
		body: {
			name: input.name,
			grafanaUrl: ctx.client.baseUrl,
			status: 'pending',
			requestData: {
				labels: input.labels,
				start: range.fromIso,
				end: range.toIso,
				checks: [input.checkName],
			},
		},
	});
}

export function registerSiftTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_sift_investigation',
		{
			description: 'Get a Sift investigation by UUID',
			inputSchema: z.object({
				id: z.string(),
			}),
			readOnly: true,
		},
		({ id }) => siftRequest(ctx, `/investigations/${id}`),
	);

	registerJsonTool(
		ctx,
		'get_sift_analysis',
		{
			description: 'Get a specific Sift analysis from an investigation',
			inputSchema: z.object({
				investigationId: z.string(),
				analysisId: z.string(),
			}),
			readOnly: true,
		},
		async ({ investigationId, analysisId }) => {
			const analyses = await siftRequest(ctx, `/investigations/${investigationId}/analyses`);
			if (!analyses || typeof analyses !== 'object') return analyses;
			const items: unknown[] = Array.isArray((analyses as { data?: unknown[] }).data)
				? (analyses as { data?: unknown[] }).data
				: Array.isArray((analyses as { items?: unknown[] }).items)
					? (analyses as { items?: unknown[] }).items
					: [];
			return items.find((entry) => typeof entry === 'object' && entry && (entry as { id?: string }).id === analysisId) ?? null;
		},
	);

	registerJsonTool(
		ctx,
		'list_sift_investigations',
		{
			description: 'List Sift investigations',
			inputSchema: z.object({
				limit: z.number().int().min(1).max(200).default(10),
			}),
			readOnly: true,
		},
		({ limit }) => siftRequest(ctx, `/investigations?limit=${limit}`),
	);

	if (!ctx.writeEnabled) return;

	registerJsonTool(
		ctx,
		'find_error_pattern_logs',
		{
			description: 'Create a Sift investigation for ErrorPatternLogs',
			inputSchema: z.object({
				name: z.string(),
				labels: z.record(z.string(), z.string()),
				start: z.string().nullish(),
				end: z.string().nullish(),
			}),
		},
		({ name, labels, start, end }) =>
			createInvestigation(ctx, {
				name,
				labels,
				start,
				end,
				checkName: 'ErrorPatternLogs',
			}),
	);

	registerJsonTool(
		ctx,
		'find_slow_requests',
		{
			description: 'Create a Sift investigation for SlowRequests',
			inputSchema: z.object({
				name: z.string(),
				labels: z.record(z.string(), z.string()),
				start: z.string().nullish(),
				end: z.string().nullish(),
			}),
		},
		({ name, labels, start, end }) =>
			createInvestigation(ctx, {
				name,
				labels,
				start,
				end,
				checkName: 'SlowRequests',
			}),
	);
}
