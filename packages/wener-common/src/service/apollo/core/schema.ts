import { z } from 'zod/v4';

export const ApolloJsonValueSchema = z.json();
export const ApolloEmptyInputSchema = z.object({});

export const ApolloReadConfigInputSchema = z.object({
	namespace: z.string().trim().min(1).optional(),
	format: z.enum(['auto', 'config', 'json', 'properties', 'raw', 'content', 'data']).optional(),
});

const ApolloHttpMethodSchema = z.enum(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const ApolloRequestInputSchema = z
	.object({
		role: z.literal('admin').default('admin'),
		path: z.string().trim().startsWith('/'),
		method: ApolloHttpMethodSchema.optional(),
		query: z.record(z.string(), z.json()).optional(),
		body: z.json().optional(),
		headers: z.record(z.string(), z.string()).optional().meta({ 'x-sensitive': true }),
	})
	.superRefine((input, context) => {
		for (const [name, value] of Object.entries(input.headers ?? {})) {
			try {
				new Headers([[name, value]]);
			} catch {
				context.addIssue({
					code: 'custom',
					path: ['headers', name],
					message: 'Apollo request header is invalid',
				});
			}
		}
	});

const appScope = {
	appId: z.string().trim().min(1).optional(),
};
const environmentScope = {
	...appScope,
	env: z.string().trim().min(1).optional(),
};
const clusterScope = {
	...environmentScope,
	cluster: z.string().trim().min(1).optional(),
};
const namespaceScope = {
	...clusterScope,
	namespace: z.string().trim().min(1).optional(),
};
const mutationScope = {
	...namespaceScope,
	operator: z.string().trim().min(1).optional(),
};

export const ApolloAppScopeInputSchema = z.object(appScope);
export const ApolloClusterScopeInputSchema = z.object(clusterScope);
export const ApolloNamespaceScopeInputSchema = z.object(namespaceScope);

export const ApolloListPortalItemInputSchema = z.object({
	...namespaceScope,
	orderBy: z.string().trim().min(1).optional(),
});
export const ApolloListPortalReleaseInputSchema = z.object({
	...namespaceScope,
	page: z.number().int().min(0).default(0),
	size: z.number().int().min(1).max(1_000).default(5),
});

export const ApolloListReleaseInputSchema = z.object({
	...namespaceScope,
	page: z.number().int().min(0).default(0),
	size: z.number().int().min(1).max(1_000).default(20),
	active: z.boolean().default(false),
});
export const ApolloGetReleaseInputSchema = z.object({
	env: z.string().trim().min(1).optional(),
	releaseId: z.string().trim().min(1),
});
export const ApolloDiffReleaseInputSchema = z.object({
	env: z.string().trim().min(1).optional(),
	baseReleaseId: z.string().trim().min(1),
	toCompareReleaseId: z.string().trim().min(1),
});

export const ApolloListAppInputSchema = z.object({
	appIds: z.array(z.string().trim().min(1)).optional(),
});
export const ApolloListSelfAppInputSchema = z.object({
	page: z.number().int().min(0).default(0),
	size: z.number().int().min(1).max(1_000).default(50),
});

const appBodyFields = {
	name: z.string().optional(),
	orgId: z.string().optional(),
	orgName: z.string().optional(),
	ownerName: z.string().optional(),
	ownerEmail: z.string().optional(),
	body: z.record(z.string(), z.json()).optional(),
};
export const ApolloCreateAppInputSchema = z.object({
	appId: z.string().trim().min(1),
	operator: z.string().trim().min(1).optional(),
	...appBodyFields,
	assignRoleToSelf: z.boolean().default(false),
});
export const ApolloCreateAppEnvInputSchema = z.object({
	appId: z.string().trim().min(1),
	env: z.string().trim().min(1).optional(),
	operator: z.string().trim().min(1).optional(),
	...appBodyFields,
});
export const ApolloUpdateAppInputSchema = z.object({
	appId: z.string().trim().min(1),
	operator: z.string().trim().min(1).optional(),
	...appBodyFields,
});
export const ApolloDeleteAppInputSchema = z.object({
	appId: z.string().trim().min(1),
	operator: z.string().trim().min(1).optional(),
});

export const ApolloCreateClusterInputSchema = z.object({
	...environmentScope,
	cluster: z.string().trim().min(1),
	operator: z.string().trim().min(1).optional(),
});
export const ApolloDeleteClusterInputSchema = ApolloCreateClusterInputSchema;

export const ApolloListNamespaceInputSchema = z.object({
	...clusterScope,
	fillItemDetail: z.boolean().default(true),
	extendInfo: z.boolean().optional(),
});
export const ApolloGetNamespaceInputSchema = z.object({
	...namespaceScope,
	fillItemDetail: z.boolean().default(true),
	extendInfo: z.boolean().optional(),
});
export const ApolloCreateNamespaceInputSchema = z.object({
	...appScope,
	operator: z.string().trim().min(1).optional(),
	namespace: z.string().trim().min(1),
	format: z.string().trim().min(1).default('properties'),
	isPublic: z.boolean().default(false),
	comment: z.string().optional(),
});
export const ApolloDeleteNamespaceInputSchema = z.object(mutationScope);
export const ApolloCreateMissingNamespaceInputSchema = z.object({
	...clusterScope,
	operator: z.string().trim().min(1).optional(),
});

export const ApolloListItemInputSchema = z.object({
	...namespaceScope,
	page: z.number().int().min(0).default(0),
	size: z.number().int().min(1).max(1_000).default(50),
});
export const ApolloGetItemInputSchema = z.object({
	...namespaceScope,
	key: z.string().min(1),
});
export const ApolloUpsertItemInputSchema = z.object({
	...mutationScope,
	key: z.string().min(1),
	value: z.string(),
	comment: z.string().optional(),
	createIfNotExists: z.boolean().default(true),
	release: z.boolean().default(false),
	releaseTitle: z.string().optional(),
	releaseComment: z.string().optional(),
});
export const ApolloDeleteItemInputSchema = z.object({
	...mutationScope,
	key: z.string().min(1),
});

export const ApolloGetLatestReleaseInputSchema = ApolloNamespaceScopeInputSchema;
export const ApolloPublishReleaseInputSchema = z.object({
	...mutationScope,
	title: z.string().optional(),
	comment: z.string().optional(),
});
export const ApolloRollbackReleaseInputSchema = z.object({
	env: z.string().trim().min(1).optional(),
	operator: z.string().trim().min(1).optional(),
	releaseId: z.string().trim().min(1),
});

export const ApolloPatchNamespaceItemInputSchema = z
	.object({
		...mutationScope,
		set: z.array(z.object({ key: z.string().min(1), value: z.string() })).default([]),
		delete: z.array(z.string().min(1)).default([]),
		comment: z.string().optional(),
		publish: z.boolean().default(false),
		releaseTitle: z.string().optional(),
		releaseComment: z.string().optional(),
		dryRun: z.boolean().default(false),
		createIfNotExists: z.boolean().default(true),
		allowUnpublishedDraft: z.boolean().default(false),
	})
	.refine((input) => input.set.length > 0 || input.delete.length > 0, {
		message: 'Apollo namespace patch requires at least one set or delete operation',
	});

export const ApolloConfigFormatSchema = z.enum(['json', 'xml', 'yaml', 'yml', 'properties', 'txt']);
export const ApolloWriteNamespaceTextInputSchema = z.object({
	...namespaceScope,
	configText: z.string(),
	format: ApolloConfigFormatSchema.optional(),
	publish: z.boolean().default(false),
	releaseTitle: z.string().optional(),
	releaseComment: z.string().optional(),
	dryRun: z.boolean().default(false),
	validate: z.boolean().default(true),
});

export const ApolloPatchNamespaceDocumentInputSchema = z
	.object({
		...namespaceScope,
		set: z.array(z.object({ path: z.string().trim().min(1), value: ApolloJsonValueSchema })).default([]),
		merge: z.array(z.record(z.string(), ApolloJsonValueSchema)).default([]),
		delete: z.array(z.string().trim().min(1)).default([]),
		publish: z.boolean().default(false),
		releaseTitle: z.string().optional(),
		releaseComment: z.string().optional(),
		dryRun: z.boolean().default(false),
		allowUnpublishedDraft: z.boolean().default(false),
	})
	.refine((input) => input.set.length > 0 || input.merge.length > 0 || input.delete.length > 0, {
		message: 'Apollo namespace document patch requires at least one set, merge or delete operation',
	});

export const ApolloDiffNamespaceReleaseInputSchema = z.object(namespaceScope);
export const ApolloPublishNamespaceReleaseInputSchema = z.object({
	...namespaceScope,
	title: z.string().optional(),
	comment: z.string().optional(),
	dryRun: z.boolean().default(false),
	/** Fingerprint from a previous diff/dry-run; publish only if the working copy is still exactly that. */
	ifMatch: z.string().trim().min(1).optional(),
});

export type ApolloJsonValue = z.output<typeof ApolloJsonValueSchema>;
export type ApolloRequestInput = z.input<typeof ApolloRequestInputSchema>;
export type ApolloReadConfigInput = z.input<typeof ApolloReadConfigInputSchema>;
export type ApolloAppScopeInput = z.input<typeof ApolloAppScopeInputSchema>;
export type ApolloClusterScopeInput = z.input<typeof ApolloClusterScopeInputSchema>;
export type ApolloNamespaceScopeInput = z.input<typeof ApolloNamespaceScopeInputSchema>;
export type ApolloListPortalItemInput = z.input<typeof ApolloListPortalItemInputSchema>;
export type ApolloListPortalReleaseInput = z.input<typeof ApolloListPortalReleaseInputSchema>;
export type ApolloListReleaseInput = z.input<typeof ApolloListReleaseInputSchema>;
export type ApolloGetReleaseInput = z.input<typeof ApolloGetReleaseInputSchema>;
export type ApolloDiffReleaseInput = z.input<typeof ApolloDiffReleaseInputSchema>;
export type ApolloListAppInput = z.input<typeof ApolloListAppInputSchema>;
export type ApolloListSelfAppInput = z.input<typeof ApolloListSelfAppInputSchema>;
export type ApolloCreateAppInput = z.input<typeof ApolloCreateAppInputSchema>;
export type ApolloCreateAppEnvInput = z.input<typeof ApolloCreateAppEnvInputSchema>;
export type ApolloUpdateAppInput = z.input<typeof ApolloUpdateAppInputSchema>;
export type ApolloDeleteAppInput = z.input<typeof ApolloDeleteAppInputSchema>;
export type ApolloCreateClusterInput = z.input<typeof ApolloCreateClusterInputSchema>;
export type ApolloDeleteClusterInput = z.input<typeof ApolloDeleteClusterInputSchema>;
export type ApolloListNamespaceInput = z.input<typeof ApolloListNamespaceInputSchema>;
export type ApolloGetNamespaceInput = z.input<typeof ApolloGetNamespaceInputSchema>;
export type ApolloCreateNamespaceInput = z.input<typeof ApolloCreateNamespaceInputSchema>;
export type ApolloDeleteNamespaceInput = z.input<typeof ApolloDeleteNamespaceInputSchema>;
export type ApolloCreateMissingNamespaceInput = z.input<typeof ApolloCreateMissingNamespaceInputSchema>;
export type ApolloListItemInput = z.input<typeof ApolloListItemInputSchema>;
export type ApolloGetItemInput = z.input<typeof ApolloGetItemInputSchema>;
export type ApolloUpsertItemInput = z.input<typeof ApolloUpsertItemInputSchema>;
export type ApolloDeleteItemInput = z.input<typeof ApolloDeleteItemInputSchema>;
export type ApolloPublishReleaseInput = z.input<typeof ApolloPublishReleaseInputSchema>;
export type ApolloRollbackReleaseInput = z.input<typeof ApolloRollbackReleaseInputSchema>;
export type ApolloPatchNamespaceItemInput = z.input<typeof ApolloPatchNamespaceItemInputSchema>;
export type ApolloConfigFormat = z.output<typeof ApolloConfigFormatSchema>;
export type ApolloWriteNamespaceTextInput = z.input<typeof ApolloWriteNamespaceTextInputSchema>;
export type ApolloPatchNamespaceDocumentInput = z.input<typeof ApolloPatchNamespaceDocumentInputSchema>;
export type ApolloDiffNamespaceReleaseInput = z.input<typeof ApolloDiffNamespaceReleaseInputSchema>;
export type ApolloPublishNamespaceReleaseInput = z.input<typeof ApolloPublishNamespaceReleaseInputSchema>;
