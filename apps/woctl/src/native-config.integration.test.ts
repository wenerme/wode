import { execFile } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { resolveCliContext } from 'common/context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import { createFileConfigStore } from './node/config';

const exec = promisify(execFile);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
let suiteRoot: string;
let cliFile: string;
let guardFile: string;

beforeAll(async () => {
	suiteRoot = await realpath(await mkdtemp(join(tmpdir(), 'wocli-native-integration-')));
	try {
		// 使用实际 Node 构建入口一次；复制相同产物后，各 consumer 不再依赖共享 dist 的变化。
		await exec(process.execPath, ['--import', 'tsx', 'scripts/build.ts', 'cli'], {
			cwd: appRoot,
			env: { HOME: suiteRoot, USERPROFILE: suiteRoot, NO_COLOR: '1' },
			timeout: 60000,
		});
		cliFile = join(suiteRoot, 'cli.mjs');
		await copyFile(join(appRoot, 'dist', 'cli.js'), cliFile);
		guardFile = join(suiteRoot, 'offline-guard.mjs');
		await writeFile(
			guardFile,
			`let attempts = 0;
globalThis.fetch = async () => { attempts++; throw new Error('Native fixture must not fetch'); };
process.on('exit', () => {
  if (attempts) { process.stderr.write('Unexpected network attempt\\n'); process.exitCode = 86; }
});
`,
		);
	} catch (error) {
		await rm(suiteRoot, { recursive: true, force: true });
		throw error;
	}
}, 60000);

afterAll(async () => {
	if (suiteRoot) await rm(suiteRoot, { recursive: true, force: true });
});

function documents(currentContext = 'local') {
	return {
		base: {
			version: 1,
			currentContext,
			extensionRoot: { nested: ['root', { keep: true }] },
			services: [
				{ name: 'root-system', type: 'system', extensionService: { keep: 'root' } },
				{
					name: 'shared',
					type: 'system',
					title: 'root shared',
					headers: { authorization: 'Bearer fixture-secret' },
					options: { rootOnly: true },
				},
			],
			defaults: { services: { system: 'root-system', auxiliary: 'shared' } },
			providers: {
				example: {
					api: 'openai',
					baseUrl: 'https://example.com/root',
					apiKeyEnv: 'FIXTURE_ONLY_KEY',
					models: { root: { name: 'root-model' } },
				},
				rootOnly: { api: 'openai', baseUrl: 'https://example.com/root-only' },
			},
			defaultModel: 'example/root',
			prompts: { shared: { template: 'root shared' }, rootOnly: { template: 'root only' } },
		},
		local: {
			services: [{ name: 'local-system', type: 'system' }],
			defaults: { services: { system: 'local-system' } },
		},
		dev: {
			title: 'Development fixture',
			extensionContext: { nested: { keep: true } },
			services: [
				{ name: 'shared', type: 'system', title: 'dev shared', extensionService: { keep: 'dev' } },
				{ name: 'dev-system', api: 'system' },
			],
			defaults: { services: { system: 'dev-system' } },
			providers: {
				example: {
					api: 'openai',
					baseUrl: 'https://example.com/dev',
					models: { dev: { name: 'dev-model', maxOutputTokens: 32 } },
				},
			},
			defaultModel: 'example/dev',
			prompts: { shared: { template: 'dev shared' }, devOnly: { template: 'dev only' } },
		},
		other: { services: [], extensionContext: { keep: 'other' } },
	};
}

type RunOptions = { defaultPath?: boolean; env?: Record<string, string> };
type Result = { code: number; stdout: string; stderr: string };
type Fixture = {
	root: string;
	home: string;
	base: string;
	docs: ReturnType<typeof documents>;
	overlay(name: string): string;
	run(argv: string[], options?: RunOptions): Promise<Result>;
};

async function withFixture(
	options: { filename?: string; currentContext?: string; seed?: boolean },
	run: (fixture: Fixture) => Promise<void>,
) {
	const root = await mkdtemp(join(suiteRoot, 'consumer-'));
	const home = join(root, 'home');
	const filename = options.filename ?? 'woctl.yaml';
	const base = join(options.filename ? join(root, 'custom') : join(home, '.wode'), filename);
	const overlay = (name: string) => base.replace(/\.(ya?ml)$/, `.${name}.$1`);
	const docs = documents(options.currentContext);
	try {
		await mkdir(join(home, '.wode'), { recursive: true });
		await mkdir(dirname(base), { recursive: true });
		if (options.seed !== false) {
			await writeDocument(base, docs.base);
			for (const name of ['local', 'dev', 'other'] as const) await writeDocument(overlay(name), docs[name]);
		}
		await run({
			root,
			home,
			base,
			docs,
			overlay,
			async run(argv, options = {}) {
				let result: Result;
				try {
					const output = await exec(
						process.execPath,
						['--import', guardFile, cliFile, ...(options.defaultPath ? [] : ['--config', base]), ...argv],
						{
							cwd: root,
							env: { HOME: home, USERPROFILE: home, NO_COLOR: '1', ...options.env },
							timeout: 20000,
						},
					);
					result = { code: 0, stdout: output.stdout, stderr: output.stderr };
				} catch (error) {
					const failure = error as { code?: unknown; stdout?: string; stderr?: string };
					if (typeof failure.code !== 'number') throw error;
					result = { code: failure.code, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' };
				}
				expect(result.code, result.stderr).not.toBe(86);
				return result;
			},
		});
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

async function writeDocument(file: string, value: unknown) {
	await writeFile(file, `# native fixture; reads must preserve these bytes\n${stringify(value)}`);
}

async function snapshot(root: string) {
	const files: Record<string, string> = {};
	async function visit(directory: string) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) {
				files[`${relative(root, path)}/`] = '';
				await visit(path);
			} else files[relative(root, path)] = await readFile(path, 'utf8');
		}
	}
	await visit(root);
	return files;
}

async function ok(f: Fixture, argv: string[], options?: RunOptions) {
	const result = await f.run(argv, options);
	expect(result.code, result.stderr).toBe(0);
	return result;
}

async function json(f: Fixture, argv: string[], options?: RunOptions) {
	return JSON.parse((await ok(f, [...argv, '--json'], options)).stdout);
}

function rejected(result: Result) {
	expect(result.code, result.stdout).not.toBe(0);
	expect(result.stderr.trim()).not.toBe('');
}

function configurationRejected(result: Result) {
	expect(result.code, result.stderr).toBe(2);
	expect(result.stdout).toBe('');
	expect(result.stderr).toMatch(/configuration|context/i);
	expect(result.stderr).not.toContain('fixture-secret');
	expect(result.stderr).not.toContain('services: [');
}

describe('native configuration files and built Node CLI', () => {
	it('selects WOCTL_CONFIG and WOCTL_CONTEXT ahead of legacy variables without rewriting files', async () => {
		await withFixture({}, async (f) => {
			const before = await snapshot(f.root);
			const result = await json(f, ['info'], {
				defaultPath: true,
				env: {
					WOCTL_CONFIG: f.base,
					WOCLI_CONFIG: join(f.root, 'missing.yaml'),
					WOCTL_CONTEXT: 'dev',
					WOCLI_CONTEXT: 'missing',
				},
			});
			expect(result).toMatchObject({ context: 'dev', configPath: f.base, error: null });
			expect(await snapshot(f.root)).toEqual(before);
		});
	});

	it('runs default-HOME local/dev show and echo without changing any document bytes', async () => {
		await withFixture({}, async (f) => {
			const before = await snapshot(f.root);
			expect(await json(f, ['context', 'show'], { defaultPath: true })).toMatchObject({ name: 'local' });
			expect(await json(f, ['system', 'echo', '00012'], { defaultPath: true })).toEqual({ text: '00012' });
			expect(await json(f, ['context', 'show', '--context', 'dev'], { defaultPath: true })).toMatchObject({
				name: 'dev',
			});
			expect(await json(f, ['system', 'echo', 'dev', '-c', 'dev'], { defaultPath: true })).toEqual({ text: 'dev' });
			const services = await json(f, ['service', 'list', '-c', 'dev'], { defaultPath: true });
			expect(services.map((entry: { name: string }) => entry.name).sort()).toEqual([
				'dev-system',
				'root-system',
				'shared',
			]);
			expect(await snapshot(f.root)).toEqual(before);
		});
	});

	it.each(['yaml', 'yml'])('uses custom .%s companions and CLI > env > base > local selection', async (extension) => {
		await withFixture({ filename: `settings.${extension}` }, async (f) => {
			await writeFile(join(f.home, '.wode', 'woctl.yaml'), 'invalid: [home fallback must not be read');
			const before = await snapshot(f.root);
			expect(await json(f, ['context', 'show'], { env: { WOCTL_CONTEXT: 'dev' } })).toMatchObject({ name: 'dev' });
			expect(await json(f, ['context', 'show', '-c', 'local'], { env: { WOCTL_CONTEXT: 'dev' } })).toMatchObject({
				name: 'local',
			});
			expect(await json(f, ['context', 'show', '--context=dev'], { env: { WOCTL_CONTEXT: 'local' } })).toMatchObject({
				name: 'dev',
			});
			expect(await json(f, ['context', 'show'])).toMatchObject({ name: 'local' });
			expect(await snapshot(f.root)).toEqual(before);
			await writeDocument(f.base, { ...f.docs.base, currentContext: 'dev' });
			expect(await json(f, ['context', 'show'])).toMatchObject({ name: 'dev' });
			const { currentContext: _currentContext, ...withoutSelection } = f.docs.base;
			await writeDocument(f.base, withoutSelection);
			expect(await json(f, ['context', 'show'])).toMatchObject({ name: 'local' });
		});
	});

	it('replaces same-name services/providers, merges defaults/prompts, and keeps empty overlays additive', async () => {
		await withFixture({}, async (f) => {
			const before = await snapshot(f.root);
			const effective = resolveCliContext(await createFileConfigStore(f.base).load({ context: 'dev' }), 'dev');
			expect(effective.services.shared).toMatchObject({ title: 'dev shared', extensionService: { keep: 'dev' } });
			expect(effective.services.shared).not.toHaveProperty('headers');
			expect(effective.services.shared).not.toHaveProperty('options');
			expect(effective.defaults).toMatchObject({ system: 'dev-system', auxiliary: 'shared' });
			expect(effective.providers?.example.models).toEqual(f.docs.dev.providers.example.models);
			expect(effective.providers).toHaveProperty('rootOnly');
			expect(effective.prompts).toMatchObject({ ...f.docs.base.prompts, ...f.docs.dev.prompts });
			expect(await json(f, ['context', 'show', '-c', 'dev'])).toMatchObject({
				name: 'dev',
				defaultModel: 'example/dev',
			});
			expect((await ok(f, ['service', 'default', 'show', '--json', '-c', 'dev'])).stdout).toContain('dev-system');
			const other = await json(f, ['service', 'list', '-c', 'other']);
			expect(other.map((entry: { name: string }) => entry.name).sort()).toEqual(['root-system', 'shared']);
			expect(await snapshot(f.root)).toEqual(before);
			await writeDocument(f.overlay('dev'), {
				...f.docs.dev,
				services: [...f.docs.dev.services, { name: 'future', type: 'future-example' }],
			});
			const beforeUnknownCall = await snapshot(f.root);
			await json(f, ['context', 'show', '-c', 'dev']);
			const configured = await json(f, ['service', 'list', '-c', 'dev']);
			expect(configured).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'future' })]));
			const unsupported = await f.run(['service', 'call', 'future', 'read', '-c', 'dev']);
			expect(unsupported.code).toBe(1);
			expect(unsupported.stderr).toMatch(/Unknown service provider|unsupported/i);
			expect(await snapshot(f.root)).toEqual(beforeUnknownCall);
		});
	});

	it('writes service/default/prompt/provider edits only to the selected overlay without flattening inheritance', async () => {
		await withFixture({}, async (f) => {
			const baseBefore = await readFile(f.base, 'utf8');
			const localBefore = await readFile(f.overlay('local'), 'utf8');
			const otherBefore = await readFile(f.overlay('other'), 'utf8');
			await ok(f, ['service', 'add', 'extra', '--provider', 'system', '-c', 'dev']);
			await ok(f, ['service', 'default', 'set', 'system', 'extra', '-c', 'dev']);
			await ok(f, ['prompt', 'import', 'added', '--text', 'Hello {{name}}', '-c', 'dev']);
			await ok(f, [
				'provider',
				'add',
				'extra-ai',
				'--api',
				'openai',
				'--url',
				'https://example.com/extra',
				'-c',
				'dev',
			]);
			const saved = parse(await readFile(f.overlay('dev'), 'utf8'));
			expect(saved).toMatchObject({
				extensionContext: f.docs.dev.extensionContext,
				defaults: { services: { system: 'extra' } },
				providers: f.docs.dev.providers,
				defaultModel: f.docs.dev.defaultModel,
				prompts: { ...f.docs.dev.prompts, added: { template: 'Hello {{name}}' } },
			});
			expect(saved.services).toEqual(
				expect.arrayContaining([expect.objectContaining({ name: 'extra', type: 'system' })]),
			);
			expect(saved.services.find((service: { name: string }) => service.name === 'shared')).toMatchObject(
				f.docs.dev.services[0],
			);
			expect(saved.services.some((service: { name: string }) => service.name === 'root-system')).toBe(false);
			expect(saved.providers).toHaveProperty('extra-ai');
			expect(saved.providers).not.toHaveProperty('rootOnly');
			expect(saved.prompts).not.toHaveProperty('rootOnly');
			for (const field of ['version', 'currentContext', 'contexts']) expect(saved).not.toHaveProperty(field);
			expect(await readFile(f.base, 'utf8')).toBe(baseBefore);
			expect(await readFile(f.overlay('local'), 'utf8')).toBe(localBefore);
			expect(await readFile(f.overlay('other'), 'utf8')).toBe(otherBefore);
			const beforeDelete = await snapshot(f.root);
			rejected(await f.run(['service', 'remove', 'root-system', '-c', 'dev']));
			expect(await snapshot(f.root)).toEqual(beforeDelete);
		});
	});

	it('creates/removes independent context files and changes only base currentContext on use', async () => {
		await withFixture({}, async (f) => {
			const baseBefore = await readFile(f.base, 'utf8');
			const siblings = await Promise.all(['local', 'dev', 'other'].map((name) => readFile(f.overlay(name), 'utf8')));
			await ok(f, ['context', 'create', 'qa']);
			const created = await readFile(f.overlay('qa'), 'utf8');
			expect(parse(created).services).toEqual([]);
			expect(await readFile(f.base, 'utf8')).toBe(baseBefore);
			await ok(f, ['context', 'use', 'qa']);
			const base = parse(await readFile(f.base, 'utf8'));
			expect(base).toMatchObject({ ...f.docs.base, currentContext: 'qa' });
			expect(base).not.toHaveProperty('contexts');
			expect(await readFile(f.overlay('qa'), 'utf8')).toBe(created);
			const beforeCurrentRemoval = await snapshot(f.root);
			rejected(await f.run(['context', 'remove', 'qa']));
			expect(await snapshot(f.root)).toEqual(beforeCurrentRemoval);
			await ok(f, ['context', 'use', 'local']);
			await ok(f, ['context', 'remove', 'qa']);
			await expect(readFile(f.overlay('qa'))).rejects.toMatchObject({ code: 'ENOENT' });
			expect(await Promise.all(['local', 'dev', 'other'].map((name) => readFile(f.overlay(name), 'utf8')))).toEqual(
				siblings,
			);
			expect(parse(await readFile(f.base, 'utf8'))).toMatchObject(f.docs.base);
		});
	});

	it('lists malformed unselected context filenames without parsing their bodies', async () => {
		await withFixture({}, async (f) => {
			await writeFile(f.overlay('other'), 'services: [fixture-secret\n');
			const before = await snapshot(f.root);
			const list = await json(f, ['context', 'list']);
			expect(list.map((entry: { name: string }) => entry.name)).toEqual(
				expect.arrayContaining(['local', 'dev', 'other']),
			);
			expect(JSON.stringify(list)).not.toContain('fixture-secret');
			expect(await json(f, ['context', 'show'])).toMatchObject({ name: 'local' });
			configurationRejected(await f.run(['context', 'show', '-c', 'other']));
			expect(await snapshot(f.root)).toEqual(before);
		});
	});

	it('allows a missing local overlay but rejects missing nonlocal selection without writing', async () => {
		await withFixture({}, async (f) => {
			await rm(f.overlay('local'));
			const before = await snapshot(f.root);
			expect(await json(f, ['context', 'show'])).toMatchObject({ name: 'local' });
			expect(await json(f, ['system', 'echo', 'base-only'])).toEqual({ text: 'base-only' });
			const missing = await f.run(['context', 'show', '--context', 'missing']);
			configurationRejected(missing);
			expect(missing.stderr).toMatch(/context|ENOENT/i);
			configurationRejected(await f.run(['system', 'echo', 'must-fail', '-c', 'missing']));
			expect(await snapshot(f.root)).toEqual(before);
			await ok(f, ['context', 'create', 'local']);
			expect(parse(await readFile(f.overlay('local'), 'utf8'))).toMatchObject({
				services: [],
				defaults: { services: {} },
			});
			const afterCreate = await snapshot(f.root);
			const withoutNewOverlay = { ...afterCreate };
			delete withoutNewOverlay[relative(f.root, f.overlay('local'))];
			expect(withoutNewOverlay).toEqual(before);
			rejected(await f.run(['context', 'create', 'local']));
			expect(await snapshot(f.root)).toEqual(afterCreate);
		});
	});

	it('keeps missing default/explicit bases empty, supports core help/render and never imports a home fallback', async () => {
		await withFixture({ seed: false }, async (f) => {
			const before = await snapshot(f.root);
			for (const defaultPath of [true, false]) {
				await ok(f, ['--help'], { defaultPath });
				const rendered = await ok(f, ['render', '--text', '{"ok":true}', '--input', 'json', '--format', 'json'], {
					defaultPath,
				});
				expect(JSON.parse(rendered.stdout)).toEqual({ ok: true });
				expect(await json(f, ['service', 'list'], { defaultPath })).toEqual([]);
				rejected(await f.run(['system', 'echo', 'no-auto-system'], { defaultPath }));
			}
			expect(await snapshot(f.root)).toEqual(before);
			await ok(f, ['prompt', 'import', 'first', '--text', 'hello']);
			const newOverlay = parse(await readFile(f.overlay('local'), 'utf8'));
			expect(newOverlay).toMatchObject({
				services: [],
				defaults: { services: {} },
				prompts: { first: { template: 'hello' } },
			});
			await expect(readFile(f.base)).rejects.toMatchObject({ code: 'ENOENT' });
			await writeDocument(f.base, f.docs.base);
			const missingCustom = join(f.root, 'settings.yaml');
			const withHomeBase = await snapshot(f.root);
			const result = await ok(f, ['--config', missingCustom, 'service', 'list', '--json'], { defaultPath: true });
			expect(JSON.parse(result.stdout)).toEqual([]);
			expect(await snapshot(f.root)).toEqual(withHomeBase);
		});
	});

	it('rejects legacy inline contexts, service maps, provider-only entries and flat defaults without rewriting', async () => {
		await withFixture({}, async (f) => {
			for (const invalid of [
				{ services: [], contexts: { local: {} } },
				{ services: { system: { type: 'system' } } },
				{ services: [{ name: 'system', provider: 'system' }] },
				{ services: [], defaults: { system: 'system' } },
			]) {
				await writeDocument(f.base, invalid);
				const before = await snapshot(f.root);
				configurationRejected(await f.run(['context', 'show']));
				expect(await snapshot(f.root)).toEqual(before);
			}
		});
	});

	it('rejects forbidden overlay fields, malformed selected YAML and unreadable files', async () => {
		await withFixture({ currentContext: 'dev' }, async (f) => {
			for (const forbidden of [{ version: 1 }, { currentContext: 'local' }, { contexts: {} }]) {
				await writeDocument(f.overlay('dev'), { ...f.docs.dev, ...forbidden });
				const before = await snapshot(f.root);
				configurationRejected(await f.run(['context', 'show']));
				expect(await snapshot(f.root)).toEqual(before);
			}
			await writeFile(f.overlay('dev'), 'services: [fixture-secret\n');
			const malformed = await snapshot(f.root);
			configurationRejected(await f.run(['context', 'show']));
			expect(await snapshot(f.root)).toEqual(malformed);
			await writeDocument(f.overlay('dev'), f.docs.dev);
			// root/Windows 无法可靠用 chmod 构造 EACCES；这些环境的权限故障由宿主单测验证。
			if (process.platform !== 'win32' && process.getuid?.() !== 0) {
				const before = await snapshot(f.root);
				await chmod(f.overlay('dev'), 0);
				try {
					const denied = await f.run(['context', 'show']);
					configurationRejected(denied);
					expect(denied.stderr).toContain('Unable to read file');
				} finally {
					await chmod(f.overlay('dev'), 0o600);
				}
				expect(await snapshot(f.root)).toEqual(before);
			}
		});
	});

	it('rejects a stale loaded-overlay revision and preserves the external writer content', async () => {
		await withFixture({}, async (f) => {
			const store = createFileConfigStore(f.base);
			const config = await store.load({ context: 'dev' });
			config.contexts.dev.title = 'stale local edit';
			await writeDocument(f.overlay('dev'), { ...f.docs.dev, title: 'external writer wins' });
			const before = await snapshot(f.root);
			await expect(store.save(config)).rejects.toThrow(/conflict|revision|changed/i);
			expect(await snapshot(f.root)).toEqual(before);
		});
	});

	it('rejects multi-document changes and edits to an unloaded context before any write', async () => {
		await withFixture({}, async (f) => {
			const store = createFileConfigStore(f.base);
			const config = await store.load({ context: 'dev' });
			config.currentContext = 'dev';
			config.contexts.dev.title = 'second document change';
			const before = await snapshot(f.root);
			await expect(store.save(config)).rejects.toThrow(/multiple documents/i);
			expect(await snapshot(f.root)).toEqual(before);
			const fresh = await store.load({ context: 'dev' });
			expect(fresh.contexts).toHaveProperty('other');
			fresh.contexts.other.title = 'unloaded placeholder must not be saved';
			await expect(store.save(fresh)).rejects.toThrow(/unloaded context/i);
			expect(await snapshot(f.root)).toEqual(before);
		});
	});

	it('does not remove another writer lock when saving the selected overlay fails', async () => {
		await withFixture({}, async (f) => {
			const store = createFileConfigStore(f.base);
			const config = await store.load({ context: 'dev' });
			config.contexts.dev.title = 'blocked edit';
			// 与当前 Node store 的锁协议对齐：目标文档路径加 .lock。
			const lock = `${f.overlay('dev')}.lock`;
			await writeFile(lock, 'foreign-fixture-lock-owner', { flag: 'wx' });
			const before = await snapshot(f.root);
			await expect(store.save(config)).rejects.toThrow(/busy|lock/i);
			expect(await readFile(lock, 'utf8')).toBe('foreign-fixture-lock-owner');
			expect(await snapshot(f.root)).toEqual(before);
		});
	});
});
