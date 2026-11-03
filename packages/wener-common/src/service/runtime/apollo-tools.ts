import { z } from 'zod';
import * as S from '../apollo/core/schema';
import type { ServiceSchema } from './types';

/** Shared operation inputs for local calls, discovery and CLI adapters. */
export const ApolloToolInputs = {
	readConfig: S.ApolloReadConfigInputSchema,
	request: S.ApolloRequestInputSchema,
	getStatus: S.ApolloEmptyInputSchema,
	listPortalApp: S.ApolloEmptyInputSchema,
	listPortalOrganization: S.ApolloEmptyInputSchema,
	listPortalEnv: S.ApolloEmptyInputSchema,
	getPortalNavTree: S.ApolloAppScopeInputSchema,
	listPortalNamespace: S.ApolloClusterScopeInputSchema,
	getPortalNamespace: S.ApolloNamespaceScopeInputSchema,
	listPortalItem: S.ApolloListPortalItemInputSchema,
	listPortalRelease: S.ApolloListPortalReleaseInputSchema,
	getPortalConfig: S.ApolloNamespaceScopeInputSchema,
	listRelease: S.ApolloListReleaseInputSchema,
	getRelease: S.ApolloGetReleaseInputSchema,
	diffRelease: S.ApolloDiffReleaseInputSchema,
	listApp: S.ApolloListAppInputSchema,
	getApp: S.ApolloAppScopeInputSchema,
	listSelfApp: S.ApolloListSelfAppInputSchema,
	createApp: S.ApolloCreateAppInputSchema,
	createAppEnv: S.ApolloCreateAppEnvInputSchema,
	updateApp: S.ApolloUpdateAppInputSchema,
	deleteApp: S.ApolloDeleteAppInputSchema,
	listMissingAppEnv: S.ApolloAppScopeInputSchema,
	getEnvCluster: S.ApolloAppScopeInputSchema,
	getCluster: S.ApolloClusterScopeInputSchema,
	createCluster: S.ApolloCreateClusterInputSchema,
	deleteCluster: S.ApolloDeleteClusterInputSchema,
	listNamespace: S.ApolloListNamespaceInputSchema,
	getNamespace: S.ApolloGetNamespaceInputSchema,
	getNamespaceLock: S.ApolloNamespaceScopeInputSchema,
	createNamespace: S.ApolloCreateNamespaceInputSchema,
	deleteNamespace: S.ApolloDeleteNamespaceInputSchema,
	listNamespaceUsage: S.ApolloNamespaceScopeInputSchema,
	listMissingNamespace: S.ApolloClusterScopeInputSchema,
	createMissingNamespace: S.ApolloCreateMissingNamespaceInputSchema,
	listItem: S.ApolloListItemInputSchema,
	getItem: S.ApolloGetItemInputSchema,
	upsertItem: S.ApolloUpsertItemInputSchema,
	deleteItem: S.ApolloDeleteItemInputSchema,
	getLatestRelease: S.ApolloNamespaceScopeInputSchema,
	publishRelease: S.ApolloPublishReleaseInputSchema,
	rollbackRelease: S.ApolloRollbackReleaseInputSchema,
	patchNamespaceItem: S.ApolloPatchNamespaceItemInputSchema,
	writeNamespaceText: S.ApolloWriteNamespaceTextInputSchema,
	patchNamespaceDocument: S.ApolloPatchNamespaceDocumentInputSchema,
	diffNamespaceRelease: S.ApolloDiffNamespaceReleaseInputSchema,
	publishNamespaceRelease: S.ApolloPublishNamespaceReleaseInputSchema,
};

export const ApolloWriteOperations = new Set<string>([
	'request', 'createApp', 'createAppEnv', 'updateApp', 'deleteApp', 'createCluster', 'deleteCluster',
	'createNamespace', 'deleteNamespace', 'createMissingNamespace', 'upsertItem', 'deleteItem',
	'publishRelease', 'rollbackRelease', 'patchNamespaceItem', 'writeNamespaceText', 'patchNamespaceDocument', 'publishNamespaceRelease',
]);

export const ApolloTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.entries(ApolloToolInputs).map(([name, schema]) => [name, {
		description: `Apollo ${name.replace(/([a-z])([A-Z])/gu, '$1 $2').toLowerCase()}`,
		inputSchema: z.toJSONSchema(schema, { io: 'input' }),
		annotations: { readOnlyHint: !ApolloWriteOperations.has(name), destructiveHint: ApolloWriteOperations.has(name) },
	}]),
);
