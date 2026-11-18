import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
	type EmbeddingOutput,
	type IModelRegistry,
	type IModelService,
	type ImageGenerationOutput,
	MessageGenerationModelService,
	ModelRegistry,
	ModelService,
} from './index';

function embeddingService() {
	return new ModelService({ embedding: ({ input }) => ({ embeddings: [[input.length]] }) });
}

describe('public model registry', () => {
	it('registers independent services and resolves by id, alias, provider and capability', () => {
		const registry: IModelRegistry = new ModelRegistry();
		const service = embeddingService();
		registry.register({ provider: 'example', id: 'embed/v1', alias: 'fast', capabilities: ['embedding'], service });
		for (const model of ['embed/v1', 'fast', 'example/fast', 'example/embed/v1']) {
			expect(registry.require({ model, capability: 'embedding' }).service).toBe(service);
		}
		expect(registry.require({ provider: 'example' }).id).toBe('embed/v1');
		expect(registry.resolve({ provider: 'other' })).toBeUndefined();
		expect(registry.resolve({ model: 'fast', capability: 'message-generation' })).toBeUndefined();
		expect(() => registry.require('missing')).toThrow('No enabled model');
	});

	it('rejects duplicate registration and does not let an old disposal remove a replacement', () => {
		const registry = new ModelRegistry();
		const registration = {
			provider: 'example',
			id: 'embed',
			capabilities: ['embedding'] as const,
			service: embeddingService(),
		};
		const original = registry.register(registration);
		expect(() => registry.register(registration)).toThrow('already registered');
		original.dispose();
		expect(registry.list()).toEqual([]);
		const replacement = registry.register(registration);
		original.dispose();
		expect(registry.require('embed').service).toBe(registration.service);
		replacement.dispose();
		replacement.dispose();
		expect(registry.list()).toEqual([]);
	});

	it('fails ambiguous aliases and upstream ids, with explicit selection disambiguating', () => {
		const registry = new ModelRegistry();
		for (const [provider, alias] of [
			['one', 'fast'],
			['two', 'fast'],
			['one', 'other'],
		]) {
			registry.register({ provider, id: 'upstream', alias, capabilities: ['embedding'], service: embeddingService() });
		}
		expect(() => registry.resolve('fast')).toThrow('Ambiguous');
		expect(() => registry.resolve('one/upstream')).toThrow('Ambiguous');
		expect(registry.require({ provider: 'one', model: 'fast' }).alias).toBe('fast');
	});

	it('lists disabled models but excludes them from resolution, and projects safe immutable metadata', () => {
		const registry = new ModelRegistry();
		const secret = 'fixture-only-secret';
		const service = new MessageGenerationModelService({
			model: 'chat',
			target: { api: 'openai', baseUrl: 'https://example.test', apiKey: secret },
		});
		registry.register({
			provider: 'example',
			id: 'chat',
			enabled: false,
			capabilities: ['message-generation'],
			service,
		});
		registry.register({ provider: 'other', id: 'embed', capabilities: ['embedding'], service: embeddingService() });
		expect(registry.resolve('example/chat')).toBeUndefined();
		expect(() => registry.require('chat')).toThrow('No enabled model');
		expect(registry.list({ enabled: false })).toHaveLength(1);
		expect(registry.list({ provider: 'example', capability: 'embedding' })).toEqual([]);
		expect(registry.list({ enabled: true, capability: 'embedding' })).toHaveLength(1);
		const listed = registry.list({ provider: 'example' })[0];
		expect(listed).not.toHaveProperty('service');
		expect(JSON.stringify(registry.list())).not.toContain(secret);
		expect(Object.isFrozen(listed)).toBe(true);
		expect(Object.isFrozen(listed.capabilities)).toBe(true);
	});

	it('snapshots metadata and rejects capabilities unsupported by the service', () => {
		const registry = new ModelRegistry();
		const model = {
			provider: 'example',
			id: 'embed',
			enabled: true,
			capabilities: ['embedding'] as Array<'embedding'>,
			service: embeddingService(),
		};
		registry.register(model);
		model.enabled = false;
		model.capabilities.length = 0;
		expect(registry.require({ capability: 'embedding' }).enabled).toBe(true);
		expect(() => registry.register({ ...model, id: 'image', capabilities: ['image-generation'] })).toThrow(
			'does not support',
		);
	});
});

describe('public typed model service', () => {
	it('dispatches distinct embedding and image inputs/results through the public interfaces', async () => {
		const embedding = vi.fn(({ input }: { input: string | readonly string[] }) => ({
			embeddings: [[input.length, 1]],
		}));
		const image = vi.fn(({ prompt }: { prompt: string }) => ({
			images: [{ url: `https://example.test/${prompt}.png` }],
		}));
		const service: IModelService = new ModelService({ embedding, 'image-generation': image });
		const registry: IModelRegistry = new ModelRegistry();
		registry.register({ provider: 'fake', id: 'multi', capabilities: ['embedding', 'image-generation'], service });
		const selected = registry.require({ model: 'multi', capability: 'embedding' });
		const vector = await selected.service.embedding({ input: 'hello' });
		const picture = await selected.service.generateImage({ prompt: 'cat' });
		expectTypeOf(vector).toEqualTypeOf<EmbeddingOutput>();
		expectTypeOf(picture).toEqualTypeOf<ImageGenerationOutput>();
		expect(vector).toEqual({ embeddings: [[5, 1]] });
		expect(picture).toEqual({ images: [{ url: 'https://example.test/cat.png' }] });
		expect(embedding).toHaveBeenCalledExactlyOnceWith({ input: 'hello' }, {});
		expect(image).toHaveBeenCalledExactlyOnceWith({ prompt: 'cat' }, {});
		await expect(service.invoke('message-generation', { messages: [] })).rejects.toThrow('Unsupported');
		expect(embedding).toHaveBeenCalledTimes(1);
		expect(image).toHaveBeenCalledTimes(1);
		if (false) {
			// @ts-expect-error Embeddings do not accept message-generation requests.
			await service.invoke('embedding', { messages: [] });
			// @ts-expect-error Image generation requires a prompt.
			await service.invoke('image-generation', { input: 'hello' });
			// @ts-expect-error Embedding results are not message results.
			vector.text;
		}
	});

	it('rejects missing and unknown capabilities before invoking any handler', async () => {
		const handler = vi.fn(() => ({ embeddings: [] }));
		const service = new ModelService({ embedding: handler });
		await expect(service.invoke('image-generation', { prompt: 'hello' })).rejects.toThrow('Unsupported');
		// @ts-expect-error Untyped consumers must not fall back to chat or inherited object methods.
		await expect(service.invoke('toString', {})).rejects.toThrow('Unsupported');
		expect(handler).not.toHaveBeenCalled();
		const controller = new AbortController();
		controller.abort(new Error('cancelled'));
		await expect(service.invoke('embedding', { input: 'x' }, { signal: controller.signal })).rejects.toThrow(
			'cancelled',
		);
		expect(handler).not.toHaveBeenCalled();
	});

	it('adapts messages using the public message executor and preserves the host injection', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			Response.json({
				choices: [{ index: 0, message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }],
			}),
		);
		const target = { api: 'openai' as const, baseUrl: 'https://example.test/v1' };
		const service = new MessageGenerationModelService({ model: 'chat', target });
		const input = { messages: [{ role: 'user', content: [{ type: 'text' as const, text: 'hi' }] }] };
		expect((await service.generateContent(input, { fetch })).text).toBe('hello');
		expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).model).toBe('chat');
		const generate = vi.fn().mockResolvedValue({ text: 'injected', response: { choices: [] }, diagnostics: [] });
		const injected = new MessageGenerationModelService({ model: 'injected-chat', target, generate });
		expect((await injected.generateContent(input)).text).toBe('injected');
		expect(generate).toHaveBeenCalledWith(
			{ ...input, model: 'injected-chat', stream: false, target: { ...target, headers: {} } },
			{},
		);
		await expect(injected.invoke('embedding', { input: 'hi' })).rejects.toThrow('Unsupported');
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it('forwards cancellation to non-message handlers and rejects results after abort', async () => {
		const controller = new AbortController();
		const service = new ModelService({
			embedding: (_input, options) => {
				expect(options.signal).toBe(controller.signal);
				controller.abort(new Error('cancelled during generation'));
				return { embeddings: [[1]] };
			},
		});
		await expect(service.embedding({ input: 'x' }, { signal: controller.signal })).rejects.toThrow(
			'cancelled during generation',
		);
	});

	it('exposes typed rerank, image edit, decision and token count handlers without claiming a protocol', async () => {
		const service: IModelService = new ModelService({
			rerank: ({ documents }) => ({ results: documents.map((_, index) => ({ index, score: 1 / (index + 1) })) }),
			'image-edit': ({ images }) => ({ images: [...images] }),
			decision: ({ choices }) => ({ decision: choices[0], confidence: 1 }),
			'token-count': ({ messages }) => ({ inputTokens: messages.length }),
		});
		expect(await service.rerank({ query: 'question', documents: ['answer'] })).toEqual({
			results: [{ index: 0, score: 1 }],
		});
		const images = [{ data: new Uint8Array([1, 2]), mediaType: 'image/png' }];
		expect(await service.imageEdit({ prompt: 'edit', images })).toEqual({ images });
		expect(await service.decide({ input: 'choose', choices: ['yes', 'no'] })).toEqual({
			decision: 'yes',
			confidence: 1,
		});
		expect(await service.countTokens({ messages: [] })).toEqual({ inputTokens: 0 });
		await expect(service.generateContent({ messages: [] })).rejects.toThrow('Unsupported');
		const unsupported = new ModelService({});
		await expect(unsupported.embedding({ input: 'x' })).rejects.toThrow('Unsupported');
		await expect(unsupported.rerank({ query: 'x', documents: [] })).rejects.toThrow('Unsupported');
		await expect(unsupported.imageEdit({ prompt: 'x', images: [] })).rejects.toThrow('Unsupported');
		await expect(unsupported.decide({ input: 'x', choices: [] })).rejects.toThrow('Unsupported');
		await expect(unsupported.countTokens({ messages: [] })).rejects.toThrow('Unsupported');
		await expect(async () => {
			for await (const _ of unsupported.streamContent({ messages: [] })) {
				/* consume */
			}
		}).rejects.toThrow('Unsupported');
	});
});
