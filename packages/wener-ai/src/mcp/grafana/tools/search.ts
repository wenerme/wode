import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const SearchDashboardsInputSchema = z.object({
	query: z.string().nullish().describe('Dashboard search keyword'),
	limit: z.number().int().min(1).max(100).default(50).describe('Maximum number of results to return'),
	page: z.number().int().min(1).default(1).describe('1-based page number'),
});

const SearchFoldersInputSchema = z.object({
	query: z.string().nullish().describe('Folder search keyword'),
});

export function registerSearchTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'search_dashboards',
		{
			description: 'Search Grafana dashboards by a query string',
			inputSchema: SearchDashboardsInputSchema,
			readOnly: true,
		},
		async ({ query, limit, page }) => {
			const dashboards = await ctx.client.request<unknown[]>({
				path: '/api/search',
				params: {
					query,
					type: 'dash-db',
					limit,
					page,
				},
			});
			return {
				dashboards,
				total: dashboards.length,
				hasMore: dashboards.length === limit,
			};
		},
	);

	registerJsonTool(
		ctx,
		'search_folders',
		{
			description: 'Search Grafana folders by a query string',
			inputSchema: SearchFoldersInputSchema,
			readOnly: true,
		},
		({ query }) =>
			ctx.client.request({
				path: '/api/search',
				params: {
					query,
					type: 'dash-folder',
				},
			}),
	);
}
