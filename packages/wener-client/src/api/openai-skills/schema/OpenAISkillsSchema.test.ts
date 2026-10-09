import { describe, expect, test } from 'vitest';
import {
	OpenAISkillsCreateRequestSchema,
	OpenAISkillsCreateResponseSchema,
	OpenAISkillVersionsCreateBodySchema,
	OpenAISkillVersionsCreateRequestSchema,
	OpenAISkillVersionsCreateResponseSchema,
} from './index';

describe('OpenAI Skills schemas', () => {
	test('兼容SDK的files[]和原始files表单字段', () => {
		const skillFile = new File(['---\nname: demo\n---\n'], 'demo/SKILL.md', { type: 'text/markdown' });
		expect(OpenAISkillsCreateRequestSchema.parse({ 'files[]': skillFile })['files[]']).toBe(skillFile);
		expect(OpenAISkillsCreateRequestSchema.parse({ files: [skillFile] }).files).toEqual([skillFile]);
		expect(OpenAISkillsCreateRequestSchema.safeParse({}).success).toBe(true);
	});

	test('解析Skill和Skill Version响应', () => {
		expect(
			OpenAISkillsCreateResponseSchema.parse({
				id: 'skill_1',
				object: 'skill',
				created_at: 1,
				default_version: '1',
				description: 'Demo skill',
				latest_version: '1',
				name: 'demo',
			}),
		).toMatchObject({ id: 'skill_1', latest_version: '1' });

		expect(
			OpenAISkillVersionsCreateResponseSchema.parse({
				id: 'skver_1',
				object: 'skill.version',
				created_at: 2,
				description: 'Demo skill v2',
				name: 'demo',
				skill_id: 'skill_1',
				version: '2',
			}),
		).toMatchObject({ id: 'skver_1', skill_id: 'skill_1', version: '2' });
	});

	test('解析multipart中的版本默认标记', () => {
		expect(OpenAISkillVersionsCreateBodySchema.parse({ default: 'true' })).toMatchObject({ default: true });
		expect(OpenAISkillVersionsCreateRequestSchema.parse({ skill_id: 'skill_1', default: 'true' }).default).toBe(true);
		expect(OpenAISkillVersionsCreateRequestSchema.parse({ skill_id: 'skill_1', default: false }).default).toBe(false);
		expect(OpenAISkillVersionsCreateRequestSchema.safeParse({ skill_id: 'skill_1', default: 'yes' }).success).toBe(
			false,
		);
		expect(OpenAISkillVersionsCreateRequestSchema.safeParse({ default: true }).success).toBe(false);
	});
});
