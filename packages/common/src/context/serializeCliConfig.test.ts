import { describe, expect, it } from 'vitest';
import { createMemoryCliConfigStore, parseCliConfig, resolveCliContext } from './CliConfig';
import { serializeCliConfig } from './serializeCliConfig';

describe('CLI configuration serialization', () => {
	it('serializes internal provider indexes as canonical arrays', () => {
		const config = parseCliConfig({
			services: { legacy: { provider: 'custom-provider', metadata: { version: 2 } } },
			contexts: { local: { services: [{ name: 'protocol', api: 'example/v1' }] } },
		});
		const document = serializeCliConfig(config);
		expect(document.services).toEqual([
			{ name: 'legacy', type: 'custom-provider', metadata: { version: 2 }, readOnly: true },
		]);
		expect(document.contexts.local.services).toEqual([{ name: 'protocol', api: 'example/v1', readOnly: true }]);
		expect(JSON.stringify(document)).not.toContain('"provider":');
		expect(parseCliConfig(document).services.legacy.provider).toBe('custom-provider');
		expect(config.services.legacy).not.toHaveProperty('type');
	});

	it('serializes every aggregate collection as an array', () => {
		const original = {
			services: { legacy: { provider: 'custom-provider' }, typed: { type: 'http', metadata: { demo: true } } },
			contexts: {
				local: { services: [{ name: 'public', type: 'system', api: 'different-api' }] },
				old: { services: { old: { provider: 'http', name: 'old' } } },
				empty: {},
			},
		};
		const config = parseCliConfig(original);
		config.contexts.added = { services: { added: { provider: 'system', readOnly: true } }, defaults: {} };
		const document = serializeCliConfig(config);
		expect(document.services).toEqual([
			{ name: 'legacy', type: 'custom-provider', readOnly: true },
			{ name: 'typed', type: 'http', metadata: { demo: true }, readOnly: true },
		]);
		expect(document.contexts.local.services).toEqual([
			{ name: 'public', type: 'system', api: 'different-api', readOnly: true },
		]);
		expect(document.contexts.old.services).toEqual([{ type: 'http', name: 'old', readOnly: true }]);
		expect(document.contexts.empty.services).toEqual([]);
		expect(document.contexts.added.services).toEqual([{ name: 'added', type: 'system', readOnly: true }]);
		expect(original.services.legacy).toEqual({ provider: 'custom-provider' });
		expect(parseCliConfig(document).contexts.added.services.added.provider).toBe('system');
	});

	it('stabilizes canonical arrays through repeated aggregate parse/save cycles', () => {
		const original = {
			services: [{ name: 'root', type: 'http', provider: 'http', enabled: false }],
			contexts: { local: { services: { owned: { provider: 'system' } } } },
		};
		const first = serializeCliConfig(parseCliConfig(original));
		const second = serializeCliConfig(parseCliConfig(first));
		expect(second).toEqual(first);
		expect(Array.isArray(second.services)).toBe(true);
		expect(Array.isArray(second.contexts.local.services)).toBe(true);
		expect(second.services).toEqual([{ name: 'root', type: 'http', enabled: false, readOnly: true }]);
	});

	it('round-trips extensions, inert prototype fields and existing AI data without promoting them into policy', () => {
		const original = {
			...JSON.parse('{"__proto__":{"fixture":"root"}}'),
			metadata: { owner: ['demo'] },
			services: [
				{
					name: 'demo',
					type: 'http',
					...JSON.parse('{"__proto__":{"fixture":"service"}}'),
					permissions: { write: true },
				},
			],
			providers: {
				fixture: {
					api: 'openai',
					baseUrl: 'https://example.test/v1',
					apiKey: 'fixture-secret',
					models: { fast: { name: 'upstream', maxOutputTokens: 32 } },
					endpoints: { alternate: { baseUrl: 'https://example.test/alternate', apiKeyEnv: 'FIXTURE_KEY' } },
				},
			},
			defaultModel: 'fixture/fast',
			prompts: { summarize: { template: 'Summarize {{text}}', input: { tone: 'brief' } } },
			contexts: {
				local: {
					...JSON.parse('{"__proto__":{"fixture":"context"}}'),
					metadata: { stage: 'demo' },
					providers: { alternate: { api: 'gemini', baseUrl: 'https://example.test/gemini' } },
					prompts: { local: { template: '{{value}}' } },
				},
			},
		};
		const config = parseCliConfig(original);
		const restored = parseCliConfig(JSON.parse(JSON.stringify(serializeCliConfig(config))));
		expect(restored).toEqual(config);
		expect(restored.services.demo.readOnly).toBe(true);
		expect(restored.providers?.fixture.apiKey).toBe('fixture-secret');
		expect(Object.hasOwn(restored, '__proto__')).toBe(true);
		expect(Object.hasOwn(restored.services.demo, '__proto__')).toBe(true);
		expect(Object.hasOwn(restored.contexts.local, '__proto__')).toBe(true);
		expect(({} as Record<string, unknown>).fixture).toBeUndefined();
	});

	it('isolates initial/save inputs, loaded values, effective snapshots and serialization outputs', async () => {
		const initial = {
			metadata: { revision: 1 },
			services: [{ name: 'demo', type: 'http', metadata: { labels: ['initial'] } }],
			contexts: { local: { metadata: { revision: 1 } } },
		};
		const store = createMemoryCliConfigStore(initial);
		initial.metadata.revision = 9;
		initial.services[0].metadata.labels.push('outside');
		initial.contexts.local.metadata.revision = 9;
		const first = await store.load();
		expect(first.metadata).toEqual({ revision: 1 });
		expect(first.services.demo.metadata).toEqual({ labels: ['initial'] });
		expect(first.contexts.local.metadata).toEqual({ revision: 1 });
		const saved = parseCliConfig({
			metadata: { revision: 2 },
			services: [{ name: 'demo', type: 'http', metadata: { labels: ['saved'] } }],
			contexts: { local: { metadata: { revision: 2 } } },
		});
		await store.save(saved);
		(saved.metadata as { revision: number }).revision = 9;
		(saved.services.demo.metadata as { labels: string[] }).labels.push('outside-save');
		(saved.contexts.local.metadata as { revision: number }).revision = 9;
		const loaded = await store.load();
		expect(loaded.metadata).toEqual({ revision: 2 });
		expect(loaded.contexts.local.metadata).toEqual({ revision: 2 });
		const effective = resolveCliContext(loaded);
		(effective.configuredServices.demo.metadata as { labels: string[] }).labels.push('outside-effective');
		const document = serializeCliConfig(loaded);
		((document.services as Array<Record<string, unknown>>)[0].metadata as { labels: string[] }).labels.push(
			'outside-document',
		);
		expect(loaded.services.demo.metadata).toEqual({ labels: ['saved'] });
		(loaded.services.demo.metadata as { labels: string[] }).labels.push('outside-load');
		expect((await store.load()).services.demo.metadata).toEqual({ labels: ['saved'] });
	});

	it.each([null, 'fixture-secret', { services: null }, { contexts: { 'fixture-secret': null } }])(
		'rejects invalid config without echoing secret values or dynamic paths',
		(value) => {
			expect(() => parseCliConfig(value)).toThrow();
			try {
				parseCliConfig(value);
			} catch (error) {
				expect(String(error)).not.toContain('fixture-secret');
			}
		},
	);
});
