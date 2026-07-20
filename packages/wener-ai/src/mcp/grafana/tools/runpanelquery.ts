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

/** Check if a string is a Grafana variable reference like $var, ${var}, or [[var]] */
function isVariableRef(s: string): boolean {
	return s.startsWith('$') || s.startsWith('[[');
}

/** Extract variable name from $var, ${var}, or [[var]] */
function extractVariableName(s: string): string {
	if (s.startsWith('${') && s.endsWith('}')) return s.slice(2, -1);
	if (s.startsWith('[[') && s.endsWith(']]')) return s.slice(2, -2);
	if (s.startsWith('$')) return s.slice(1);
	return s;
}

/** Substitute template variables in a query string: ${var}, [[var]], $var */
function substituteVariables(query: string, variables: Record<string, string>): string {
	for (const [name, value] of Object.entries(variables)) {
		query = query.replaceAll(`\${${name}}`, value);
		query = query.replaceAll(`[[${name}]]`, value);
		query = query.replace(new RegExp(`\\$${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), value);
	}
	return query;
}

/** Extract template variables and their current values from dashboard model */
function extractTemplateVariables(model: Record<string, unknown>): Record<string, string> {
	const variables: Record<string, string> = {};
	const templating = toRecord(model.templating);
	const list = Array.isArray(templating.list) ? templating.list : [];
	for (const item of list) {
		const v = toRecord(item);
		const name = String(v.name || '');
		if (!name) continue;
		const current = toRecord(v.current);
		const val = current.value;
		if (typeof val === 'string' && val !== '$__all') {
			variables[name] = val;
		} else if (Array.isArray(val) && val.length > 0) {
			const first = String(val[0]);
			if (first !== '$__all') variables[name] = first;
		}
		if (!variables[name] && typeof current.text === 'string' && current.text !== '' && current.text !== 'All') {
			variables[name] = current.text;
		}
	}
	return variables;
}

export function registerRunPanelQueryTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'run_panel_query',
		{
			description:
				'Execute queries from dashboard panels with optional time range and variable overrides. ' +
				'Fetches the dashboard, extracts queries, substitutes template variables and Grafana macros, ' +
				'and routes to the appropriate datasource. Use get_dashboard_summary first to find panel IDs. ' +
				'If a panel uses a template variable datasource, provide the datasource UID via variables or datasourceUid override.',
			inputSchema: z.object({
				dashboardUid: z.string().describe('Dashboard UID'),
				panelId: z.number().int().describe('Panel ID to execute'),
				queryIndex: z
					.number()
					.int()
					.nullish()
					.describe('Index of the query to execute per panel (0-based, defaults to all)'),
				from: z.string().nullish().describe("Start time (e.g. 'now-1h', RFC3339, Unix ms)"),
				to: z.string().nullish().describe("End time (e.g. 'now', RFC3339, Unix ms)"),
				variables: z
					.record(z.string(), z.string())
					.default({})
					.describe('Override dashboard variables (e.g. {"job": "api-server"})'),
				datasourceUid: z.string().nullish().describe('Override datasource UID'),
			}),
			readOnly: true,
		},
		async ({ dashboardUid, panelId, queryIndex, from, to, variables, datasourceUid: dsOverride }) => {
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

			// Extract dashboard template variables, then apply user overrides
			const vars = { ...extractTemplateVariables(model), ...variables };

			const datasource = toRecord(panel.datasource);
			let datasourceUid = dsOverride || String(datasource.uid || toRecord(targets[0]?.datasource).uid || '');

			// Resolve variable references in datasource UID
			if (isVariableRef(datasourceUid)) {
				const varName = extractVariableName(datasourceUid);
				if (vars[varName]) {
					datasourceUid = vars[varName];
				} else {
					throw new Error(
						`Datasource variable '${datasourceUid}' not resolved. ` +
							`Provide it via variables (e.g. {"${varName}": "<uid>"}) or datasourceUid override.`,
					);
				}
			}

			if (!datasourceUid) {
				throw new Error(`Panel ${panelId} is missing datasource UID`);
			}

			// Select queries by index if specified
			let selectedTargets = targets;
			if (queryIndex != null) {
				if (queryIndex < 0 || queryIndex >= targets.length) {
					throw new Error(`queryIndex ${queryIndex} out of range (panel has ${targets.length} queries)`);
				}
				selectedTargets = [targets[queryIndex]];
			}

			// Substitute variables in query expressions
			const processedQueries = selectedTargets.map((target) => {
				const processed = { ...target };
				for (const key of ['expr', 'query', 'expression', 'rawSql', 'rawQuery']) {
					if (typeof processed[key] === 'string') {
						processed[key] = substituteVariables(processed[key] as string, vars);
					}
				}
				return {
					...processed,
					datasourceType: String(toRecord(target.datasource).type || datasource.type || ''),
				};
			});

			const range = resolveTimeRange({ from, to });
			return queryDatasource(ctx, {
				datasourceUid,
				from: range.fromIso,
				to: range.toIso,
				variables: vars,
				queries: processedQueries,
			});
		},
	);
}
