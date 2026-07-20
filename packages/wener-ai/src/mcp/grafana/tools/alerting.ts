import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

export function registerAlertingTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'alerting_manage_rules',
		{
			description: 'Manage Grafana alert rules using operation-based arguments',
			inputSchema: z.object({
				operation: z.enum(['list', 'get', 'create', 'update', 'delete']),
				uid: z.string().nullish(),
				limit: z.number().int().min(1).max(500).default(200),
				payload: z.record(z.string(), z.unknown()).nullish(),
			}),
			readOnly: !ctx.writeEnabled,
		},
		async ({ operation, uid, limit, payload }) => {
			if (operation === 'list') {
				return ctx.client.request({
					path: '/api/v1/provisioning/alert-rules',
					params: { limit },
				});
			}
			if (operation === 'get') {
				if (!uid) throw new Error('uid is required for get');
				return ctx.client.request({
					path: `/api/v1/provisioning/alert-rules/${encodeURIComponent(uid)}`,
				});
			}
			if (!ctx.writeEnabled) {
				throw new Error('Alert rule write operations are disabled');
			}
			if (operation === 'create') {
				if (!payload) throw new Error('payload is required for create');
				return ctx.client.request({
					path: '/api/v1/provisioning/alert-rules',
					method: 'POST',
					body: payload,
				});
			}
			if (operation === 'update') {
				if (!uid || !payload) throw new Error('uid and payload are required for update');
				return ctx.client.request({
					path: `/api/v1/provisioning/alert-rules/${encodeURIComponent(uid)}`,
					method: 'PUT',
					body: payload,
				});
			}
			if (!uid) throw new Error('uid is required for delete');
			return ctx.client.request({
				path: `/api/v1/provisioning/alert-rules/${encodeURIComponent(uid)}`,
				method: 'DELETE',
				expectedStatuses: [200, 202, 204],
				responseType: 'text',
			});
		},
	);

	registerJsonTool(
		ctx,
		'alerting_manage_routing',
		{
			description: 'Read Grafana alert routing config, contact points, and mute timings',
			inputSchema: z.object({
				operation: z.enum([
					'get_notification_policies',
					'get_contact_points',
					'get_contact_point',
					'get_time_intervals',
					'get_time_interval',
				]),
				name: z.string().nullish(),
				contactPointTitle: z.string().nullish(),
				timeIntervalName: z.string().nullish(),
				limit: z.number().int().min(1).max(500).default(100),
			}),
			readOnly: true,
		},
		async ({ operation, name, contactPointTitle, timeIntervalName, limit }) => {
			switch (operation) {
				case 'get_notification_policies':
					return ctx.client.request({ path: '/api/v1/provisioning/policies' });
				case 'get_contact_points':
					return ctx.client.request({
						path: '/api/v1/provisioning/contact-points',
						params: {
							name,
							limit,
						},
					});
				case 'get_contact_point':
					if (!contactPointTitle) throw new Error('contactPointTitle is required');
					return ctx.client.request({
						path: '/api/v1/provisioning/contact-points',
						params: { name: contactPointTitle },
					});
				case 'get_time_intervals':
					return ctx.client.request({ path: '/api/v1/provisioning/mute-timings' });
				case 'get_time_interval':
					if (!timeIntervalName) throw new Error('timeIntervalName is required');
					return ctx.client.request({
						path: `/api/v1/provisioning/mute-timings/${encodeURIComponent(timeIntervalName)}`,
					});
			}
		},
	);
}
