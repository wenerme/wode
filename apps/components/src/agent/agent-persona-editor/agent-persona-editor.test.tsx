import { PersonaSchema } from '@wener/ai/agent/persona';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AgentPersonaEditor, createLorebookEntry, createPersonaAsset } from './index';

describe('AgentPersonaEditor', () => {
	it('renders authoring, prompts, governance, lore, and manifest-only assets', () => {
		const value = PersonaSchema.parse({
			id: 'persona-example',
			name: '示例助手',
			version: '1.0.0',
			prompts: { scenario: '在 example.com 文档环境中提供帮助。' },
			lorebook: {
				entries: [{ id: 'lore-1', keys: ['example'], content: '公开示例知识', enabled: true }],
				bindings: [],
			},
			assets: [{ id: 'asset-1', type: 'avatar', uri: 'https://cdn.example.com/avatar.png' }],
		});
		const markup = renderToStaticMarkup(<AgentPersonaEditor value={value} onChange={() => undefined} />);
		expect(markup).toContain('Agent Persona 配置');
		expect(markup).toContain('性格与行为');
		expect(markup).toContain('公开示例知识');
		expect(markup).toContain('https://cdn.example.com/avatar.png');
		expect(markup).toContain('来源、治理与权利');
		expect(markup).not.toContain('crawler');
		expect(markup).not.toContain('rawBytes');
	});

	it('creates deterministic bounded-entry candidates without mutating inputs', () => {
		const entries = Object.freeze([
			{ id: 'lore-2', keys: [], content: '' },
			{ id: 'lore-3', keys: [], content: '' },
		]);
		expect(createLorebookEntry(entries).id).toBe('lore-4');
		const assets = Object.freeze([{ id: 'asset-2', type: 'other' as const, uri: 'https://example.com/asset' }]);
		const created = createPersonaAsset(assets);
		expect(created.id).toBe('asset-3');
		expect(assets).toHaveLength(1);
	});
});
