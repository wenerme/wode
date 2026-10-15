import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
	AnthropicSkillDisplayNameSchema,
	AnthropicSkillsCreateRequestSchema,
	AnthropicSkillsCreateResponseSchema,
	AnthropicSkillVersionsCreateBodySchema,
	AnthropicSkillVersionsCreateRequestSchema,
	AnthropicSkillVersionsCreateResponseSchema,
} from './index';

describe('Anthropic Skills schemas', () => {
	test('解析当前Skills创建请求和响应', () => {
		const skillFile = new File(['---\nname: demo\ndescription: Demo skill\n---\n'], 'demo/SKILL.md', {
			type: 'text/markdown',
		});
		const request = AnthropicSkillsCreateRequestSchema.parse({
			files: [skillFile],
			display_name: 'Demo Skill',
		});
		expect(request).toMatchObject({ files: [skillFile], display_name: 'Demo Skill' });
		expect(
			AnthropicSkillsCreateResponseSchema.parse({
				id: 'skill_1',
				type: 'skill',
				created_at: '2026-09-04T00:00:00Z',
				display_name: 'Demo Skill',
				latest_version_id: 'skver_1',
				source: { type: 'custom' },
				updated_at: '2026-09-04T00:00:00Z',
			}),
		).toMatchObject({ id: 'skill_1', source: { type: 'custom' } });
	});

	test('兼容Vercel AI SDK 4.0.x的旧字段', () => {
		const skillFile = new File(['skill'], 'demo/SKILL.md');
		expect(AnthropicSkillVersionsCreateBodySchema.parse({ files: [skillFile] })).toMatchObject({ files: [skillFile] });
		expect(
			AnthropicSkillsCreateRequestSchema.parse({ 'files[]': skillFile, display_title: 'Demo Skill' }),
		).toMatchObject({ 'files[]': skillFile, display_title: 'Demo Skill' });
		expect(
			AnthropicSkillsCreateResponseSchema.parse({
				id: 'skill_1',
				display_title: 'Demo Skill',
				name: 'demo',
				description: 'Demo skill',
				latest_version: '1',
				source: 'custom',
				created_at: '2026-09-04T00:00:00Z',
				updated_at: '2026-09-04T00:00:00Z',
			}),
		).toMatchObject({ id: 'skill_1', latest_version: '1', source: 'custom' });
	});

	test('拒绝缺少文件或多行display_name的请求', () => {
		expect(AnthropicSkillsCreateRequestSchema.safeParse({ display_name: 'Demo' }).success).toBe(false);
		expect(
			AnthropicSkillsCreateRequestSchema.safeParse({ files: new File(['skill'], 'SKILL.md'), display_name: 'a\nb' })
				.success,
		).toBe(false);
		expect(z.toJSONSchema(AnthropicSkillDisplayNameSchema)).toHaveProperty('pattern');
	});

	test('解析Skill Version响应', () => {
		const skillFile = new File(['skill'], 'demo/SKILL.md');
		expect(
			AnthropicSkillVersionsCreateRequestSchema.parse({ skill_id: 'skill_1', 'files[]': [skillFile] })['files[]'],
		).toEqual([skillFile]);
		expect(AnthropicSkillVersionsCreateRequestSchema.safeParse({ 'files[]': [skillFile] }).success).toBe(false);
		expect(
			AnthropicSkillVersionsCreateResponseSchema.parse({
				id: 'skver_1',
				type: 'skill_version',
				created_at: '2026-09-04T00:00:00Z',
				description: 'Demo skill',
				name: 'demo',
				skill_id: 'skill_1',
			}),
		).toMatchObject({ id: 'skver_1', skill_id: 'skill_1' });
	});
});
