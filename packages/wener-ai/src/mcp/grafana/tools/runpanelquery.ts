import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { queryDatasource } from './query-helpers';
import { resolveTimeRange, toRecord } from '../utils';

function collectPanels(root: Record<string, unknown>): Record<string, unknown>[] {
	const panels = Array.isArray(root.panels) ? root.panels.map((item) => toRecord(item)) : [];
	return panels.flatMap((panel) => {
		const nested = Array.isArray(panel.panels) ? panel.panels.map((item) => toRecord(item)) : [];
		return [panel, ...nested];
	});
}

export function registerRunPanelQueryTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'run_panel_query',
		{
			description: 'Execute all queries from a specific dashboard panel',
			inputSchema: z.object({
				dashboardUid: z.string(),
				panelId: z.number().int(),
				from: z.string().nullish(),
				to: z.string().nullish(),
				variables: z.record(z.string(), z.string()).default({}),
			}),
			readOnly: true,
		},
		async ({ dashboardUid, panelId, from, to, variables }) => {
			const dashboard = await ctx.client.request<{
				dashboard?: Record<string, unknown>;
			}>({
				path: `/api/dashboards/uid/${encodeURIComponent(dashboardUid)}`,
			});
			const model = toRecord(dashboard.dashboard);
			const panel = collectPanels(model).find((entry) => Number(entry.id) === panelId);
			if (!panel) throw new Error(`Panel ${panelId} not found in dashboard ${dashboardUid}`);

			const targets = Array.isArray(panel.targets) ? panel.targets.map((entry) => toRecord(entry)) : [];
			if (targets.length === 0) {
				throw new Error(`Panel ${panelId} has no query targets`);
			}

			const datasource = toRecord(panel.datasource);
			const datasourceUid = String(datasource.uid || toRecord(targets[0]?.datasource).uid || '');
			if (!datasourceUid) {
				throw new Error(`Panel ${panelId} is missing datasource UID`);
			}

			const range = resolveTimeRange({ from, to });
			return queryDatasource(ctx, {
				datasourceUid,
				from: range.fromIso,
				to: range.toIso,
				variables,
				queries: targets.map((target) => ({
					...target,
					datasourceType: String(toRecord(target.datasource).type || datasource.type || ''),
				})),
			});
		},
	);
}
