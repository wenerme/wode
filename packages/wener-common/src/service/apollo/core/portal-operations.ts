import type { IApolloService } from './interface';
import {
	apolloPortalNamespacePath,
	encodeApolloPathPart,
	isRecord,
	parseApolloReleaseConfigurations,
	resolveApolloScope,
} from './operations';
import {
	ApolloAppScopeInputSchema,
	ApolloClusterScopeInputSchema,
	ApolloDiffReleaseInputSchema,
	ApolloGetReleaseInputSchema,
	ApolloListPortalItemInputSchema,
	ApolloListPortalReleaseInputSchema,
	ApolloListReleaseInputSchema,
	ApolloNamespaceScopeInputSchema,
} from './schema';
import type { ApolloServiceOperationContext } from './service-context';

export type ApolloPortalOperations = Pick<
	IApolloService,
	| 'getStatus'
	| 'listPortalApp'
	| 'listPortalOrganization'
	| 'listPortalEnv'
	| 'getPortalNavTree'
	| 'listPortalNamespace'
	| 'getPortalNamespace'
	| 'listPortalItem'
	| 'listPortalRelease'
	| 'getPortalConfig'
	| 'listRelease'
	| 'getRelease'
	| 'diffRelease'
>;

export function createApolloPortalOperations(context: ApolloServiceOperationContext): ApolloPortalOperations {
	return {
		getStatus: () => context.portal('/health'),
		listPortalApp: () => context.portal('/apps'),
		listPortalOrganization: () => context.portal('/organizations'),
		listPortalEnv: () => context.portal('/envs'),
		getPortalNavTree: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloAppScopeInputSchema, input));
			return context.portal(`/apps/${encodeApolloPathPart(scope.appId)}/navtree`);
		},
		listPortalNamespace: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloClusterScopeInputSchema, input));
			return context.portal(`${apolloPortalNamespacePath(scope).replace(/\/namespaces\/[^/]+$/u, '')}/namespaces`);
		},
		getPortalNamespace: (input = {}) => {
			const scope = resolveApolloScope(context.config, context.parse(ApolloNamespaceScopeInputSchema, input));
			return context.portal(apolloPortalNamespacePath(scope));
		},
		listPortalItem: (input = {}) => {
			const parsed = context.parse(ApolloListPortalItemInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.portal(`${apolloPortalNamespacePath(scope)}/items`, { orderBy: parsed.orderBy });
		},
		listPortalRelease: (input = {}) => {
			const parsed = context.parse(ApolloListPortalReleaseInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.portal(`${apolloPortalNamespacePath(scope)}/releases/active`, {
				page: parsed.page,
				size: parsed.size,
			});
		},
		getPortalConfig: async (input = {}) => {
			const parsed = context.parse(ApolloListPortalReleaseInputSchema, { ...input, page: 0, size: 1 });
			const scope = resolveApolloScope(context.config, parsed);
			const value = await context.portal(`${apolloPortalNamespacePath(scope)}/releases/active`, {
				page: parsed.page,
				size: parsed.size,
			});
			const latest = Array.isArray(value) ? value.find(isRecord) : undefined;
			return parseApolloReleaseConfigurations(latest);
		},
		listRelease: (input = {}) => {
			const parsed = context.parse(ApolloListReleaseInputSchema, input);
			const scope = resolveApolloScope(context.config, parsed);
			return context.portal(`${apolloPortalNamespacePath(scope)}/releases/${parsed.active ? 'active' : 'all'}`, {
				page: parsed.page,
				size: parsed.size,
			});
		},
		getRelease: (input) => {
			const parsed = context.parse(ApolloGetReleaseInputSchema, input);
			return context.portal(
				`/envs/${encodeApolloPathPart(parsed.env ?? context.config.env)}/releases/${encodeApolloPathPart(parsed.releaseId)}`,
			);
		},
		diffRelease: (input) => {
			const parsed = context.parse(ApolloDiffReleaseInputSchema, input);
			return context.portal(`/envs/${encodeApolloPathPart(parsed.env ?? context.config.env)}/releases/compare`, {
				baseReleaseId: parsed.baseReleaseId,
				toCompareReleaseId: parsed.toCompareReleaseId,
			});
		},
	};
}
