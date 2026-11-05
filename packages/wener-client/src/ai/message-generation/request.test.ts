import { describe, expect, it } from 'vitest';

import { prepareMessageGenerationRequest, redactMessageGenerationRequest } from './request';
import type { MessageGenerationProtocol, MessageGenerationRequest } from './types';

function request(
	api: MessageGenerationProtocol,
	overrides: Partial<MessageGenerationRequest> = {},
): MessageGenerationRequest {
	return {
		target: { api, baseUrl: 'https://provider.example', apiKey: 'top-secret' },
		model: 'test-model',
		messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
		...(api === 'anthropic' ? { maxOutputTokens: 32 } : {}),
		...overrides,
	};
}

describe('message generation request preparation', () => {
	it('maps aliases to protocol endpoints and authorization headers', () => {
		const openai = prepareMessageGenerationRequest(request('openai'));
		expect(openai.url).toBe('https://provider.example/v1/chat/completions');
		expect(openai.headers.Authorization).toBe('Bearer top-secret');

		const responses = prepareMessageGenerationRequest(
			request('openai-response', {
				target: { api: 'openai-response', baseUrl: 'https://provider.example/v1', apiKey: 'key' },
			}),
		);
		expect(responses.url).toBe('https://provider.example/v1/responses');
		expect(responses.headers.Authorization).toBe('Bearer key');

		const anthropic = prepareMessageGenerationRequest(
			request('anthropic', {
				target: { api: 'anthropic', baseUrl: 'https://provider.example/v1/messages', apiKey: 'key' },
			}),
		);
		expect(anthropic.url).toBe('https://provider.example/v1/messages');
		expect(anthropic.headers).toMatchObject({ 'x-api-key': 'key', 'anthropic-version': '2023-06-01' });

		const gemini = prepareMessageGenerationRequest(request('gemini', { stream: true }));
		expect(gemini.url).toBe('https://provider.example/v1beta/models/test-model:streamGenerateContent?alt=sse');
		expect(gemini.headers['x-goog-api-key']).toBe('top-secret');
	});

	it('does not put credentials in URLs and redacts all header and URL values', () => {
		const prepared = prepareMessageGenerationRequest(
			request('openai', {
				target: {
					api: 'openai',
					baseUrl: 'https://user:pass@provider.example/v1?tenant=private',
					apiKey: 'api-secret',
					headers: { 'X-Customer-Token': 'header-secret' },
				},
			}),
		);
		expect(prepared.url).not.toContain('api-secret');
		const redacted = redactMessageGenerationRequest(prepared);
		expect(redacted.url).not.toContain('user');
		expect(redacted.url).not.toContain('pass');
		expect(redacted.url).not.toContain('private');
		expect(Object.values(redacted.headers)).toEqual(Object.keys(redacted.headers).map(() => '[REDACTED]'));
	});
});
