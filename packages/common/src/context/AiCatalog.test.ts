import { describe, expect, it, vi } from 'vitest';
import { listAiModels, resolveAiModel } from './AiCatalog';
import type { AiModel, AiProtocol } from './AiConfig';
import { parseCliConfig, resolveCliContext } from './CliConfig';

function context(model: AiModel = { endpointKey: 'claude' }) {
	return resolveCliContext(
		parseCliConfig({
			providers: {
				example: {
					api: 'openai',
					baseUrl: 'https://example.com/openai/v1',
					endpoints: {
						claude: {
							api: 'anthropic',
							baseUrl: 'https://example.com/anthropic',
							apiKeyEnv: 'ANTHROPIC_TEST_KEY',
						},
						'openai-responses': { baseUrl: 'https://example.com/responses/v1' },
					},
					models: { fast: model },
				},
			},
			defaultModel: 'fast',
		}),
	);
}

describe('AI endpoint protocol resolution', () => {
	it.each(['embedding', 'image-generation'] as const)('rejects %s before resolving secrets', (capability) => {
		const getEnv = vi.fn();
		const selected = context({ endpointKey: 'claude', capabilities: [capability] });
		expect(() => resolveAiModel(selected, { getEnv })).toThrow('does not support message-generation');
		expect(() => resolveAiModel(selected, { getEnv, requireKey: false })).toThrow(
			'does not support message-generation',
		);
		expect(getEnv).not.toHaveBeenCalled();
		expect(listAiModels(selected)[0].capabilities).toEqual([capability]);
	});
	it('inherits provider capabilities, honors model overrides and keeps legacy message inference', () => {
		const selected = context({});
		expect(listAiModels(selected)[0].capabilities).toEqual(['message-generation']);
		selected.providers!.example.capabilities = ['embedding'];
		expect(() => resolveAiModel(selected)).toThrow('does not support message-generation');
		selected.providers!.example.models!.fast.capabilities = ['message-generation', 'image-generation'];
		expect(resolveAiModel(selected).capabilities).toEqual(['message-generation', 'image-generation']);
		selected.providers!.example.models!.fast.capabilities = [];
		expect(() => resolveAiModel(selected)).toThrow('does not support message-generation');
	});
	it('lets an explicit endpoint protocol override the provider protocol and still requires its key', () => {
		const selected = context();
		expect(() => resolveAiModel(selected)).toThrow('environment variable');
		expect(resolveAiModel(selected, { requireKey: false }).target).toMatchObject({
			api: 'anthropic',
			baseUrl: 'https://example.com/anthropic',
			apiKey: undefined,
		});
		expect(resolveAiModel(selected, { env: { ANTHROPIC_TEST_KEY: 'test-only' } }).target).toMatchObject({
			api: 'anthropic',
			apiKey: 'test-only',
		});
	});
	it.each([
		{ modelApi: undefined, protocol: 'openai-responses', expected: 'openai-response' },
		{ modelApi: 'gemini', protocol: undefined, expected: 'gemini' },
		{ modelApi: 'gemini', protocol: 'openai', expected: 'openai' },
	] satisfies { modelApi?: AiProtocol; protocol?: AiProtocol; expected: string }[])(
		'honors model=$modelApi and command=$protocol over endpoint protocol',
		({ modelApi, protocol, expected }) => {
			expect(
				resolveAiModel(context({ endpointKey: 'claude', api: modelApi }), { protocol, requireKey: false }).target,
			).toMatchObject({ api: expected, baseUrl: 'https://example.com/anthropic' });
		},
	);
	it('retains automatic endpoint selection from the candidate protocol and endpoint key aliases', () => {
		expect(resolveAiModel(context({ api: 'anthropic' }), { requireKey: false }).target).toMatchObject({
			api: 'anthropic',
			baseUrl: 'https://example.com/anthropic',
		});
		expect(resolveAiModel(context({}), { protocol: 'openai-response', requireKey: false }).target).toMatchObject({
			api: 'openai-response',
			baseUrl: 'https://example.com/responses/v1',
		});
		expect(resolveAiModel(context({}), { requireKey: false }).target).toMatchObject({
			api: 'openai',
			baseUrl: 'https://example.com/openai/v1',
		});
	});
	it('rejects missing explicit endpoints instead of silently using the provider URL', () => {
		expect(() => resolveAiModel(context({ endpointKey: 'missing' }), { requireKey: false })).toThrow(
			'Model endpoint is not configured',
		);
	});
});
