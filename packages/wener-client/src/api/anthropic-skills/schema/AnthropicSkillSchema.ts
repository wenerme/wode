import { z } from 'zod';

const wireString = z.string().min(1);
const isoDateTime = z.iso.datetime({ offset: true });

export const AnthropicSkillSourceTypeSchema = z.enum(['custom', 'anthropic', 'anthropic_example', 'plugin']);

export const AnthropicSkillDisplayNameSchema = wireString
	.max(255)
	.regex(/^[^\r\n]*$/u, 'display_name must be a single line');

export const AnthropicSkillSourceSchema = z.looseObject({
	type: AnthropicSkillSourceTypeSchema,
});

export const AnthropicSkillSchema = z.looseObject({
	id: wireString,
	type: z.literal('skill'),
	created_at: isoDateTime,
	display_name: AnthropicSkillDisplayNameSchema,
	latest_version_id: wireString,
	source: AnthropicSkillSourceSchema,
	updated_at: isoDateTime,
});

export const AnthropicSkillVersionSchema = z.looseObject({
	id: wireString,
	type: z.literal('skill_version'),
	created_at: isoDateTime,
	description: wireString,
	name: wireString,
	skill_id: wireString,
});

// @ai-sdk/anthropic 4.0.x仍使用skills-2025-10-02返回结构，路由实现阶段需要保留兼容。
export const AnthropicLegacySkillSchema = z.looseObject({
	id: wireString,
	display_title: z.string().nullish(),
	name: z.string().nullish(),
	description: z.string().nullish(),
	latest_version: z.string().nullish(),
	source: wireString,
	created_at: isoDateTime,
	updated_at: isoDateTime,
});

export type AnthropicSkillSourceType = z.infer<typeof AnthropicSkillSourceTypeSchema>;
export type AnthropicSkillDisplayName = z.infer<typeof AnthropicSkillDisplayNameSchema>;
export type AnthropicSkillSource = z.infer<typeof AnthropicSkillSourceSchema>;
export type AnthropicSkill = z.infer<typeof AnthropicSkillSchema>;
export type AnthropicSkillVersion = z.infer<typeof AnthropicSkillVersionSchema>;
export type AnthropicLegacySkill = z.infer<typeof AnthropicLegacySkillSchema>;
