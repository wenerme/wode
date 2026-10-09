import { z } from 'zod';

const wireString = z.string().min(1);

export const OpenAISkillSchema = z.looseObject({
	id: wireString,
	object: z.literal('skill'),
	created_at: z.number().int().nonnegative(),
	default_version: wireString,
	description: wireString,
	latest_version: wireString,
	name: wireString,
});

export const OpenAISkillVersionSchema = z.looseObject({
	id: wireString,
	object: z.literal('skill.version'),
	created_at: z.number().int().nonnegative(),
	description: wireString,
	name: wireString,
	skill_id: wireString,
	version: wireString,
});

export type OpenAISkill = z.infer<typeof OpenAISkillSchema>;
export type OpenAISkillVersion = z.infer<typeof OpenAISkillVersionSchema>;
