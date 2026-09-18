import { describe, expect, it } from 'vite-plus/test';
import {
	createLiveOpenAIConnectionStoryDefinition,
	readLiveOpenAIConnectionStoryEnvironment,
} from './agent-ai-sdk-story-environment';

describe('Live OpenAI-compatible Story environment', () => {
	it('uses a complete valid environment connection', () => {
		expect(
			readLiveOpenAIConnectionStoryEnvironment({
				apiKey: 'placeholder-key',
				baseUrl: ' https://example.com/v1/ ',
				model: ' example-model ',
			}),
		).toEqual({
			apiKey: 'placeholder-key',
			baseUrl: 'https://example.com/v1',
			headers: {},
			model: 'example-model',
		});
	});

	it('rejects partial or invalid environment connections instead of mixing sources', () => {
		expect(
			readLiveOpenAIConnectionStoryEnvironment({
				baseUrl: 'https://example.com/v1',
				model: 'example-model',
			}),
		).toBeUndefined();
		expect(
			readLiveOpenAIConnectionStoryEnvironment({
				apiKey: 'placeholder-key',
				baseUrl: 'not-a-url',
				model: 'example-model',
			}),
		).toBeUndefined();
	});

	it('serializes only a complete valid development connection', () => {
		const complete = {
			apiKey: 'placeholder-key',
			baseUrl: 'https://example.com/v1',
			model: 'example-model',
		};
		expect(JSON.parse(createLiveOpenAIConnectionStoryDefinition(complete, true))).toEqual({
			...complete,
			headers: {},
		});
		for (const input of [
			{ apiKey: complete.apiKey },
			{ ...complete, apiKey: undefined },
			{ ...complete, baseUrl: undefined },
			{ ...complete, model: undefined },
			{ ...complete, baseUrl: 'not-a-url' },
		]) {
			expect(createLiveOpenAIConnectionStoryDefinition(input, true)).toBe('undefined');
		}
		expect(createLiveOpenAIConnectionStoryDefinition(complete, false)).toBe('undefined');
	});
});
