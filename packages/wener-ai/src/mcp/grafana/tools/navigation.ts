import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const GenerateDeeplinkInputSchema = z.object({
	resourceType: z.enum(['dashboard', 'panel', 'explore']).describe('Grafana resource type'),
	dashboardUid: z.string().nullish().describe('Dashboard UID'),
	datasourceUid: z.string().nullish().describe('Datasource UID for Explore'),
	panelId: z.number().int().nullish().describe('Panel ID for panel deeplinks'),
	queries: z.array(z.record(z.string(), z.unknown())).default([]).describe('Explore query objects'),
	queryParams: z.record(z.string(), z.string()).default({}).describe('Additional URL query params'),
	timeRange: z
		.object({
			from: z.string().nullish(),
			to: z.string().nullish(),
		})
		.nullish()
		.describe('Optional Grafana time range'),
});

export function registerNavigationTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'generate_deeplink',
		{
			description: 'Generate deeplink URLs for dashboards, panels, and Explore',
			inputSchema: GenerateDeeplinkInputSchema,
			readOnly: true,
		},
		async ({ resourceType, dashboardUid, datasourceUid, panelId, queries, queryParams, timeRange }) => {
			const baseUrl = (await ctx.client.getPublicUrl()).replace(/\/+$/, '');

			if (resourceType === 'dashboard') {
				if (!dashboardUid) throw new Error('dashboardUid is required for dashboard deeplinks');
				const url = new URL(`${baseUrl}/d/${dashboardUid}`);
				if (timeRange?.from) url.searchParams.set('from', timeRange.from);
				if (timeRange?.to) url.searchParams.set('to', timeRange.to);
				for (const [key, value] of Object.entries(queryParams)) url.searchParams.set(key, value);
				return url.toString();
			}

			if (resourceType === 'panel') {
				if (!dashboardUid || !panelId) throw new Error('dashboardUid and panelId are required for panel deeplinks');
				const url = new URL(`${baseUrl}/d/${dashboardUid}`);
				url.searchParams.set('viewPanel', String(panelId));
				if (timeRange?.from) url.searchParams.set('from', timeRange.from);
				if (timeRange?.to) url.searchParams.set('to', timeRange.to);
				for (const [key, value] of Object.entries(queryParams)) url.searchParams.set(key, value);
				return url.toString();
			}

			if (!datasourceUid) throw new Error('datasourceUid is required for explore deeplinks');
			const url = new URL(`${baseUrl}/explore`);
			const left = {
				datasource: datasourceUid,
				queries,
				...(timeRange ? { range: timeRange } : {}),
			};
			url.searchParams.set('left', JSON.stringify(left));
			for (const [key, value] of Object.entries(queryParams)) url.searchParams.set(key, value);
			return url.toString();
		},
	);
}
