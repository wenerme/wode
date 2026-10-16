import { z } from 'zod';

export const OpenAISkillSchema = z.looseObject({
	id: z.string().describe('Skill identifier'),
	object: z.literal('skill'),
	created_at: z.number().multipleOf(1),
	default_version: z.string(),
	description: z.string(),
	latest_version: z.string(),
	name: z.string().describe('Skill name'),
});

export const OpenAISkillVersionSchema = z.looseObject({
	id: z.string(),
	object: z.literal('skill.version'),
	created_at: z.number().multipleOf(1).nonnegative(),
	description: z.string(),
	name: z.string(),
	skill_id: z.string(),
	version: z.string(),
});

export type OpenAISkill = z.infer<typeof OpenAISkillSchema>;
export type OpenAISkillVersion = z.infer<typeof OpenAISkillVersionSchema>;
