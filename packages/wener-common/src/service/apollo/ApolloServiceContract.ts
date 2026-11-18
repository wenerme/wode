import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';
import * as S from './core/schema';

const apollo = oc.$meta<ServiceToolMeta>({});
const dynamic = z.unknown().describe('Apollo Portal/Admin response: shape depends on endpoint and server version.');
const scope = { appId: z.string(), env: z.string(), cluster: z.string(), namespace: z.string() };
const ok = { ok: z.literal(true) };
const jsonValue = z.json();

/** Raw/properties/content are text; config/json/data may be any JSON value (including null). */
export const ApolloReadConfigOutputSchema = jsonValue;
export const ApolloConfigChangeSchema = z.object({
	key: z.string(), op: z.enum(['create', 'update', 'delete']),
	oldValue: z.unknown().optional(), newValue: z.unknown().optional(), modifiedBy: z.string().optional(),
});
export const ApolloNamespacePermissionSchema = z.object({
	user: z.string().optional(), modify: z.boolean().optional(), release: z.boolean().optional(), assignRole: z.boolean().optional(),
});
export const ApolloReleaseRefSchema = z.object({
	id: z.unknown().optional(), name: z.unknown().optional(), releasedBy: z.unknown().optional(), releasedTime: z.unknown().optional(),
});
const changes = z.array(ApolloConfigChangeSchema);
const preview = {
	baseRelease: ApolloReleaseRefSchema.nullable().optional(), pending: changes.optional(), publishChanges: changes.optional(),
	unchanged: z.array(z.string()).optional(), warnings: z.array(z.string()).optional(),
};
export const ApolloPatchNamespaceItemOutputSchema = z.object({
	...ok, ...scope, dryRun: z.boolean(), changes, ...preview,
	applied: z.number().int().nonnegative().optional(), published: z.boolean().optional(), release: z.unknown().optional(),
});
export const ApolloPatchNamespaceDocumentOutputSchema = z.object({
	...ok, ...scope, dryRun: z.boolean(), namespaceId: z.number(), format: S.ApolloConfigFormatSchema,
	applied: z.number().int().nonnegative(), changes, reformatted: z.boolean(), ...preview,
	permission: ApolloNamespacePermissionSchema.optional(), published: z.boolean().optional(), release: z.unknown().optional(),
});
export const ApolloWriteNamespaceTextOutputSchema = z.union([
	z.object({
		...ok, ...scope, dryRun: z.literal(true), namespaceId: z.number(), format: S.ApolloConfigFormatSchema,
		bytes: z.number().int().nonnegative(), publish: z.boolean(),
		validation: z.object({ validated: z.boolean(), validator: z.string().optional(), skipped: z.boolean().optional() }),
		permission: ApolloNamespacePermissionSchema,
	}),
	z.object({ ...ok, ...scope, namespaceId: z.number(), format: S.ApolloConfigFormatSchema, published: z.boolean(), release: z.unknown().optional() }),
]);
const pending = {
	...ok, ...scope, format: S.ApolloConfigFormatSchema, baseRelease: ApolloReleaseRefSchema.nullable(),
	fingerprint: z.string(), count: z.number().int().nonnegative(), modifiedBy: z.array(z.string()), changes,
	message: z.string().optional(),
};
export const ApolloDiffNamespaceReleaseOutputSchema = z.object(pending);
export const ApolloPublishNamespaceReleaseOutputSchema = z.object({
	...pending, dryRun: z.boolean(), published: z.boolean(), release: z.unknown().optional(),
	permission: ApolloNamespacePermissionSchema.optional(), warnings: z.array(z.string()).optional(),
});
export const ApolloDeleteClusterOutputSchema = z.object({ ...ok, appId: scope.appId, env: scope.env, cluster: scope.cluster });
export const ApolloDeleteNamespaceOutputSchema = z.object({ ...ok, ...scope });
export const ApolloRollbackReleaseOutputSchema = z.object({ ...ok, env: z.string(), releaseId: z.string() });

// Default values are parsed once per omitted input, including nested pagination defaults.
function optional<T extends z.ZodType>(schema: T) {
	return schema.default(() => schema.parse({}) as z.core.util.NoUndefined<z.output<T>>);
}
function proc<I extends z.ZodType, O extends z.ZodType>(input: I, output: O, write = false, dryRun = false) {
	// Discovery must describe inputs before defaults/stripping, not the parser's output.
	// Keep this local while the shared exporter still uses output mode and nullable optionals.
	const jsonSchema = z.toJSONSchema(input, { io: 'input' });
	// Also retain native output JSON Schema: optional unknown fields otherwise become
	// typeless `nullable: true`, which AJV cannot compile.
	const outputJsonSchema = z.toJSONSchema(output);
	return apollo.input(input.meta({ ...jsonSchema, required: jsonSchema.required ?? [] }))
		.output(output.meta(outputJsonSchema)).meta({
		readOnlyHint: !write, destructiveHint: write, ...(dryRun ? { supportsDryRun: true } : {}),
	});
}

/** Canonical operation schemas. Dynamic upstream DTOs deliberately remain unknown. */
export const ApolloServiceContract = {
	readConfig: proc(optional(S.ApolloReadConfigInputSchema), ApolloReadConfigOutputSchema),
	request: proc(S.ApolloRequestInputSchema, dynamic, true),
	getStatus: proc(S.ApolloEmptyInputSchema, dynamic),
	listPortalApp: proc(S.ApolloEmptyInputSchema, dynamic),
	listPortalOrganization: proc(S.ApolloEmptyInputSchema, dynamic),
	listPortalEnv: proc(S.ApolloEmptyInputSchema, dynamic),
	getPortalNavTree: proc(optional(S.ApolloAppScopeInputSchema), dynamic),
	listPortalNamespace: proc(optional(S.ApolloClusterScopeInputSchema), dynamic),
	getPortalNamespace: proc(optional(S.ApolloNamespaceScopeInputSchema), dynamic),
	listPortalItem: proc(optional(S.ApolloListPortalItemInputSchema), dynamic),
	listPortalRelease: proc(optional(S.ApolloListPortalReleaseInputSchema), dynamic),
	getPortalConfig: proc(optional(S.ApolloNamespaceScopeInputSchema), dynamic),
	listRelease: proc(optional(S.ApolloListReleaseInputSchema), dynamic),
	getRelease: proc(S.ApolloGetReleaseInputSchema, dynamic),
	diffRelease: proc(S.ApolloDiffReleaseInputSchema, dynamic),
	listApp: proc(optional(S.ApolloListAppInputSchema), dynamic),
	getApp: proc(optional(S.ApolloAppScopeInputSchema), dynamic),
	listSelfApp: proc(optional(S.ApolloListSelfAppInputSchema), dynamic),
	createApp: proc(S.ApolloCreateAppInputSchema, dynamic, true),
	createAppEnv: proc(S.ApolloCreateAppEnvInputSchema, dynamic, true),
	updateApp: proc(S.ApolloUpdateAppInputSchema, dynamic, true),
	deleteApp: proc(S.ApolloDeleteAppInputSchema, dynamic, true),
	listMissingAppEnv: proc(optional(S.ApolloAppScopeInputSchema), dynamic),
	getEnvCluster: proc(optional(S.ApolloAppScopeInputSchema), dynamic),
	getCluster: proc(optional(S.ApolloClusterScopeInputSchema), dynamic),
	createCluster: proc(S.ApolloCreateClusterInputSchema, dynamic, true),
	deleteCluster: proc(S.ApolloDeleteClusterInputSchema, ApolloDeleteClusterOutputSchema, true),
	listNamespace: proc(optional(S.ApolloListNamespaceInputSchema), dynamic),
	getNamespace: proc(optional(S.ApolloGetNamespaceInputSchema), dynamic),
	getNamespaceLock: proc(optional(S.ApolloNamespaceScopeInputSchema), dynamic),
	createNamespace: proc(S.ApolloCreateNamespaceInputSchema, dynamic, true),
	deleteNamespace: proc(optional(S.ApolloDeleteNamespaceInputSchema), ApolloDeleteNamespaceOutputSchema, true),
	listNamespaceUsage: proc(optional(S.ApolloNamespaceScopeInputSchema), dynamic),
	listMissingNamespace: proc(optional(S.ApolloClusterScopeInputSchema), dynamic),
	createMissingNamespace: proc(optional(S.ApolloCreateMissingNamespaceInputSchema), dynamic, true),
	listItem: proc(optional(S.ApolloListItemInputSchema), dynamic),
	getItem: proc(S.ApolloGetItemInputSchema, dynamic),
	upsertItem: proc(S.ApolloUpsertItemInputSchema, dynamic, true),
	deleteItem: proc(S.ApolloDeleteItemInputSchema, dynamic, true),
	getLatestRelease: proc(optional(S.ApolloNamespaceScopeInputSchema), dynamic),
	publishRelease: proc(optional(S.ApolloPublishReleaseInputSchema), dynamic, true),
	rollbackRelease: proc(S.ApolloRollbackReleaseInputSchema, ApolloRollbackReleaseOutputSchema, true),
	patchNamespaceItem: proc(S.ApolloPatchNamespaceItemInputSchema.meta({ anyOf: [
		{ required: ['set'], properties: { set: { minItems: 1 } } },
		{ required: ['delete'], properties: { delete: { minItems: 1 } } },
	] }), ApolloPatchNamespaceItemOutputSchema, true, true),
	writeNamespaceText: proc(S.ApolloWriteNamespaceTextInputSchema, ApolloWriteNamespaceTextOutputSchema, true, true),
	patchNamespaceDocument: proc(S.ApolloPatchNamespaceDocumentInputSchema.meta({ anyOf: ['set', 'merge', 'delete'].map((key) => ({
		required: [key], properties: { [key]: { minItems: 1 } },
	})) }), ApolloPatchNamespaceDocumentOutputSchema, true, true),
	diffNamespaceRelease: proc(optional(S.ApolloDiffNamespaceReleaseInputSchema), ApolloDiffNamespaceReleaseOutputSchema),
	publishNamespaceRelease: proc(optional(S.ApolloPublishNamespaceReleaseInputSchema), ApolloPublishNamespaceReleaseOutputSchema, true, true),
};

/** No new per-call timeout settings: endpoint requestTimeoutMs remains the timeout source. */
export type ApolloServiceClientContext = Record<string, never>;
export type IApolloServiceContract = ContractRouterClient<typeof ApolloServiceContract, ApolloServiceClientContext>;
export type ApolloServiceCallOptions = NonNullable<Parameters<IApolloServiceContract['request']>[1]>;
export type ApolloServiceInputs = InferContractRouterInputs<typeof ApolloServiceContract>;
export type ApolloServiceOutputs = InferContractRouterOutputs<typeof ApolloServiceContract>;

/** Compatibility projections; neither maintains a second operation/schema list. */
export const ApolloToolInputs = Object.fromEntries(Object.entries(ApolloServiceContract).map(([name, procedure]) => [name, procedure['~orpc'].inputSchema])) as {
	[K in keyof typeof ApolloServiceContract]: NonNullable<(typeof ApolloServiceContract)[K]['~orpc']['inputSchema']>;
};
export const ApolloWriteOperations: ReadonlySet<string> = new Set(Object.entries(ApolloServiceContract)
	.filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([name]) => name));
