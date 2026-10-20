import { describe, expect, it } from 'vitest';
import { listAiModels, resolveAiModel } from './AiCatalog';
import { describeAiProvider } from './AiConfig';
import { describeCliContext, parseCliConfig, resolveCliContext } from './CliConfig';
import { parsePromptTemplate, renderPromptTemplate } from './PromptTemplate';

function config() {
	return parseCliConfig({
		providers: {
			example: {
				api: 'openai',
				baseUrl: 'https://example.com/v1?hidden=unit-test-key',
				apiKey: 'unit-test-key',
				headers: { authorization: 'unit-test-key' },
				models: { fast: { name: 'upstream-fast' }, other: { name: 'upstream-other', disabled: true } },
			},
		},
		defaultModel: 'example/fast',
		prompts: { summarize: { template: 'Summarize {{text}}' } },
		contexts: {
			local: {},
			other: {
				providers: {
					alternate: {
						api: 'anthropic',
						baseUrl: 'https://example.com',
						models: { chat: { maxOutputTokens: 32 } },
						defaultModel: 'chat',
					},
				},
			},
		},
	});
}
describe('AI catalogs and prompt presets', () => {
	it('inherits catalogs, resolves aliases/defaults and never exposes credentials in context output', () => {
		const selected = resolveCliContext(config());
		const model = resolveAiModel(selected);
		expect(model.model).toBe('upstream-fast');
		expect(model.name).toBe('example/fast');
		expect(listAiModels(selected)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'example/fast', default: true }),
				expect.objectContaining({ name: 'example/other', enabled: false }),
			]),
		);
		expect(JSON.stringify(describeCliContext(selected))).not.toContain('unit-test-key');
		expect(
			JSON.stringify(describeAiProvider(selected.providers?.example as NonNullable<typeof selected.providers>[string])),
		).not.toContain('unit-test-key');
	});
	it('honors explicit provider over another default and rejects disabled/ambiguous models', () => {
		const selected = resolveCliContext(config(), 'other');
		expect(resolveAiModel(selected, { provider: 'alternate' }).model).toBe('chat');
		expect(() => resolveAiModel(selected, { model: 'example/other' })).toThrow('disabled');
		expect(() => resolveAiModel({ ...selected, defaultModel: undefined })).toThrow('Select one');
	});
	it('resolves endpoint-specific protocol and lazy credentials', () => {
		const selected = resolveCliContext(
			parseCliConfig({
				providers: {
					p: {
						api: 'openai',
						apiKeyEnv: 'EXAMPLE_KEY',
						endpoints: { responses: { api: 'openai-response', baseUrl: 'https://example.com/v1' } },
						models: { a: { api: 'openai-response', endpointKey: 'responses' } },
					},
				},
				defaultModel: 'p/a',
			}),
		);
		expect(() => resolveAiModel(selected)).toThrow('environment variable');
		expect(
			resolveAiModel(selected, { getEnv: (name) => (name === 'EXAMPLE_KEY' ? 'unit-test-key' : undefined) }).target,
		).toMatchObject({ api: 'openai-response', apiKey: 'unit-test-key' });
		expect(resolveAiModel(selected, { requireKey: false }).target.apiKey).toBeUndefined();
	});
	it('parses .prompt.md frontmatter and only performs data interpolation', () => {
		const preset = parsePromptTemplate(
			'---\nmodel: example/fast\nconfig:\n  temperature: 0\n  max_tokens: 32\ndefaults:\n  tone: concise\n---\n{{tone}}: {{text}}',
		);
		expect(preset).toMatchObject({ model: 'example/fast', temperature: 0, maxOutputTokens: 32 });
		expect(renderPromptTemplate(preset, { text: 'hello' }).template).toBe('concise: hello');
		expect(() => renderPromptTemplate(preset)).toThrow('Missing prompt variable');
	});
});
