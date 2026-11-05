import type { TtsRequest } from '@wener/client/tts';
import * as ttsClients from '@wener/client/tts';
import { describe, expect, it, vi } from 'vitest';
import * as config from './config';
import { preflightTtsRequest } from './preflight';

const invalid = /^Invalid TTS request or configuration$/u;

describe('pure TTS preflight', () => {
	it.each(['edge-tts', 'edge'])('validates %s with static voice options', (provider) => {
		const request = Object.freeze({ text: 'test', voice: 'zh-CN-XiaoxiaoNeural', format: 'mp3' as const });
		expect(preflightTtsRequest(provider, request, { voice: 'zh-CN-YunxiNeural' })).toEqual(request);
		expect(preflightTtsRequest(provider, { text: 'test', speed: 1.5 })).toMatchObject({ text: 'test', speed: 1.5 });
	});

	it.each([
		{ text: 'test', format: 'wav' },
		{ text: 'test', model: 'unsupported-model' },
		{ text: 'test', instructions: 'unsupported-instructions' },
		{ text: 'test', speed: 1.5, rate: '+10%' },
		{ text: 'test', rate: '-100%' },
		{ text: 'test', volume: '-101%' },
		{ text: '   ' },
	])('rejects unsupported Edge input %j with a fixed error', (input) => {
		expect(() => preflightTtsRequest('edge-tts', input as TtsRequest)).toThrow(invalid);
	});

	it.each(['openai-tts', 'openai-speech'])('normalizes %s defaults while preserving CLI overrides', (provider) => {
		expect(
			preflightTtsRequest(provider, { text: 'test' }, { model: 'configured-model', voice: 'configured-voice' }),
		).toEqual({ text: 'test', model: 'configured-model', voice: 'configured-voice' });
		expect(
			preflightTtsRequest(
				provider,
				{ text: 'test', model: 'request-model', voice: 'nova' },
				{ model: 'configured-model', voice: 'configured-voice' },
			),
		).toEqual({ text: 'test', model: 'request-model', voice: 'nova' });
	});

	it.each([{ rate: '+1%' }, { pitch: '+1Hz' }, { volume: '+1%' }])(
		'rejects unsupported OpenAI prosody %j',
		(prosody) => {
			expect(() => preflightTtsRequest('openai-tts', { text: 'test', ...prosody }, { model: 'model' })).toThrow(
				invalid,
			);
		},
	);

	it('permits undefined OpenAI prosody and both speed boundaries', () => {
		for (const speed of [0.25, 4]) {
			expect(
				preflightTtsRequest(
					'openai-tts',
					{
						text: 'test',
						rate: undefined,
						pitch: undefined,
						volume: undefined,
						speed,
					},
					{ model: 'model' },
				),
			).toMatchObject({ model: 'model', voice: 'alloy', speed });
		}
	});

	it('rejects a missing OpenAI model before any factory or transport is needed', () => {
		expect(() => preflightTtsRequest('openai-tts', { text: 'test' })).toThrow(invalid);
	});

	it.each([
		['edge-tts', { voice: ' ' }],
		['edge-tts', { timeoutMs: 0 }],
		['edge-tts', { maxAudioBytes: 0 }],
		['edge-tts', null],
		['openai-tts', { model: ' ' }],
		['openai-tts', { model: 'model', apiKey: 'private-key', apiKeyEnv: 'TEST_KEY' }],
		['openai-tts', { model: 'model', apiKeyEnv: 'INVALID-ENV-NAME' }],
		['openai-tts', { model: 'model', unsupported: 'private-value' }],
	])('rejects invalid %s static options without raw schema errors', (provider, options) => {
		expect(() => preflightTtsRequest(provider as string, { text: 'test' }, options)).toThrow(invalid);
	});

	it('validates general inputs first and permits unknown providers to extend capabilities', () => {
		expect(
			preflightTtsRequest(
				'future-llama',
				{ text: 'test', model: 'future-model', rate: '+10%', format: 'wav' },
				{ extension: true },
			),
		).toMatchObject({ text: 'test', model: 'future-model', rate: '+10%', format: 'wav' });
		for (const provider of ['future-llama', 'edge-tts', 'openai-tts']) {
			expect(() => preflightTtsRequest(provider, { text: '' }, { model: 'model' })).toThrow(invalid);
			expect(() => preflightTtsRequest(provider, { text: 'test', speed: 4.01 }, { model: 'model' })).toThrow(invalid);
		}
	});

	it('does not resolve credential references, create clients or invoke fetch', () => {
		const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
			throw new Error('must not fetch');
		});
		const resolve = vi.spyOn(config, 'resolveOpenAiTtsConnectionOptions').mockImplementation(() => {
			throw new Error('must not resolve credentials');
		});
		const openai = vi.spyOn(ttsClients, 'createOpenAiTtsClient').mockImplementation(() => {
			throw new Error('must not create client');
		});
		const edge = vi.spyOn(ttsClients, 'createEdgeTtsClient').mockImplementation(() => {
			throw new Error('must not create client');
		});
		try {
			for (const credentials of [
				{ apiKeyEnv: 'TEST_TTS_UNRESOLVED_KEY' },
				{ apiKey: 'env://TEST_TTS_UNRESOLVED_KEY' },
			]) {
				expect(preflightTtsRequest('openai-tts', { text: 'test' }, { model: 'model', ...credentials })).toMatchObject({
					model: 'model',
					voice: 'alloy',
				});
			}
			expect(preflightTtsRequest('edge-tts', { text: 'test' })).toEqual({ text: 'test' });
			expect(fetch).not.toHaveBeenCalled();
			expect(resolve).not.toHaveBeenCalled();
			expect(openai).not.toHaveBeenCalled();
			expect(edge).not.toHaveBeenCalled();
		} finally {
			fetch.mockRestore();
			resolve.mockRestore();
			openai.mockRestore();
			edge.mockRestore();
		}
	});
});
