import type { IApolloService } from './interface';
import { deleteApolloItem, publishApolloRelease, upsertApolloItem } from './item-mutations';
import {
	apolloClusterPath,
	apolloItemPath,
	apolloNamespacePath,
	compactApolloRecord,
	createApolloAppBody,
	encodeApolloPathPart,
	isRecord,
	requireApolloOperator,
	resolveApolloScope,
	updateApolloAppBody,
} from './operations';
import {
	ApolloAppScopeInputSchema,
	ApolloClusterScopeInputSchema,
	ApolloCreateAppEnvInputSchema,
	ApolloCreateAppInputSchema,
	ApolloCreateClusterInputSchema,
	ApolloCreateMissingNamespaceInputSchema,
	ApolloCreateNamespaceInputSchema,
	ApolloDeleteAppInputSchema,
	ApolloDeleteClusterInputSchema,
	ApolloDeleteNamespaceInputSchema,
	ApolloGetItemInputSchema,
	ApolloGetNamespaceInputSchema,
	ApolloListAppInputSchema,
	ApolloListItemInputSchema,
	ApolloListNamespaceInputSchema,
	ApolloListSelfAppInputSchema,
	ApolloNamespaceScopeInputSchema,
	ApolloRollbackReleaseInputSchema,
	ApolloUpdateAppInputSchema,
} from './schema';
import type { ApolloServiceOperationContext } from './service-context';

const AppWriteOutcome = {
	state: 'app-write-outcome-unknown',
	message: 'Apollo app write outcome is unknown',
} as const;
const ClusterWriteOutcome = {
	state: 'cluster-write-outcome-unknown',
	message: 'Apollo cluster write outcome is unknown',
} as const;
const NamespaceWriteOutcome = {
	state: 'namespace-write-outcome-unknown',
	message: 'Apollo namespace write outcome is unknown',
} as const;
const RollbackOutcome = {
	state: 'rollback-outcome-unknown',
	message: 'Apollo rollback outcome is unknown',
} as const;

export type ApolloAdminOperations = Pick<
	IApolloService,
	| 'listApp'
	| 'getApp'
	| 'listSelfApp'
	| 'createApp'
	| 'createAppEnv'
	| 'updateApp'
	| 'deleteApp'
	| 'listMissingAppEnv'
	| 'getEnvCluster'
	| 'getCluster'
	| 'createCluster'
	| 'deleteCluster'
	| 'listNamespace'
	| 'getNamespace'
	| 'getNamespaceLock'
	| 'createNamespace'
	| 'deleteNamespace'
	| 'listNamespaceUsage'
	| 'listMissingNamespace'
	| 'createMissingNamespace'
	| 'listItem'
	| 'getItem'
	| 'upsertItem'
	| 'deleteItem'
	| 'getLatestRelease'
	| 'publishRelease'
	| 'rollbackRelease'
>;

export function createApolloAdminOperations(context: ApolloServiceOperationContext): ApolloAdminOperations {
	return {
		listApp: (input = {}) => {
			const parsed = context.parse(ApolloListAppInputSchema, input);
			return context.admin('/openapi/v1/apps', { query: { appIds: parsed.appIds?.join(',') } });
		},
		getApp: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloAppScopeInputSchema, input));
			return context.admin(`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}`);
		},
		listSelfApp: (input = {}) => {
			const parsed = context.parse(ApolloListSelfAppInputSchema, input);
			return context.admin('/openapi/v1/apps/by-self', { query: { page: parsed.page, size: parsed.size } });
		},
		createApp: async (input) => {
			const parsed = context.parse(ApolloCreateAppInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.adminMutation(
				'/openapi/v1/apps',
				{
					method: 'POST',
					body: createApolloAppBody(scope, parsed),
				},
				AppWriteOutcome,
			);
			return value ?? { ok: true, appId: parsed.appId };
		},
		createAppEnv: async (input) => {
			const parsed = context.parse(ApolloCreateAppEnvInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const wrapped = createApolloAppBody(scope, { ...parsed, assignRoleToSelf: false });
			const app = isRecord(wrapped.app) ? wrapped.app : wrapped;
			const value = await context.adminMutation(
				`/openapi/v1/apps/envs/${encodeApolloPathPart(scope.env)}`,
				{
					method: 'POST',
					query: { operator: requireApolloOperator(scope) },
					body: { ...app, appId: typeof app.appId === 'string' ? app.appId : parsed.appId },
				},
				AppWriteOutcome,
			);
			return value ?? { ok: true, appId: parsed.appId, env: scope.env };
		},
		updateApp: async (input) => {
			const parsed = context.parse(ApolloUpdateAppInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.adminMutation(
				`/openapi/v1/apps/${encodeApolloPathPart(parsed.appId)}`,
				{
					method: 'PUT',
					query: { operator: requireApolloOperator(scope) },
					body: updateApolloAppBody(scope, parsed),
				},
				AppWriteOutcome,
			);
			return value ?? { ok: true, appId: parsed.appId };
		},
		deleteApp: async (input) => {
			const parsed = context.parse(ApolloDeleteAppInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.adminMutation(
				`/openapi/v1/apps/${encodeApolloPathPart(parsed.appId)}`,
				{
					method: 'DELETE',
					query: { operator: requireApolloOperator(scope) },
				},
				AppWriteOutcome,
			);
			return value ?? { ok: true, appId: parsed.appId };
		},
		listMissingAppEnv: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloAppScopeInputSchema, input));
			return context.admin(`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}/miss_envs`);
		},
		getEnvCluster: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloAppScopeInputSchema, input));
			return context.admin(`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}/envclusters`);
		},
		getCluster: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloClusterScopeInputSchema, input));
			return context.admin(apolloClusterPath(scope));
		},
		createCluster: (input) => {
			const parsed = context.parse(ApolloCreateClusterInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.adminMutation(
				apolloClusterPath(scope).replace(/\/[^/]+$/u, ''),
				{
					method: 'POST',
					body: { appId: scope.appId, name: scope.cluster, dataChangeCreatedBy: requireApolloOperator(scope) },
				},
				ClusterWriteOutcome,
			);
		},
		deleteCluster: async (input) => {
			const parsed = context.parse(ApolloDeleteClusterInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			await context.adminMutation(
				apolloClusterPath(scope),
				{
					method: 'DELETE',
					query: { operator: requireApolloOperator(scope) },
				},
				ClusterWriteOutcome,
			);
			return { ok: true, appId: scope.appId, env: scope.env, cluster: scope.cluster };
		},
		listNamespace: (input = {}) => {
			const parsed = context.parse(ApolloListNamespaceInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.admin(`${apolloClusterPath(scope)}/namespaces`, {
				query: { fillItemDetail: parsed.fillItemDetail, extendInfo: parsed.extendInfo },
			});
		},
		getNamespace: (input = {}) => {
			const parsed = context.parse(ApolloGetNamespaceInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.admin(apolloNamespacePath(scope), {
				query: { fillItemDetail: parsed.fillItemDetail, extendInfo: parsed.extendInfo },
			});
		},
		getNamespaceLock: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloNamespaceScopeInputSchema, input));
			return context.admin(`${apolloNamespacePath(scope)}/lock`);
		},
		createNamespace: (input) => {
			const parsed = context.parse(ApolloCreateNamespaceInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.adminMutation(
				`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}/appnamespaces`,
				{
					method: 'POST',
					body: compactApolloRecord({
						appId: scope.appId,
						name: parsed.namespace,
						format: parsed.format,
						isPublic: parsed.isPublic,
						comment: parsed.comment,
						dataChangeCreatedBy: requireApolloOperator(scope),
					}),
				},
				NamespaceWriteOutcome,
			);
		},
		deleteNamespace: async (input = {}) => {
			const parsed = context.parse(ApolloDeleteNamespaceInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			await context.adminMutation(
				apolloNamespacePath(scope),
				{
					method: 'DELETE',
					query: { operator: requireApolloOperator(scope) },
				},
				NamespaceWriteOutcome,
			);
			return { ok: true, appId: scope.appId, env: scope.env, cluster: scope.cluster, namespace: scope.namespace };
		},
		listNamespaceUsage: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloNamespaceScopeInputSchema, input));
			return context.admin(`${apolloNamespacePath(scope)}/usage`);
		},
		listMissingNamespace: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloClusterScopeInputSchema, input));
			return context.admin(
				`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}/envs/${encodeApolloPathPart(scope.env)}/clusters/${encodeApolloPathPart(scope.cluster)}/missing-namespaces`,
			);
		},
		createMissingNamespace: async (input = {}) => {
			const parsed = context.parse(ApolloCreateMissingNamespaceInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.adminMutation(
				`/openapi/v1/apps/${encodeApolloPathPart(scope.appId)}/envs/${encodeApolloPathPart(scope.env)}/clusters/${encodeApolloPathPart(scope.cluster)}/missing-namespaces`,
				{ method: 'POST', query: { operator: requireApolloOperator(scope) } },
				NamespaceWriteOutcome,
			);
			return value ?? { ok: true, appId: scope.appId, env: scope.env, cluster: scope.cluster };
		},
		listItem: async (input = {}) => {
			const parsed = context.parse(ApolloListItemInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.admin(`${apolloNamespacePath(scope)}/items`, {
				query: { page: parsed.page, size: parsed.size },
			});
			return isRecord(value) && Array.isArray(value.content) ? value.content : value;
		},
		getItem: (input) => {
			const parsed = context.parse(ApolloGetItemInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.admin(apolloItemPath(scope, parsed.key));
		},
		upsertItem: (input) => upsertApolloItem(context, input),
		deleteItem: (input) => deleteApolloItem(context, input),
		getLatestRelease: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloNamespaceScopeInputSchema, input));
			return context.admin(`${apolloNamespacePath(scope)}/releases/latest`);
		},
		publishRelease: (input = {}) => publishApolloRelease(context, input),
		rollbackRelease: async (input) => {
			const parsed = context.parse(ApolloRollbackReleaseInputSchema, input);
			const env = parsed.env ?? context.config.env;
			await context.adminMutation(
				`/openapi/v1/envs/${encodeApolloPathPart(env)}/releases/${encodeApolloPathPart(parsed.releaseId)}/rollback`,
				{
					method: 'PUT',
					query: { operator: requireApolloOperator({ operator: parsed.operator ?? context.config.operator }) },
				},
				RollbackOutcome,
			);
			return { ok: true, env, releaseId: parsed.releaseId };
		},
	};
}
