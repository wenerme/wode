import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

const execute = promisify(execFile);
const app = fileURLToPath(new URL('..', import.meta.url));
const repository = fileURLToPath(new URL('../../..', import.meta.url));

it('composes a native host with memory configuration and an additional command', async () => {
	const { createMemoryCliConfigStore, createNativeHost, createCli } = await import('./node');
	const directory = await mkdtemp(join(tmpdir(), 'woctl-node-host-'));
	try {
		const native = createNativeHost({ config: join(directory, 'missing.yaml') });
		const cli = createCli({
			...native,
			env: {},
			config: createMemoryCliConfigStore({}),
			commands: [
				...(native.commands ?? []),
				{
					name: 'private-local',
					description: 'Private local command',
					run: (_input, context) => context.stdout('private-local-result'),
				},
			],
		});
		const lines: string[] = [];
		await cli.executeLine('private-local', {
			signal: new AbortController().signal,
			stdout: (line) => lines.push(line),
		});
		expect(lines).toEqual(['private-local-result']);
		expect(cli.catalog().commands.map((command) => command.name)).toEqual(
			expect.arrayContaining(['version', 'pdf', 'xlsx', 'private-local']),
		);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

it('links an external source consumer, typechecks its SDK use, bundles and executes it with Node', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'woctl-node-consumer-'));
	const protectedFiles = [
		join(repository, 'package.json'),
		join(repository, 'pnpm-lock.yaml'),
		join(app, 'package.json'),
	];
	const fingerprint = async () =>
		Promise.all(
			protectedFiles.map(async (path) =>
				createHash('sha256')
					.update(await readFile(path))
					.digest('hex'),
			),
		);
	const before = await fingerprint();
	try {
		await writeFile(
			join(directory, 'package.json'),
			JSON.stringify({ name: 'woctl-external-consumer-fixture', private: true, type: 'module' }),
		);
		await mkdir(join(directory, 'home'));
		const env = {
			...process.env,
			HOME: join(directory, 'home'),
			XDG_CONFIG_HOME: join(directory, 'home'),
			WOCTL_CONFIG: join(directory, 'missing.yaml'),
			WCLI_CONFIG: join(directory, 'missing.yaml'),
			// A link implementation that starts installation must remain offline and cannot execute scripts.
			npm_config_offline: 'true',
			npm_config_ignore_scripts: 'true',
			CI: 'true',
		};
		let linkFailure: string | undefined;
		try {
			const result = await execute('pnpm', ['link', app], {
				cwd: directory,
				env,
				timeout: 20000,
				maxBuffer: 1024 * 1024,
			});
			console.info(`External consumer: pnpm link ${app}\n${result.stdout}${result.stderr}`);
		} catch (cause) {
			const failure = cause as Error & { code?: string | number; stdout?: string; stderr?: string; killed?: boolean };
			linkFailure = `${failure.message}\n${failure.stdout ?? ''}${failure.stderr ?? ''}`;
			// Do not disguise a broken package export as an environment/install fallback.
			expect(linkFailure).toMatch(
				/install|workspace:|ERR_PNPM_(?:WORKSPACE_PKG_NOT_FOUND|FETCH|META_FETCH|NO_OFFLINE)|EPERM|EACCES|ENOENT|Corepack|network|fetch|timed out/i,
			);
			console.warn(`External consumer link failed; using temporary node_modules symlink only:\n${linkFailure}`);
			await mkdir(join(directory, 'node_modules'), { recursive: true });
			await rm(join(directory, 'node_modules/woctl'), { recursive: true, force: true });
			await symlink(app, join(directory, 'node_modules/woctl'), 'dir');
		}
		expect(await realpath(join(directory, 'node_modules/woctl'))).toBe(await realpath(app));
		await writeFile(join(directory, 'consumer.ts'), consumerSource);
		const compiler = join(repository, 'node_modules/typescript/bin/tsc');
		let typecheckFailure: string | undefined;
		await execute(
			process.execPath,
			[
				compiler,
				'--ignoreConfig',
				'--noEmit',
				'--strict',
				'--skipLibCheck',
				'--module',
				'esnext',
				'--moduleResolution',
				'bundler',
				'--target',
				'esnext',
				'--jsx',
				'react-jsx',
				'--esModuleInterop',
				'--types',
				'node',
				'--typeRoots',
				join(repository, 'node_modules/@types'),
				join(directory, 'consumer.ts'),
			],
			{ cwd: directory, env, timeout: 60000, maxBuffer: 4 * 1024 * 1024 },
		).catch((cause: { stdout?: string; stderr?: string }) => {
			typecheckFailure = `External consumer noEmit failed:\n${cause.stdout ?? ''}${cause.stderr ?? ''}`;
		});
		const bundled = await build({
			absWorkingDir: directory,
			entryPoints: ['consumer.ts'],
			outdir: join(directory, 'out'),
			bundle: true,
			splitting: true,
			platform: 'node',
			format: 'esm',
			target: 'node24',
			metafile: true,
			external: ['pg-native', '@hyzyla/pdfium', 'canvaskit-wasm', 'excelize-wasm', 'pdfjs-dist', 'pdfjs-dist/*'],
			banner: {
				js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
			},
		});
		const inputs = Object.keys(bundled.metafile.inputs).map((path) => join(directory, path));
		expect(inputs).toContain(join(app, 'src/node.ts'));
		// Bare common must resolve through woctl's workspace dependencies, never a private application's copy.
		expect(inputs.some((path) => path.startsWith(`${join(repository, 'packages/common/src/context')}/`))).toBe(true);
		const result = await execute(process.execPath, [join(directory, 'out/consumer.js')], {
			cwd: directory,
			env,
			timeout: 30000,
			maxBuffer: 1024 * 1024,
		}).catch((cause: { stdout?: string; stderr?: string }) => {
			throw new Error(`External consumer execution failed:\n${cause.stdout ?? ''}${cause.stderr ?? ''}`);
		});
		expect(JSON.parse(result.stdout)).toEqual({
			imported: true,
			publicRead: true,
			privateCommand: true,
			privateBinding: true,
			configReads: 0,
		});
		expect(result.stderr).toBe('');
		console.info(
			`External consumer: ${linkFailure ? 'symlink fallback' : 'pnpm link'}, esbuild and Node passed; cwd=${directory}`,
		);
		if (typecheckFailure) throw new Error(typecheckFailure);
	} finally {
		await rm(directory, { recursive: true, force: true });
		expect(await fingerprint(), 'The consumer must not mutate workspace manifests or the root lockfile').toEqual(
			before,
		);
	}
}, 120000);

// This is deliberately written outside the workspace at runtime. Its only SDK import is the package export.
const consumerSource = String.raw`
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import type {
  WocliCli, CliHost, WoctlCommand, CliExecution, CliMcpHost,
  CliConfig, CliConfigStore, CliServiceConfig, ResolvedCliContext,
  ServiceProvider, ServiceRuntimeClient, ServiceCliBinding, ServiceCliDefinition,
} from 'woctl/node';

let configReads = 0;
const guard = (path: unknown) => {
  if (/(?:\.ya?ml$|(?:^|[/\\])\.env(?:\.|$))/i.test(String(path))) {
    configReads++;
    throw new Error('Consumer attempted to read configuration');
  }
};
const originalReadFile = fsp.readFile;
fsp.readFile = ((...args: Parameters<typeof originalReadFile>) => {
  guard(args[0]); return Reflect.apply(originalReadFile, fsp, args);
}) as typeof originalReadFile;
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = ((...args: Parameters<typeof originalReadFileSync>) => {
  guard(args[0]); return Reflect.apply(originalReadFileSync, fs, args);
}) as typeof originalReadFileSync;
const originalCallbackRead = fs.readFile;
fs.readFile = ((...args: Parameters<typeof originalCallbackRead>) => {
  guard(args[0]); return Reflect.apply(originalCallbackRead, fs, args);
}) as typeof originalCallbackRead;
syncBuiltinESMExports();
globalThis.fetch = async () => { throw new Error('External consumer must remain offline'); };
const signals = ['SIGINT', 'SIGTERM'] as const;
const listeners = signals.map((name) => process.listeners(name));
const sdk = await import('woctl/node');
signals.forEach((name, i) => assert.deepEqual(process.listeners(name), listeners[i]));
assert.equal(configReads, 0);
const { createCli, createNativeHost, createMemoryCliConfigStore, getNativeCommandOptions,
  defineServiceCliBinding, defineServiceOperation, createServiceProviderAdapter,
  CliUsageError, ServiceCliInputError, CliConfigError, parseCliConfig,
  createBuiltinProviders, createDefaultConfig, createCliCatalog, renderCliCatalog } = sdk;
assert.throws(() => getNativeCommandOptions(['--config']), CliUsageError);
assert.ok(new ServiceCliInputError('safe input error') instanceof CliUsageError);
assert.equal(typeof CliConfigError, 'function');
assert.equal(typeof createCliCatalog, 'function');
assert.ok(createBuiltinProviders().some((provider) => provider.name === 'linear'));
assert.ok(createDefaultConfig());
const missing = join(process.cwd(), 'missing.yaml');
assert.deepEqual(getNativeCommandOptions(['--config', missing, '--version']), { config: missing, argv: ['version'] });
const native: CliHost = createNativeHost({ config: missing });
assert.equal(configReads, 0);

let privateCalls = 0;
const operation = defineServiceOperation({
  capability: 'fetch',
  tool: { description: 'Private read', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }, annotations: { readOnlyHint: true } },
  input: { safeParse(value: unknown): { success: true; data: { url: string } } | { success: false } {
    if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string')
      return { success: true as const, data: { url: value.url } };
    return { success: false as const };
  } },
  invoke: (service, input, options) => service.fetch(input, options),
});
const provider: ServiceProvider = createServiceProviderAdapter({
  name: 'private-provider', title: 'Private fixture provider', provides: ['fetch'],
  operations: { read: operation },
  create: () => ({ fetch: { type: 'private-fixture', readOnly: true, async fetch(input) {
    privateCalls++;
    return { url: input.url, content: 'private-provider-result' };
  } } }),
});
interface PrivateClient { read(input: { url: string }): Promise<unknown> }
const definition: ServiceCliDefinition<PrivateClient> = {
  name: 'private-vault', description: 'Private binding command',
  commands: [{ name: 'read', description: 'Read private fixture',
    prepare: () => (client) => client.read({ url: 'https://fixture.invalid/private' }) }],
};
const binding: ServiceCliBinding = defineServiceCliBinding({ provider: { name: provider.name, provides: ['fetch'] }, definition });
// Compile-time negative contracts ensure the public types are effective rather than any.
// @ts-expect-error A host needs a config store.
const invalidHost: CliHost = { config: 'not-a-store' };
void invalidHost;
defineServiceCliBinding({ provider: { name: 'type-only-fixture', provides: ['fetch'] }, definition,
  // @ts-expect-error The binding factory must provide the definition's client.
  createClient: async () => ({ wrongMethod: async () => undefined }),
});
const config: CliConfig = parseCliConfig({ services: [
  { name: 'public-linear', type: 'linear' }, { name: 'private-service', type: provider.name },
] });
const store: CliConfigStore = createMemoryCliConfigStore(config);
const privateCommand: WoctlCommand = { name: 'private-local', description: 'Private local command',
  run: (_input, context: CliExecution) => context.stdout('private-local-result') };
const baseHost: CliHost = { ...native, config: store, env: {},
  getEnv: () => { throw new Error('Unexpected environment lookup'); } };
const baseline = createCli(baseHost).catalog();
const publicCalls: unknown[] = [];
const runtime: ServiceRuntimeClient = {
  async getSchema(input) {
    assert.equal(input.params.service, 'public-linear');
    return { tools: { getViewer: { inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } } } };
  },
  async call(input, options) {
    assert.equal(input.params.service, 'public-linear');
    assert.equal(input.body.toolName, 'getViewer');
    assert.deepEqual(input.body.input, {});
    assert.ok(options?.signal instanceof AbortSignal);
    publicCalls.push(input);
    return { id: 'viewer-fixture', name: 'Offline viewer' };
  },
};
const host: CliHost = { ...baseHost, runtime, providers: [provider], serviceCliBindings: [binding],
  commands: [...(native.commands ?? []), privateCommand] };
const cli: WocliCli = createCli(host);
const catalog = cli.catalog();
const originalLinear = baseline.commands.find((command) => command.name === 'linear');
assert.ok(originalLinear, 'Public Linear registration must land before this consumer test passes');
for (const command of baseline.commands)
  assert.deepEqual(catalog.commands.find((entry) => entry.name === command.name), command);
assert.deepEqual(catalog.commands.find((command) => command.name === 'linear'), originalLinear);
assert.ok(catalog.commands.some((command) => command.name === 'private-local'));
assert.ok(catalog.commands.some((command) => command.name === 'private-vault'));
assert.ok(catalog.providers.some((entry) => entry.name === 'linear'));
assert.ok(catalog.providers.some((entry) => entry.name === provider.name && entry.title === 'Private fixture provider'));
assert.ok(renderCliCatalog(catalog, { format: 'json' }).includes('private-vault'));
assert.equal(privateCalls, 0, 'Discovery must not execute private providers');
async function run(target: WocliCli, command: string) {
  const lines: string[] = [];
  await target.executeLine(command, { signal: new AbortController().signal, stdout: (line) => lines.push(line) });
  return lines.join('\n');
}
assert.deepEqual(JSON.parse(await run(cli, 'linear status --service public-linear --json')), { id: 'viewer-fixture', name: 'Offline viewer' });
await assert.rejects(() => run(cli, 'linear issue list --limit 101 --service public-linear --json'), ServiceCliInputError);
assert.equal(publicCalls.length, 1);
assert.equal(await run(cli, 'private-local'), 'private-local-result');
// The same host extension also executes through the real local service runtime.
const localCli = createCli({ ...host, runtime: undefined });
assert.deepEqual(JSON.parse(await run(localCli, 'private-vault read --service private-service --json')),
  { url: 'https://fixture.invalid/private', content: 'private-provider-result' });
assert.equal(privateCalls, 1);
assert.equal(configReads, 0);
signals.forEach((name, i) => assert.deepEqual(process.listeners(name), listeners[i]));
console.log(JSON.stringify({ imported: true, publicRead: true, privateCommand: true, privateBinding: true, configReads }));
`;
