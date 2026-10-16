import { z } from 'zod';
import { OpenAIMultipartFileSchema } from '../../openai-files/schema/OpenAIFileSchema';
import { OpenAISkillSchema, OpenAISkillVersionSchema } from './OpenAISkillSchema';

const skillFile = z.union([OpenAIMultipartFileSchema, z.string().meta({ type: 'string', format: 'binary' })]);

export const OpenAISkillMultipartFilesSchema = z.union([skillFile, z.array(skillFile)]);

const openAISkillFilesFields = {
	// SDK参数名是files；multipart编码后通常使用files[]，两种入口都保留。
	files: OpenAISkillMultipartFilesSchema.optional().describe('Skill file or file list'),
	'files[]': OpenAISkillMultipartFilesSchema.optional().describe('Skill file form field'),
};

export const OpenAISkillsCreateRequestSchema = z.looseObject(openAISkillFilesFields);

export const OpenAISkillsCreateResponseSchema = OpenAISkillSchema;

export const OpenAISkillVersionsCreateBodySchema = z.looseObject({
	...openAISkillFilesFields,
	default: z.union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')]).optional(),
});

export const OpenAISkillVersionsCreateRequestSchema = OpenAISkillVersionsCreateBodySchema.extend({
	skill_id: z.string().min(1),
});

export const OpenAISkillVersionsCreateResponseSchema = OpenAISkillVersionSchema;

export type OpenAISkillsCreateRequest = z.infer<typeof OpenAISkillsCreateRequestSchema>;
export type OpenAISkillsCreateResponse = z.infer<typeof OpenAISkillsCreateResponseSchema>;
export type OpenAISkillVersionsCreateRequest = z.infer<typeof OpenAISkillVersionsCreateRequestSchema>;
export type OpenAISkillVersionsCreateResponse = z.infer<typeof OpenAISkillVersionsCreateResponseSchema>;
