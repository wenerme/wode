import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const ListDatasourcesInputSchema = z.object({
	type: z.string().nullish().describe('Optional datasource type filter'),
	limit: z.number().int().min(1).max(500).default(50).describe('Maximum number of datasources to return'),
	page: z.number().int().min(1).default(1).describe('1-based page number'),
});

const GetDatasourceInputSchema = z.object({
	uid: z.string().describe('Datasource UID'),
});

export function registerDatasourceTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_datasources',
		{
			description: 'List configured Grafana datasources with optional type filtering',
			inputSchema: ListDatasourcesInputSchema,
			readOnly: true,
		},
		async ({ type, limit, page }) => {
			const all = await ctx.client.listDatasources();
			const filtered = type ? all.filter((item) => item.type?.toLowerCase().includes(type.toLowerCase())) : all;
			const offset = Math.max(0, (page - 1) * limit);
			return {
				total: filtered.length,
				page,
				limit,
				items: filtered.slice(offset, offset + limit),
			};
		},
	);

	registerJsonTool(
		ctx,
		'get_datasource',
		{
			description: 'Get a Grafana datasource by UID',
			inputSchema: GetDatasourceInputSchema,
			readOnly: true,
		},
		({ uid }) => ctx.client.getDatasource(uid),
	);
}
