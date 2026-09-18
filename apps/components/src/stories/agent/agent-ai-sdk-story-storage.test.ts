import { describe, expect, it } from 'vite-plus/test';
import {
	LIVE_OPENAI_CONNECTION_STORAGE_KEY,
	readLiveOpenAIConnectionStoryState,
	resolveLiveOpenAIConnectionStoryState,
	writeLiveOpenAIConnectionStoryState,
} from './agent-ai-sdk-story-storage';

function memoryStorage(initial?: string) {
	const values = new Map<string, string>();
	if (initial !== undefined) values.set(LIVE_OPENAI_CONNECTION_STORAGE_KEY, initial);
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		value: () => values.get(LIVE_OPENAI_CONNECTION_STORAGE_KEY),
	};
}

describe('Live OpenAI-compatible Story storage', () => {
	it('prefers a complete environment connection and otherwise falls back to storage', () => {
		const storage = memoryStorage(
			JSON.stringify({
				version: 2,
				rememberCredentials: true,
				connection: {
					apiKey: 'stored-key',
					baseUrl: 'https://stored.example.com/v1',
					headers: { 'X-Stored': 'value' },
					model: 'stored-model',
				},
			}),
		);
		expect(
			resolveLiveOpenAIConnectionStoryState(storage, {
				apiKey: 'environment-key',
				baseUrl: 'https://environment.example.com/v1',
				headers: {},
				model: 'environment-model',
			}),
		).toEqual({
			connection: {
				apiKey: 'environment-key',
				baseUrl: 'https://environment.example.com/v1',
				headers: {},
				model: 'environment-model',
			},
			rememberCredentials: false,
		});
		expect(resolveLiveOpenAIConnectionStoryState(storage, undefined).connection.model).toBe('stored-model');
	});

	it('persists repeatable non-secret connection fields without credentials by default', () => {
		const storage = memoryStorage();
		expect(
			writeLiveOpenAIConnectionStoryState(
				storage,
				{
					apiKey: 'placeholder-secret',
					baseUrl: 'https://example.com/v1',
					headers: { 'X-Example': 'value' },
					model: 'example-model',
				},
				false,
			),
		).toBe(true);
		expect(storage.value()).not.toContain('placeholder-secret');
		expect(storage.value()).not.toContain('X-Example');
		expect(storage.value()).not.toContain('value');
		expect(readLiveOpenAIConnectionStoryState(storage)).toEqual({
			connection: {
				apiKey: '',
				baseUrl: 'https://example.com/v1',
				headers: {},
				model: 'example-model',
			},
			rememberCredentials: false,
		});
	});

	it('persists and removes API keys and header values only through explicit credential opt-in', () => {
		const storage = memoryStorage();
		const connection = {
			apiKey: 'placeholder-secret',
			baseUrl: 'https://example.com/v1',
			headers: { Authorization: 'Bearer placeholder-token' },
			model: 'example-model',
		};
		expect(writeLiveOpenAIConnectionStoryState(storage, connection, true)).toBe(true);
		expect(readLiveOpenAIConnectionStoryState(storage)).toMatchObject({
			connection: { apiKey: 'placeholder-secret', headers: { Authorization: 'Bearer placeholder-token' } },
			rememberCredentials: true,
		});
		expect(writeLiveOpenAIConnectionStoryState(storage, connection, false)).toBe(true);
		expect(storage.value()).not.toContain('placeholder-secret');
		expect(storage.value()).not.toContain('placeholder-token');
		expect(readLiveOpenAIConnectionStoryState(storage)).toMatchObject({
			connection: { apiKey: '', headers: {} },
			rememberCredentials: false,
		});
	});

	it('fails closed for malformed, oversized, and unsafe stored values', () => {
		expect(readLiveOpenAIConnectionStoryState(memoryStorage('{broken'))).toMatchObject({
			connection: { baseUrl: '', model: '' },
			rememberCredentials: false,
		});
		expect(readLiveOpenAIConnectionStoryState(memoryStorage('x'.repeat(128 * 1024 + 1)))).toMatchObject({
			connection: { baseUrl: '', model: '' },
		});
		const storage = memoryStorage(
			JSON.stringify({
				version: 2,
				rememberCredentials: true,
				connection: {
					apiKey: 'x'.repeat(16 * 1024 + 1),
					baseUrl: 'https://example.com/v1',
					headers: { Good: 'value', Bad: 'line\nbreak' },
					model: 'example-model',
				},
			}),
		);
		const restored = readLiveOpenAIConnectionStoryState(storage);
		expect(restored).toMatchObject({
			connection: { apiKey: '', baseUrl: '', headers: {}, model: '' },
			rememberCredentials: false,
		});
	});

	it('keeps prototype-like header names as own data properties', () => {
		const headers = Object.create(null) as Record<string, string>;
		Object.defineProperty(headers, '__proto__', { enumerable: true, value: 'value' });
		const storage = memoryStorage();
		expect(
			writeLiveOpenAIConnectionStoryState(
				storage,
				{ baseUrl: 'https://example.com/v1', headers, model: 'example-model' },
				true,
			),
		).toBe(true);
		const restored = readLiveOpenAIConnectionStoryState(storage).connection.headers ?? {};
		expect(Object.hasOwn(restored, '__proto__')).toBe(true);
		expect(restored.__proto__).toBe('value');
	});
});
