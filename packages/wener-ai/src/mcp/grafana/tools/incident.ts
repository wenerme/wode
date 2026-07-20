import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const IncidentBasePath = '/api/plugins/grafana-incident-app/resources/api/v1';

export function registerIncidentTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_incidents',
		{
			description: 'List Grafana Incident incidents',
			inputSchema: z.object({
				limit: z.number().int().min(1).max(200).default(10),
				drill: z.boolean().default(false),
				status: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ limit, drill, status }) =>
			ctx.client.request({
				path: `${IncidentBasePath}/incidents`,
				params: {
					limit,
					drill,
					status,
				},
			}),
	);

	registerJsonTool(
		ctx,
		'get_incident',
		{
			description: 'Get a Grafana Incident incident by ID',
			inputSchema: z.object({
				id: z.string(),
			}),
			readOnly: true,
		},
		({ id }) => ctx.client.request({ path: `${IncidentBasePath}/incidents/${encodeURIComponent(id)}` }),
	);

	if (!ctx.writeEnabled) return;

	registerJsonTool(
		ctx,
		'create_incident',
		{
			description: 'Create a new Grafana Incident incident',
			inputSchema: z.object({
				title: z.string(),
				severity: z.string().nullish(),
				roomPrefix: z.string().nullish(),
				isDrill: z.boolean().default(false),
				status: z.string().nullish(),
				attachCaption: z.string().nullish(),
				attachUrl: z.string().nullish(),
				labels: z.array(z.record(z.string(), z.unknown())).default([]),
			}),
		},
		(input) =>
			ctx.client.request({
				path: `${IncidentBasePath}/incidents`,
				method: 'POST',
				body: input,
			}),
	);

	registerJsonTool(
		ctx,
		'add_activity_to_incident',
		{
			description: 'Add a note or activity to an incident',
			inputSchema: z.object({
				incidentId: z.string(),
				body: z.string(),
				eventTime: z.string().nullish(),
			}),
		},
		({ incidentId, body, eventTime }) =>
			ctx.client.request({
				path: `${IncidentBasePath}/incidents/${encodeURIComponent(incidentId)}/activities`,
				method: 'POST',
				body: {
					activityKind: 'userNote',
					body,
					eventTime: eventTime || undefined,
				},
			}),
	);
}
