import { z } from 'zod';
import { PersonaLorebookSchema } from './lorebook.schema';

const ExtensionsSchema = z.record(z.string(), z.json());

export const PersonaAuthorSchema = z.strictObject({
	id: z.string().min(1).optional(),
	name: z.string().min(1),
	url: z.string().min(1).optional(),
	contact: z.string().optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaAuthor = z.infer<typeof PersonaAuthorSchema>;

export const PersonaAuthoringSchema = z.strictObject({
	background: z.string().optional(),
	personality: z.string().optional(),
	values: z.array(z.string()).optional(),
	goals: z.array(z.string()).optional(),
	flaws: z.array(z.string()).optional(),
	behaviorPolicy: z.string().optional(),
	speechStyle: z.string().optional(),
	exampleDialogue: z.array(z.string()).optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaAuthoring = z.infer<typeof PersonaAuthoringSchema>;

export const PersonaPromptsSchema = z.strictObject({
	system: z.string().optional(),
	persona: z.string().optional(),
	scenario: z.string().optional(),
	postHistoryInstructions: z.string().optional(),
	examples: z.array(z.string()).optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaPrompts = z.infer<typeof PersonaPromptsSchema>;

export const PersonaAssetRightsSchema = z.strictObject({
	license: z.string().optional(),
	licenseUrl: z.string().min(1).optional(),
	rightsHolder: z.string().optional(),
	attribution: z.string().optional(),
	scope: z.string().optional(),
	redistributable: z.boolean().optional(),
	commercialUse: z.boolean().optional(),
	derivativeWorks: z.boolean().optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaAssetRights = z.infer<typeof PersonaAssetRightsSchema>;

export const PersonaAssetSchema = z.strictObject({
	id: z.string().min(1),
	type: z.enum(['avatar', 'icon', 'background', 'emotion', 'voice', 'model', 'document', 'other']),
	uri: z.string().min(1),
	name: z.string().optional(),
	description: z.string().optional(),
	mediaType: z.string().optional(),
	checksum: z.string().optional(),
	size: z.number().int().nonnegative().optional(),
	tags: z.array(z.string().min(1)).optional(),
	rights: PersonaAssetRightsSchema.optional(),
	metadata: ExtensionsSchema.optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaAsset = z.infer<typeof PersonaAssetSchema>;

export const PersonaGovernanceSchema = z.strictObject({
	visibility: z.enum(['private', 'unlisted', 'public']).optional(),
	contentRating: z.enum(['unknown', 'general', 'teen', 'mature', 'restricted']).optional(),
	reviewStatus: z.enum(['draft', 'pending', 'approved', 'rejected', 'withdrawn']).optional(),
	provenance: z.string().optional(),
	sourceUrl: z.string().min(1).optional(),
	coAuthors: z.array(PersonaAuthorSchema).optional(),
	notices: z.array(z.string()).optional(),
	extensions: ExtensionsSchema.optional(),
});
export type PersonaGovernance = z.infer<typeof PersonaGovernanceSchema>;

export const PersonaRightsSchema = PersonaAssetRightsSchema.extend({
	source: z.string().optional(),
});
export type PersonaRights = z.infer<typeof PersonaRightsSchema>;

export const PersonaSchema = z
	.strictObject({
		id: z.string().min(1),
		name: z.string().min(1),
		version: z.string().min(1),
		title: z.string().optional(),
		nickname: z.string().optional(),
		description: z.string().optional(),
		author: PersonaAuthorSchema.optional(),
		creatorNotes: z.string().optional(),
		tags: z.array(z.string().min(1)).optional(),
		language: z.string().optional(),
		authoring: PersonaAuthoringSchema.optional(),
		prompts: PersonaPromptsSchema.optional(),
		greetings: z.array(z.string()).default([]),
		groupGreetings: z.array(z.string()).optional(),
		lorebook: PersonaLorebookSchema.optional(),
		assets: z.array(PersonaAssetSchema).default([]),
		governance: PersonaGovernanceSchema.optional(),
		rights: PersonaRightsSchema.optional(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
		metadata: ExtensionsSchema.optional(),
		extensions: ExtensionsSchema.optional(),
	})
	.superRefine((value, context) => {
		const assetIds = new Set<string>();
		for (const [index, asset] of value.assets.entries()) {
			if (assetIds.has(asset.id)) {
				context.addIssue({
					code: 'custom',
					message: `duplicate persona asset identity ${asset.id}`,
					path: ['assets', index, 'id'],
				});
			} else {
				assetIds.add(asset.id);
			}
		}
	});
export type Persona = z.infer<typeof PersonaSchema>;
