import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

async function getOnCallBaseUrl(ctx: GrafanaContext) {
	const settings = await ctx.client.request<{ jsonData?: { onCallApiUrl?: string } }>({
		path: '/api/plugins/grafana-irm-app/settings',
	});
	const url = settings.jsonData?.onCallApiUrl;
	if (!url) {
		throw new Error('OnCall API URL is not configured in grafana-irm-app settings');
	}
	return url.replace(/\/+$/, '');
}

async function onCallRequest(ctx: GrafanaContext, path: string, params?: Record<string, unknown>) {
	const baseUrl = await getOnCallBaseUrl(ctx);
	return ctx.client.request({
		path: `${baseUrl}${path}`,
		params,
	});
}

export function registerOnCallTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_oncall_schedules',
		{
			description: 'List Grafana OnCall schedules',
			inputSchema: z.object({
				teamId: z.string().nullish(),
				scheduleId: z.string().nullish(),
				page: z.number().int().min(1).default(1),
			}),
			readOnly: true,
		},
		({ teamId, scheduleId, page }) =>
			scheduleId
				? onCallRequest(ctx, `/api/v1/schedules/${scheduleId}`)
				: onCallRequest(ctx, '/api/v1/schedules', { team_id: teamId, page }),
	);

	registerJsonTool(
		ctx,
		'get_oncall_shift',
		{
			description: 'Get an OnCall shift by ID',
			inputSchema: z.object({
				shiftId: z.string(),
			}),
			readOnly: true,
		},
		({ shiftId }) => onCallRequest(ctx, `/api/v1/shifts/${shiftId}`),
	);

	registerJsonTool(
		ctx,
		'get_current_oncall_users',
		{
			description: 'Get users currently on call for a schedule',
			inputSchema: z.object({
				scheduleId: z.string(),
			}),
			readOnly: true,
		},
		({ scheduleId }) => onCallRequest(ctx, `/api/v1/schedules/${scheduleId}/on_call_now`),
	);

	registerJsonTool(
		ctx,
		'list_oncall_teams',
		{
			description: 'List OnCall teams',
			inputSchema: z.object({
				page: z.number().int().min(1).default(1),
			}),
			readOnly: true,
		},
		({ page }) => onCallRequest(ctx, '/api/v1/teams', { page }),
	);

	registerJsonTool(
		ctx,
		'list_oncall_users',
		{
			description: 'List OnCall users or retrieve a single OnCall user',
			inputSchema: z.object({
				userId: z.string().nullish(),
				username: z.string().nullish(),
				page: z.number().int().min(1).default(1),
			}),
			readOnly: true,
		},
		({ userId, username, page }) =>
			userId ? onCallRequest(ctx, `/api/v1/users/${userId}`) : onCallRequest(ctx, '/api/v1/users', { username, page }),
	);

	registerJsonTool(
		ctx,
		'list_alert_groups',
		{
			description: 'List Grafana IRM / OnCall alert groups',
			inputSchema: z.object({
				page: z.number().int().min(1).default(1),
				id: z.string().nullish(),
				routeId: z.string().nullish(),
				integrationId: z.string().nullish(),
				state: z.string().nullish(),
				teamId: z.string().nullish(),
				startedAt: z.string().nullish(),
				labels: z.array(z.string()).default([]),
				name: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ page, id, routeId, integrationId, state, teamId, startedAt, labels, name }) =>
			onCallRequest(ctx, '/api/v1/alert_groups', {
				page,
				id,
				route_id: routeId,
				integration_id: integrationId,
				state,
				team_id: teamId,
				started_at: startedAt,
				labels: labels.length ? labels.join(',') : undefined,
				name,
			}),
	);

	registerJsonTool(
		ctx,
		'get_alert_group',
		{
			description: 'Get a Grafana IRM / OnCall alert group by ID',
			inputSchema: z.object({
				alertGroupId: z.string(),
			}),
			readOnly: true,
		},
		({ alertGroupId }) => onCallRequest(ctx, `/api/v1/alert_groups/${alertGroupId}`),
	);
}
