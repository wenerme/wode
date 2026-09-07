import { z } from 'zod';

const ExtensionsSchema = z.record(z.string(), z.json());

export const SkillToolRequirementSchema = z.strictObject({
	name: z.string().min(1),
	description: z.string().optional(),
	required: z.boolean().optional(),
	capabilities: z.array(z.string().min(1)).optional(),
	configuration: ExtensionsSchema.optional(),
	extensions: ExtensionsSchema.optional(),
});
export type SkillToolRequirement = z.infer<typeof SkillToolRequirementSchema>;

export const SkillContextRequirementSchema = z.strictObject({
	kind: z.enum(['agents', 'file', 'directory', 'environment', 'capability', 'service', 'other']),
	value: z.string().min(1),
	description: z.string().optional(),
	required: z.boolean().optional(),
	extensions: ExtensionsSchema.optional(),
});
export type SkillContextRequirement = z.infer<typeof SkillContextRequirementSchema>;

export const SkillResourceSchema = z
	.strictObject({
		id: z.string().min(1),
		type: z.enum(['reference', 'template', 'example', 'script', 'asset', 'schema', 'other']),
		path: z.string().min(1).optional(),
		uri: z.string().min(1).optional(),
		description: z.string().optional(),
		mediaType: z.string().optional(),
		checksum: z.string().optional(),
		required: z.boolean().optional(),
		metadata: ExtensionsSchema.optional(),
		extensions: ExtensionsSchema.optional(),
	})
	.refine((resource) => Boolean(resource.path || resource.uri), {
		message: 'skill resource requires path or uri',
		path: ['path'],
	});
export type SkillResource = z.infer<typeof SkillResourceSchema>;

export const SkillSchema = z
	.strictObject({
		id: z.string().min(1).optional(),
		name: z.string().min(1),
		description: z.string().min(1),
		instructions: z.string().min(1),
		version: z.string().min(1),
		tags: z.array(z.string().min(1)).optional(),
		toolRequirements: z.array(SkillToolRequirementSchema).default([]),
		contextRequirements: z.array(SkillContextRequirementSchema).default([]),
		resources: z.array(SkillResourceSchema).default([]),
		metadata: ExtensionsSchema.optional(),
		extensions: ExtensionsSchema.optional(),
	})
	.superRefine((value, context) => {
		const resourceIds = new Set<string>();
		for (const [index, resource] of value.resources.entries()) {
			if (resourceIds.has(resource.id)) {
				context.addIssue({
					code: 'custom',
					message: `duplicate skill resource identity ${resource.id}`,
					path: ['resources', index, 'id'],
				});
			} else {
				resourceIds.add(resource.id);
			}
		}
	});
export type Skill = z.infer<typeof SkillSchema>;
