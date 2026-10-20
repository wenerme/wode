import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMemoryCliConfigStore } from 'common/context';
import type { ServiceProvider, ServiceRuntimeClient } from 'common/service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse, stringify } from 'yaml';
import { createWocliServiceCommand } from './createWocliCli';
import { createFileConfigStore } from './node/config';
import { createBrowserConfigStore, createWocliWebCli } from './web';

const unexpectedFetch = vi.fn<typeof globalThis.fetch>(async () => {
	throw new Error('Integration fixtures must not access the network');
});
beforeEach(() => {
	unexpectedFetch.mockClear();
	vi.stubGlobal('fetch', unexpectedFetch);
});
afterEach(() => {
	try {
		expect(unexpectedFetch).not.toHaveBeenCalled();
	} finally {
		vi.unstubAllGlobals();
	}
});

function arrayFixture() {
	return {
		version: 1,
		currentContext: 'local',
		extensionRoot: { nested: ['keep-root', { future: true }] },
		services: [
			{ name: 'system', type: 'system' },
			{
				name: 'gateway',
				api: 'http',
				id: 'root-api',
				baseUrl: 'https://example.com/root',
				headers: { authorization: 'Bearer fixture-secret' },
				readOnly: true,
				extensionService: { source: 'root', future: [1, 2] },
			},
		],
		defaults: { system: 'system', http: 'gateway' },
		providers: {
			example: {
				api: 'openai',
				baseUrl: 'https://example.com/ai',
				apiKeyEnv: 'FIXTURE_ONLY_KEY',
				endpoints: { chat: { baseUrl: 'https://example.com/chat', api: 'openai' } },
				models: { fast: { name: 'upstream-fast', endpointKey: 'chat', maxOutputTokens: 32 } },
			},
		},
		defaultModel: 'example/fast',
		prompts: { root: { template: 'Root {{text}}', model: 'example/fast' } },
		contexts: {
			local: { services: [], defaults: {}, extensionContext: { source: 'local' } },
			other: {
				services: [
					{
						name: 'gateway',
						type: 'http',
						id: 'context-api',
						baseUrl: 'https://example.com/context',
						readOnly: true,
						extensionService: { source: 'context' },
					},
				],
				defaults: {},
				extensionContext: { source: 'other', future: { retained: true } },
				providers: { alternate: { api: 'openai', models: { slow: { name: 'upstream-slow' } } } },
				defaultModel: 'alternate/slow',
				prompts: { existing: { template: 'Context {{text}}', model: 'alternate/slow' } },
			},
		},
	};
}

async function withNativeFixture(run: (file: string) => Promise<void>) {
	const { contexts, defaults, ...base } = arrayFixture();
	await withFile({ ...base, defaults: { services: defaults } }, async (file) => {
		for (const [name, { defaults, ...layer }] of Object.entries(contexts))
			await writeFile(
				file.replace('.yaml', `.${name}.yaml`),
				stringify({ ...layer, defaults: { services: defaults } }),
			);
		await run(file);
	});
}

async function withFile(raw: unknown, run: (file: string) => Promise<void>) {
	const directory = await mkdtemp(join(tmpdir(), 'wocli-services-array-'));
	const file = join(directory, 'config.yaml');
	try {
		if (raw !== undefined) await writeFile(file, `# fixture formatting must survive reads\n${stringify(raw)}`);
		await run(file);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

function output() {
	const lines: string[] = [];
	return { lines, io: { signal: new AbortController().signal, stdout: (text: string) => void lines.push(text) } };
}

function offlineHost() {
	return {
		fetch: vi.fn<typeof globalThis.fetch>(async () => {
			throw new Error('This command must not fetch');
		}),
		getEnv: vi.fn(() => {
			throw new Error('This command must not resolve secrets');
		}),
	};
}

async function mutateOther(cli: ReturnType<typeof createWocliWebCli>, io: ReturnType<typeof output>['io']) {
	await cli.executeLine('service add extra --provider system --context other', io);
	await cli.executeLine('service default set system extra --context other', io);
	await cli.executeLine('prompt import greet --text "Hello {{name}}" --context other', io);
}

function expectRetained(saved: unknown) {
	const raw = arrayFixture();
	expect(saved).toMatchObject({
		currentContext: 'local',
		extensionRoot: raw.extensionRoot,
		defaults: raw.defaults,
		providers: raw.providers,
		defaultModel: raw.defaultModel,
		prompts: raw.prompts,
		contexts: {
			local: { extensionContext: raw.contexts.local.extensionContext, defaults: {} },
			other: {
				extensionContext: raw.contexts.other.extensionContext,
				providers: raw.contexts.other.providers,
				defaultModel: raw.contexts.other.defaultModel,
				prompts: raw.contexts.other.prompts,
			},
		},
	});
}

describe('service array storage and CLI integration', () => {
	it('loads real YAML arrays for dispatch, context replacement and read-only calls without rewriting bytes', async () => {
		await withNativeFixture(async (file) => {
			const before = await readFile(file);
			const store = createFileConfigStore(file);
			await store.load();
			const host = offlineHost();
			const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
				const url = new URL(String(input));
				expect(url.origin).toBe('https://example.com');
				if (url.pathname.endsWith('/schema')) {
					return Response.json({
						tools: { read: { inputSchema: {}, annotations: { readOnlyHint: true } }, write: { inputSchema: {} } },
					});
				}
				expect(url.pathname).toMatch(/\/service\/(root-api|context-api)\/call$/);
				expect(JSON.parse(String(init?.body))).toEqual({ toolName: 'read', input: {} });
				return Response.json({ path: url.pathname, authorization: new Headers(init?.headers).has('authorization') });
			});
			const cli = createWocliWebCli({ ...host, config: store, fetch });
			const { io, lines } = output();
			await cli.executeLine('system echo 00012 --json', io);
			expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: '00012' });
			await cli.executeLine('service call gateway read --json', io);
			expect(JSON.parse(lines.pop() ?? '')).toEqual({ path: '/root/service/root-api/call', authorization: true });
			await cli.executeLine('service call gateway read --context other --json', io);
			expect(JSON.parse(lines.pop() ?? '')).toEqual({
				path: '/context/service/context-api/call',
				authorization: false,
			});
			await expect(cli.executeLine('service call gateway write --context other', io)).rejects.toThrow('read-only');
			expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/call'))).toHaveLength(2);
			expect((await store.load()).currentContext).toBe('local');
			expect(await readFile(file)).toEqual(before);
			expect(host.getEnv).not.toHaveBeenCalled();
		});
	});

	it('saves service/default/prompt mutations as arrays and retains extension fields and AI catalogs', async () => {
		await withNativeFixture(async (file) => {
			const baseBytes = await readFile(file);
			const host = offlineHost();
			const cli = createWocliWebCli({ ...host, config: createFileConfigStore(file) });
			await mutateOther(cli, output().io);
			const saved = parse(await readFile(file.replace('.yaml', '.other.yaml'), 'utf8'));
			expect(await readFile(file)).toEqual(baseBytes);
			expect(saved.extensionContext).toEqual(arrayFixture().contexts.other.extensionContext);
			expect(saved.providers).toEqual(arrayFixture().contexts.other.providers);
			expect(saved.defaultModel).toBe('alternate/slow');
			expect(saved.services).toEqual(
				expect.arrayContaining([
					expect.objectContaining(arrayFixture().contexts.other.services[0]),
					expect.objectContaining({ name: 'extra', type: 'system' }),
				]),
			);
			expect(saved.defaults).toEqual({ services: { system: 'extra' } });
			expect(saved.prompts.greet.template).toBe('Hello {{name}}');
			expect(
				(await createFileConfigStore(file).load({ context: 'other' })).contexts.other.services.extra.provider,
			).toBe('system');
			expect(host.fetch).not.toHaveBeenCalled();
			expect(host.getEnv).not.toHaveBeenCalled();
		});
	});

	it('persists browser arrays only on mutation and changes only the selected inline context', async () => {
		const raw = arrayFixture();
		const original = JSON.stringify(raw);
		const entries = new Map([
			['wocli.config', original],
			['unrelated', 'keep'],
		]);
		const storage = {
			getItem: vi.fn((key: string) => entries.get(key) ?? null),
			setItem: vi.fn((key: string, value: string) => void entries.set(key, value)),
		};
		const store = createBrowserConfigStore(storage);
		const host = offlineHost();
		const cli = createWocliWebCli({ ...host, config: store });
		const { io } = output();
		await store.load();
		await cli.executeLine('service list --context other --json', io);
		await cli.executeLine('--help', io);
		expect(storage.setItem).not.toHaveBeenCalled();
		expect(entries.get('wocli.config')).toBe(original);
		await mutateOther(cli, io);
		expect(storage.setItem).toHaveBeenCalledTimes(3);
		const saved = JSON.parse(entries.get('wocli.config') ?? '');
		expectRetained(saved);
		expect(saved.services).toEqual(expect.arrayContaining([expect.objectContaining(raw.services[1])]));
		expect(saved.contexts.local).toMatchObject(raw.contexts.local);
		expect(saved.contexts.other.services).toEqual(
			expect.arrayContaining([
				expect.objectContaining(raw.contexts.other.services[0]),
				expect.objectContaining({ name: 'extra', type: 'system' }),
			]),
		);
		expect(saved.contexts.other.defaults.system).toBe('extra');
		expect(saved.contexts.other.prompts.greet.template).toBe('Hello {{name}}');
		expect((await createBrowserConfigStore(storage).load()).currentContext).toBe('local');
		expect(entries.get('unrelated')).toBe('keep');
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
	});

	it('does not create a missing file on load and writes arrays for a new document on explicit mutation', async () => {
		await withFile(undefined, async (file) => {
			const store = createFileConfigStore(file);
			await store.load();
			const cli = createWocliWebCli({ config: store });
			await cli.executeLine('--help', output().io);
			await expect(readFile(file)).rejects.toMatchObject({ code: 'ENOENT' });
			await cli.executeLine('prompt import greet --text hello', output().io);
			const saved = parse(await readFile(file.replace('.yaml', '.local.yaml'), 'utf8'));
			expect(Array.isArray(saved.services)).toBe(true);
			expect(saved.prompts.greet.template).toBe('hello');
			expect((await createFileConfigStore(file).load()).services).toEqual({});
			await expect(readFile(file)).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('lists both disabled spellings but rejects domain and generic calls before provider or secret access', async () => {
		const raw = arrayFixture();
		const create = vi.fn<ServiceProvider['create']>(() => {
			throw new Error('Disabled provider must not be created');
		});
		let stored = JSON.stringify({
			...raw,
			services: [
				{ name: 'off-system', type: 'system', disabled: true },
				{ name: 'off-plugin', type: 'fixture', enabled: false },
				{ name: 'off-http', api: 'http', disabled: true, baseUrl: 'https://example.com/off' },
			],
			defaults: { system: 'off-system', fixture: 'off-plugin' },
		});
		const config = createBrowserConfigStore({
			getItem: () => stored,
			setItem: (_key, value) => {
				stored = value;
			},
		});
		const host = offlineHost();
		const cli = createWocliWebCli({
			...host,
			config,
			providers: [{ name: 'fixture', create }],
			commands: [
				createWocliServiceCommand<{ read(input: object): Promise<unknown> }>({
					name: 'fixture',
					description: 'fixture service',
					commands: [{ name: 'read', description: 'fixture read', prepare: () => (client) => client.read({}) }],
				}),
			],
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual(
			expect.arrayContaining(
				['off-system', 'off-plugin', 'off-http'].map((name) => expect.objectContaining({ name, disabled: true })),
			),
		);
		await cli.executeLine('--help', io);
		await expect(cli.executeLine('fixture read --help', io)).rejects.toThrow('Unknown command');
		await expect(cli.executeLine('system info --service off-system', io)).rejects.toThrow();
		await expect(cli.executeLine('fixture read --service off-plugin', io)).rejects.toThrow();
		for (const name of ['off-system', 'off-plugin', 'off-http']) {
			await expect(cli.executeLine(`service call ${name} read`, io)).rejects.toThrow('disabled');
		}
		await cli.executeLine('prompt import saved --text offline', io);
		const saved = await config.load();
		expect(saved.services['off-system']).toMatchObject({ disabled: true });
		expect(saved.services['off-plugin']).toMatchObject({ enabled: false });
		expect(JSON.parse(stored).services).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'off-system', type: 'system', disabled: true }),
				expect.objectContaining({ name: 'off-plugin', type: 'fixture', enabled: false }),
			]),
		);
		expect(create).not.toHaveBeenCalled();
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
		expect(lines.join('\n')).not.toContain('fixture-secret');
	});

	it('rejects disabled schema/call before touching an injected remote runtime', async () => {
		const getSchema = vi.fn<ServiceRuntimeClient['getSchema']>();
		const call = vi.fn<ServiceRuntimeClient['call']>();
		const cli = createWocliWebCli({
			config: createMemoryCliConfigStore({ services: [{ name: 'off', api: 'http', enabled: false }] }),
			runtime: { getSchema, call },
		});
		const { io } = output();
		await expect(cli.executeLine('service schema off --json', io)).rejects.toThrow('disabled');
		await expect(cli.executeLine('service call off read', io)).rejects.toThrow('disabled');
		expect(getSchema).not.toHaveBeenCalled();
		expect(call).not.toHaveBeenCalled();
	});

	it('keeps an unknown type in the managed directory and saved arrays but rejects execution offline', async () => {
		const raw = {
			services: [{ name: 'future', type: 'future-example', extensionService: { retained: true } }],
		};
		await withFile(raw, async (file) => {
			const host = offlineHost();
			const cli = createWocliWebCli({ ...host, config: createFileConfigStore(file) });
			const { io, lines } = output();
			await cli.executeLine('service list --json', io);
			expect(JSON.parse(lines.pop() ?? '')).toEqual([
				expect.objectContaining({ name: 'future', provider: 'future-example', disabled: false }),
			]);
			await cli.executeLine('--help', io);
			await expect(cli.executeLine('service call future read', io)).rejects.toThrow(
				/Unknown service provider|unsupported/i,
			);
			await cli.executeLine('prompt import offline --text kept', io);
			const saved = parse(await readFile(file, 'utf8'));
			expect(saved.services).toEqual(expect.arrayContaining([expect.objectContaining(raw.services[0])]));
			expect(host.fetch).not.toHaveBeenCalled();
			expect(host.getEnv).not.toHaveBeenCalled();
		});
	});

	it('creates and edits a separate context file without changing the base', async () => {
		await withNativeFixture(async (file) => {
			const baseBytes = await readFile(file);
			const cli = createWocliWebCli({ config: createFileConfigStore(file) });
			await cli.executeLine('context create added', output().io);
			await cli.executeLine('service add new-system --provider system --context added', output().io);
			const saved = parse(await readFile(file.replace('.yaml', '.added.yaml'), 'utf8'));
			expect(saved.services).toEqual([expect.objectContaining({ name: 'new-system', type: 'system' })]);
			expect(saved).not.toHaveProperty('currentContext');
			expect(await readFile(file)).toEqual(baseBytes);
		});
	});
});
