import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';
import * as S from './core/schema';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

function proc<TSchema extends z.ZodTypeAny>(schema: TSchema, write: boolean) {
	return oc.input(schema).output(z.unknown()).meta(write ? writeTool : readOnlyTool);
}

/** Operation names whose effect mutates Apollo state; everything else is read-only. */
export const ApolloWriteOperations = new Set<string>([
	'request',
	'createApp',
	'createAppEnv',
	'updateApp',
	'deleteApp',
	'createCluster',
	'deleteCluster',
	'createNamespace',
	'deleteNamespace',
	'createMissingNamespace',
	'upsertItem',
	'deleteItem',
	'publishRelease',
	'rollbackRelease',
	'patchNamespaceItem',
	'writeNamespaceText',
	'patchNamespaceDocument',
	'publishNamespaceRelease',
]);

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). Mirrors packages/wener-common/src/service/openobserve/OpenObserveContract.ts
 * and TencentClsContract.ts; `defineContractOperation` (packages/wener-common/src/service/runtime/contract.ts)
 * derives the local `ServiceOperation` tool metadata from this contract, replacing the hand-rolled
 * `ServiceTool` JSON Schema previously in schema.ts (now removed).
 */
export const ApolloContract = {
	readConfig: proc(S.ApolloReadConfigInputSchema, false),
	request: proc(S.ApolloRequestInputSchema, true),
	getStatus: proc(S.ApolloEmptyInputSchema, false),
	listPortalApp: proc(S.ApolloEmptyInputSchema, false),
	listPortalOrganization: proc(S.ApolloEmptyInputSchema, false),
	listPortalEnv: proc(S.ApolloEmptyInputSchema, false),
	getPortalNavTree: proc(S.ApolloAppScopeInputSchema, false),
	listPortalNamespace: proc(S.ApolloClusterScopeInputSchema, false),
	getPortalNamespace: proc(S.ApolloNamespaceScopeInputSchema, false),
	listPortalItem: proc(S.ApolloListPortalItemInputSchema, false),
	listPortalRelease: proc(S.ApolloListPortalReleaseInputSchema, false),
	getPortalConfig: proc(S.ApolloNamespaceScopeInputSchema, false),
	listRelease: proc(S.ApolloListReleaseInputSchema, false),
	getRelease: proc(S.ApolloGetReleaseInputSchema, false),
	diffRelease: proc(S.ApolloDiffReleaseInputSchema, false),
	listApp: proc(S.ApolloListAppInputSchema, false),
	getApp: proc(S.ApolloAppScopeInputSchema, false),
	listSelfApp: proc(S.ApolloListSelfAppInputSchema, false),
	createApp: proc(S.ApolloCreateAppInputSchema, true),
	createAppEnv: proc(S.ApolloCreateAppEnvInputSchema, true),
	updateApp: proc(S.ApolloUpdateAppInputSchema, true),
	deleteApp: proc(S.ApolloDeleteAppInputSchema, true),
	listMissingAppEnv: proc(S.ApolloAppScopeInputSchema, false),
	getEnvCluster: proc(S.ApolloAppScopeInputSchema, false),
	getCluster: proc(S.ApolloClusterScopeInputSchema, false),
	createCluster: proc(S.ApolloCreateClusterInputSchema, true),
	deleteCluster: proc(S.ApolloDeleteClusterInputSchema, true),
	listNamespace: proc(S.ApolloListNamespaceInputSchema, false),
	getNamespace: proc(S.ApolloGetNamespaceInputSchema, false),
	getNamespaceLock: proc(S.ApolloNamespaceScopeInputSchema, false),
	createNamespace: proc(S.ApolloCreateNamespaceInputSchema, true),
	deleteNamespace: proc(S.ApolloDeleteNamespaceInputSchema, true),
	listNamespaceUsage: proc(S.ApolloNamespaceScopeInputSchema, false),
	listMissingNamespace: proc(S.ApolloClusterScopeInputSchema, false),
	createMissingNamespace: proc(S.ApolloCreateMissingNamespaceInputSchema, true),
	listItem: proc(S.ApolloListItemInputSchema, false),
	getItem: proc(S.ApolloGetItemInputSchema, false),
	upsertItem: proc(S.ApolloUpsertItemInputSchema, true),
	deleteItem: proc(S.ApolloDeleteItemInputSchema, true),
	getLatestRelease: proc(S.ApolloNamespaceScopeInputSchema, false),
	publishRelease: proc(S.ApolloPublishReleaseInputSchema, true),
	rollbackRelease: proc(S.ApolloRollbackReleaseInputSchema, true),
	patchNamespaceItem: proc(S.ApolloPatchNamespaceItemInputSchema, true),
	writeNamespaceText: proc(S.ApolloWriteNamespaceTextInputSchema, true),
	patchNamespaceDocument: proc(S.ApolloPatchNamespaceDocumentInputSchema, true),
	diffNamespaceRelease: proc(S.ApolloDiffNamespaceReleaseInputSchema, false),
	publishNamespaceRelease: proc(S.ApolloPublishNamespaceReleaseInputSchema, true),
};

/**
 * Raw zod input schemas keyed the same as `ApolloContract`, for consumers (CLI, tests) that need
 * `.safeParse`/`.shape` directly rather than the oRPC-wrapped procedure.
 */
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
