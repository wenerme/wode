import { z } from 'zod';
import {
	AnthropicLegacySkillSchema,
	AnthropicSkillDisplayNameSchema,
	AnthropicSkillSchema,
	AnthropicSkillVersionSchema,
} from './AnthropicSkillSchema';

export const AnthropicSkillMultipartFileSchema = z.file().meta({ type: 'string', format: 'binary' });

export const AnthropicSkillMultipartFilesSchema = z.union([
	AnthropicSkillMultipartFileSchema,
	z.array(AnthropicSkillMultipartFileSchema).min(1),
]);

const displayNameSchema = AnthropicSkillDisplayNameSchema.nullable().optional();

const anthropicSkillCreateFields = {
	display_name: displayNameSchema,
	// 兼容@ai-sdk/anthropic 4.0.x使用的旧字段名。
	display_title: displayNameSchema,
};

export const AnthropicSkillsCreateRequestSchema = z.union([
	z.looseObject({
		...anthropicSkillCreateFields,
		files: AnthropicSkillMultipartFilesSchema,
	}),
	z.looseObject({
		...anthropicSkillCreateFields,
		'files[]': AnthropicSkillMultipartFilesSchema,
	}),
]);

export const AnthropicSkillsCreateResponseSchema = z.union([AnthropicSkillSchema, AnthropicLegacySkillSchema]);

export const AnthropicSkillVersionsCreateBodySchema = z.union([
	z.looseObject({ files: AnthropicSkillMultipartFilesSchema }),
	z.looseObject({ 'files[]': AnthropicSkillMultipartFilesSchema }),
]);

export const AnthropicSkillVersionsCreateRequestSchema = z.union([
	...AnthropicSkillVersionsCreateBodySchema.options.map((schema) => schema.extend({ skill_id: z.string().min(1) })),
]);

export const AnthropicSkillVersionsCreateResponseSchema = AnthropicSkillVersionSchema;

export type AnthropicSkillsCreateRequest = z.infer<typeof AnthropicSkillsCreateRequestSchema>;
export type AnthropicSkillsCreateResponse = z.infer<typeof AnthropicSkillsCreateResponseSchema>;
export type AnthropicSkillVersionsCreateRequest = z.infer<typeof AnthropicSkillVersionsCreateRequestSchema>;
export type AnthropicSkillVersionsCreateResponse = z.infer<typeof AnthropicSkillVersionsCreateResponseSchema>;
