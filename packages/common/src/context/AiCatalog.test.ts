import { describe, expect, it } from 'vitest';
import { resolveAiModel } from './AiCatalog';
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
