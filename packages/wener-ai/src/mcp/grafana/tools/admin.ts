import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const ResourceDescriptions = Object.freeze({
	dashboards: {
		resourceType: 'dashboards',
		identifier: 'dashboard UID',
		permissions: ['dashboards:read', 'dashboards:write', 'dashboards.permissions:read'],
	},
	datasources: {
		resourceType: 'datasources',
		identifier: 'datasource UID',
		permissions: ['datasources:read', 'datasources:write', 'datasources.permissions:read'],
	},
	folders: {
		resourceType: 'folders',
		identifier: 'folder UID',
		permissions: ['folders:read', 'folders:write', 'folders.permissions:read'],
	},
	teams: {
		resourceType: 'teams',
		identifier: 'team ID',
		permissions: ['teams:read', 'teams.permissions:read'],
	},
	users: {
		resourceType: 'users',
		identifier: 'user ID',
		permissions: ['users:read'],
	},
	serviceaccounts: {
		resourceType: 'serviceaccounts',
		identifier: 'service account ID',
		permissions: ['serviceaccounts:read'],
	},
} as const);

export function registerAdminTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_teams',
		{
			description: 'Search Grafana teams',
			inputSchema: z.object({
				query: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ query }) =>
			ctx.client.request({
				path: '/api/teams/search',
				params: { query },
			}),
	);

	registerJsonTool(
		ctx,
		'list_users_by_org',
		{
			description: 'List users in the current Grafana organization',
			inputSchema: z.object({}),
			readOnly: true,
		},
		() => ctx.client.request({ path: '/api/org/users' }),
	);

	registerJsonTool(
		ctx,
		'list_all_roles',
		{
			description: 'List Grafana roles',
			inputSchema: z.object({
				delegatableOnly: z.boolean().default(false),
			}),
			readOnly: true,
		},
		({ delegatableOnly }) =>
			ctx.client.request({
				path: '/api/access-control/roles',
				params: delegatableOnly ? { delegatable: true } : {},
			}),
	);

	registerJsonTool(
		ctx,
		'get_role_details',
		{
			description: 'Get Grafana role details',
			inputSchema: z.object({
				roleUID: z.string(),
			}),
			readOnly: true,
		},
		({ roleUID }) => ctx.client.request({ path: `/api/access-control/roles/${encodeURIComponent(roleUID)}` }),
	);

	registerJsonTool(
		ctx,
		'get_role_assignments',
		{
			description: 'Get assignments for a Grafana role',
			inputSchema: z.object({
				roleUID: z.string(),
			}),
			readOnly: true,
		},
		({ roleUID }) => ctx.client.request({ path: `/api/access-control/roles/${encodeURIComponent(roleUID)}/assignments` }),
	);

	registerJsonTool(
		ctx,
		'list_user_roles',
		{
			description: 'List roles assigned to one or more users',
			inputSchema: z.object({
				userIds: z.array(z.number().int()).min(1),
			}),
			readOnly: true,
		},
		({ userIds }) =>
			ctx.client.request({
				path: '/api/access-control/users/roles/search',
				method: 'POST',
				body: { userIds },
			}),
	);

	registerJsonTool(
		ctx,
		'list_team_roles',
		{
			description: 'List roles assigned to one or more teams',
			inputSchema: z.object({
				teamIds: z.array(z.number().int()).min(1),
			}),
			readOnly: true,
		},
		({ teamIds }) =>
			ctx.client.request({
				path: '/api/access-control/teams/roles/search',
				method: 'POST',
				body: { teamIds },
			}),
	);

	registerJsonTool(
		ctx,
		'get_resource_permissions',
		{
			description: 'Get permissions for a Grafana resource',
			inputSchema: z.object({
				resource: z.string(),
				resourceId: z.string(),
			}),
			readOnly: true,
		},
		({ resource, resourceId }) =>
			ctx.client.request({
				path: `/api/access-control/${encodeURIComponent(resource)}/${encodeURIComponent(resourceId)}/permissions`,
			}),
	);

	registerJsonTool(
		ctx,
		'get_resource_description',
		{
			description: 'Describe supported Grafana resource types and permission patterns',
			inputSchema: z.object({
				resourceType: z.enum(['dashboards', 'datasources', 'folders', 'teams', 'users', 'serviceaccounts']),
			}),
			readOnly: true,
		},
		({ resourceType }) => ResourceDescriptions[resourceType],
	);
}
