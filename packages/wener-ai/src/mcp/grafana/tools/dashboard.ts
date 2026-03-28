import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { getByPath, pickFirstString, removeByPath, setByPath, toRecord } from '../utils';

const GetDashboardByUidInputSchema = z.object({
	uid: z.string().describe('Dashboard UID'),
});

const UpdateDashboardInputSchema = z.object({
	dashboard: z.record(z.string(), z.unknown()).nullish().describe('Full dashboard JSON'),
	uid: z.string().nullish().describe('Existing dashboard UID for patch mode'),
	operations: z
		.array(
			z.object({
				op: z.enum(['replace', 'add', 'remove']),
				path: z.string().describe('Simple JSONPath like $.title or $.panels[0].targets[0].expr'),
				value: z.unknown().nullish(),
			}),
		)
		.default([]),
	folderUid: z.string().nullish().describe('Folder UID'),
	message: z.string().nullish().describe('Version message'),
	overwrite: z.boolean().default(true),
	userId: z.number().int().nullish().describe('User ID'),
});

const GetDashboardPanelQueriesInputSchema = z.object({
	uid: z.string().describe('Dashboard UID'),
	panelId: z.number().int().nullish().describe('Optional panel ID'),
	variables: z.record(z.string(), z.string()).default({}).describe('Template variable overrides'),
});

const GetDashboardPropertyInputSchema = z.object({
	uid: z.string().describe('Dashboard UID'),
	jsonPath: z.string().describe('JSONPath subset like $.title or $.panels[*].title'),
});

const GetDashboardSummaryInputSchema = z.object({
	uid: z.string().describe('Dashboard UID'),
});

type DashboardModel = {
	dashboard?: Record<string, unknown>;
	meta?: Record<string, unknown>;
};

function ensureDashboardPayload(payload: unknown) {
	const model = toRecord(payload) as DashboardModel;
	const dashboard = toRecord(model.dashboard);
	return {
		model,
		dashboard,
		meta: toRecord(model.meta),
	};
}

function collectPanels(panel: Record<string, unknown>): Record<string, unknown>[] {
	const direct = Array.isArray(panel.panels) ? panel.panels : [];
	const rows = Array.isArray(panel.rows) ? panel.rows : [];
	const nested = rows.flatMap((row) => {
		const rowObject = toRecord(row);
		return Array.isArray(rowObject.panels) ? rowObject.panels : [];
	});
	return [...direct, ...nested].flatMap((entry) => {
		const panelObject = toRecord(entry);
		const collapsed = Array.isArray(panelObject.panels) ? panelObject.panels.map((item) => toRecord(item)) : [];
		return [panelObject, ...collapsed];
	});
}

function extractTemplateVariables(dashboard: Record<string, unknown>) {
	const templating = toRecord(dashboard.templating);
	const variables = Array.isArray(templating.list) ? templating.list : [];
	return variables.map((entry) => toRecord(entry));
}

function applyDashboardVariables(query: string, variables: Record<string, string>) {
	let result = query;
	for (const [key, value] of Object.entries(variables)) {
		result = result.replaceAll(`$${key}`, value).replaceAll(`\${${key}}`, value);
	}
	return result;
}

function extractPanelQueries(
	dashboard: Record<string, unknown>,
	panelId?: number,
	variables: Record<string, string> = {},
) {
	const panels = collectPanels(dashboard).filter((panel) => (panelId ? Number(panel.id) === panelId : true));
	return panels.flatMap((panel) => {
		const targets = Array.isArray(panel.targets) ? panel.targets : [];
		return targets.map((target) => {
			const item = toRecord(target);
			const datasource = toRecord(item.datasource);
			const rawQuery =
				pickFirstString(item.expr, item.query, item.rawSql, item.queryText, item.editorText, item.sql) || '';
			return {
				title: String(panel.title || ''),
				query: rawQuery,
				processedQuery: rawQuery ? applyDashboardVariables(rawQuery, variables) : rawQuery,
				datasource: {
					uid: pickFirstString(datasource.uid, panel.datasource && toRecord(panel.datasource).uid) || '',
					type: pickFirstString(datasource.type, panel.datasource && toRecord(panel.datasource).type) || '',
				},
				refId: pickFirstString(item.refId),
			};
		});
	});
}

function summarizeDashboard(dashboardUid: string, dashboard: Record<string, unknown>, meta: Record<string, unknown>) {
	const panels = collectPanels(dashboard);
	const variables = extractTemplateVariables(dashboard);
	return {
		uid: dashboardUid,
		title: String(dashboard.title || ''),
		description: pickFirstString(dashboard.description) || '',
		tags: Array.isArray(dashboard.tags) ? dashboard.tags : [],
		panelCount: panels.length,
		panels: panels.map((panel) => ({
			id: Number(panel.id || 0),
			title: String(panel.title || ''),
			type: String(panel.type || ''),
			description: pickFirstString(panel.description) || '',
			queryCount: Array.isArray(panel.targets) ? panel.targets.length : 0,
		})),
		variables: variables.map((item) => ({
			name: String(item.name || ''),
			type: String(item.type || ''),
			label: pickFirstString(item.label) || '',
		})),
		timeRange: toRecord(dashboard.time),
		refresh: pickFirstString(dashboard.refresh) || '',
		meta,
	};
}

export function registerDashboardTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_dashboard_by_uid',
		{
			description: 'Retrieve the complete dashboard model by UID',
			inputSchema: GetDashboardByUidInputSchema,
			readOnly: true,
		},
		({ uid }) => ctx.client.request({ path: `/api/dashboards/uid/${encodeURIComponent(uid)}` }),
	);

	if (ctx.writeEnabled) {
		registerJsonTool(
			ctx,
			'update_dashboard',
			{
				description:
					'Create or update a dashboard. Either provide full "dashboard" JSON or provide "uid" + patch "operations".',
				inputSchema: UpdateDashboardInputSchema,
			},
			async ({ dashboard, uid, operations, folderUid, message, overwrite, userId }) => {
				let nextDashboard = dashboard ?? undefined;

				if (!nextDashboard && uid && operations.length > 0) {
					const current = ensureDashboardPayload(
						await ctx.client.request({
							path: `/api/dashboards/uid/${encodeURIComponent(uid)}`,
						}),
					);
					nextDashboard = structuredClone(current.dashboard);
					for (const operation of operations) {
						if (operation.op === 'remove') {
							removeByPath(nextDashboard, operation.path);
						} else {
							setByPath(nextDashboard, operation.path, operation.value);
						}
					}
					folderUid = folderUid || pickFirstString(current.meta.folderUid);
				}

				if (!nextDashboard) {
					throw new Error('Provide either dashboard or uid + operations');
				}

				return ctx.client.request({
					path: '/api/dashboards/db',
					method: 'POST',
					body: {
						dashboard: nextDashboard,
						folderUid: folderUid || undefined,
						message: message || undefined,
						overwrite,
						userId: userId || undefined,
					},
				});
			},
		);
	}

	registerJsonTool(
		ctx,
		'get_dashboard_panel_queries',
		{
			description: 'Extract panel queries and datasource info from a dashboard',
			inputSchema: GetDashboardPanelQueriesInputSchema,
			readOnly: true,
		},
		async ({ uid, panelId, variables }) => {
			const { dashboard } = ensureDashboardPayload(
				await ctx.client.request({
					path: `/api/dashboards/uid/${encodeURIComponent(uid)}`,
				}),
			);
			return extractPanelQueries(dashboard, panelId ?? undefined, variables);
		},
	);

	registerJsonTool(
		ctx,
		'get_dashboard_property',
		{
			description: 'Extract a specific property from a dashboard using a JSONPath subset',
			inputSchema: GetDashboardPropertyInputSchema,
			readOnly: true,
		},
		async ({ uid, jsonPath }) => {
			const { dashboard } = ensureDashboardPayload(
				await ctx.client.request({
					path: `/api/dashboards/uid/${encodeURIComponent(uid)}`,
				}),
			);
			return getByPath(dashboard, jsonPath);
		},
	);

	registerJsonTool(
		ctx,
		'get_dashboard_summary',
		{
			description: 'Get a compact dashboard summary without the full JSON payload',
			inputSchema: GetDashboardSummaryInputSchema,
			readOnly: true,
		},
		async ({ uid }) => {
			const { dashboard, meta } = ensureDashboardPayload(
				await ctx.client.request({
					path: `/api/dashboards/uid/${encodeURIComponent(uid)}`,
				}),
			);
			return summarizeDashboard(uid, dashboard, meta);
		},
	);
}
