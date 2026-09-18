import { SkillSchema } from '@wener/ai/agent/skill';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AgentSkillEditor, formatSkillMarkdown } from './index';

describe('AgentSkillEditor', () => {
	it('renders canonical requirements, resource manifests, and SKILL.md preview', () => {
		const value = SkillSchema.parse({
			name: 'example-skill',
			description: '处理公开示例配置',
			version: '1.2.0',
			instructions: '读取输入并返回结构化摘要。',
			tags: ['example'],
			toolRequirements: [{ name: 'search', required: true, capabilities: ['read'] }],
			contextRequirements: [{ kind: 'file', value: 'references/example.md', required: true }],
			resources: [{ id: 'reference-1', type: 'reference', path: 'references/example.md' }],
		});
		const markup = renderToStaticMarkup(<AgentSkillEditor value={value} onChange={() => undefined} />);
		expect(markup).toContain('Agent Skill 配置');
		expect(markup).toContain('search');
		expect(markup).toContain('references/example.md');
		expect(markup).toContain('SKILL.md 预览');
		expect(markup).toContain('name: &quot;example-skill&quot;');
	});

	it('formats a natural markdown preview without parsing the filesystem', () => {
		const value = SkillSchema.parse({
			name: 'preview-skill',
			description: 'Preview only',
			version: '1.0.0',
			instructions: 'Do the focused task.',
			tags: ['public'],
		});
		const markdown = formatSkillMarkdown(value);
		expect(markdown).toContain('---\nname: "preview-skill"');
		expect(markdown).toContain('tags: ["public"]');
		expect(markdown).toContain('Do the focused task.');
	});
});
