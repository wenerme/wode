import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Cli, type CliOption, CliUsageError } from '@wener/common/cli';
import type { ServiceProvider } from '@wener/common/service';
import Ajv2020 from 'ajv/dist/2020.js';
import { expect, it, vi } from 'vitest';
import {
	createCliCatalog,
	describeServiceProvider,
	formatServiceProviderTypeScript,
	renderCliCatalog,
	type CliCatalog,
	CliCatalogJsonSchema,
	type CliCatalogProvider,
} from './catalog';
import { createCatalogCommand } from './commands/catalog';
import { createBuiltinProviders } from './core';
import type { WoctlCommand, CliExecution } from './createCli';

function fixture() {
	const forbidden = vi.fn(() => { throw new Error('Unexpected runtime side effect'); });
	const providers: ServiceProvider[] = [
		{ name: 'duckduckgo', aliases: ['ddg'], capabilities: ['search'], create: forbidden },
		{
			name: 'exa', aliases: ['exa-search'], capabilities: ['search'], create: forbidden,
			title: 'Exa', description: 'Static search provider', documentationUrl: 'https://example.test/docs',
			examples: [{ command: 'woctl search example', description: 'Search example' }],
			optionsSchema: { safeParse: forbidden, jsonSchema: { type: 'object', properties: { limit: { type: 'integer', default: 10 } } } },
			contract: { methods: { search: { description: 'Search', inputSchema: { type: 'object' }, outputSchema: { type: 'string' }, outputType: 'number' } } },
			tools: { search: { inputSchema: { type: 'object' }, outputSchema: { type: 'string' } } },
		},
		{ name: 'http', create: forbidden },
	];
	const globals: CliOption[] = [{ name: 'json', type: 'boolean', description: 'JSON output', default: false }];
	const raw = new Cli<CliExecution>('woctl', { options: globals });
	const registrations: { command: WoctlCommand }[] = [];
	const add = (command: WoctlCommand) => { registrations.push({ command }); raw.add(command); };
	const merge = (command: WoctlCommand) => { registrations.push({ command }); raw.merge(command); };
	add({ name: 'version', description: 'Version', run: forbidden });
	add({ name: 'search', description: 'Capability search', serviceCapability: 'search', run: forbidden });
	add({ name: 'duckduckgo', aliases: ['ddg'], description: 'DDG only', serviceProvider: 'ddg', commands: [
		{ name: 'search', aliases: ['s'], description: 'DDG search', run: forbidden },
	] });
	merge({ name: 'ddg', description: 'Merge by root alias', commands: [
		{ name: 's', description: 'Merge by child alias', serviceCapability: 'search' },
		{ name: 'news', description: 'DDG news', run: forbidden },
	] });
	add({ name: 'tools', description: 'Mixed commands', commands: [
		{ name: 'local', description: 'Local tool', run: forbidden },
	] });
	merge({ name: 'tools', description: 'Mixed commands', commands: [
		{ name: 'exa', description: 'Exa only', serviceProvider: 'exa-search', run: forbidden },
	] });
	let catalog: CliCatalog;
	add(createCatalogCommand({ catalog: () => catalog }));
	const input = { name: 'woctl', version: 'test', globalOptions: globals, commands: raw.describe(), providers, registrations };
	catalog = createCliCatalog(input);
	return { catalog, input, raw, forbidden, providers, globals };
}

it('snapshots the complete raw tree, merges canonical metadata and never touches runtime hooks', () => {
	const { catalog, input, forbidden, providers, globals } = fixture();
	const forbiddenGetter = { get() { throw new Error('Runtime state was inspected'); } };
	for (const name of ['env', 'getEnv', 'config', 'fetch', 'mcp']) Object.defineProperty(input, name, forbiddenGetter);
	Object.defineProperty(providers[0], 'secret', forbiddenGetter);
	const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(forbidden);
	try {
		const snapshot = createCliCatalog(input);
		expect(snapshot).toEqual(catalog);
		expect(snapshot.commands.map((command) => command.name)).toContain('catalog');
		const ddg = snapshot.commands.find((command) => command.name === 'duckduckgo')!;
		expect(ddg.commands?.map((command) => command.name)).toEqual(['search', 'news']);
		expect(ddg.commands?.[0].availability).toEqual({ serviceProvider: 'ddg', serviceCapability: 'search' });
		expect(ddg.commands?.[1].availability).toEqual({ serviceProvider: 'ddg' });
		expect(JSON.stringify(snapshot)).not.toMatch(/runRaw|prepare|safeParse|secret|"run"|"create"/u);
		expect(snapshot.providers.find((provider) => provider.name === 'http')).toEqual({ name: 'http' });
		const exa = snapshot.providers[1];
		(exa.optionsSchema!.properties as Record<string, unknown>).limit = { type: 'boolean' };
		exa.contract!.methods.search.description = 'changed';
		exa.tools!.search.inputSchema.type = 'string';
		(snapshot.globalOptions[0] as CliOption).description = 'changed';
		expect(providers[1].optionsSchema!.jsonSchema!.properties).toEqual({ limit: { type: 'integer', default: 10 } });
		expect(providers[1].contract!.methods.search.description).toBe('Search');
		expect(providers[1].tools!.search.inputSchema.type).toBe('object');
		expect(globals[0].description).toBe('JSON output');
		expect(forbidden).not.toHaveBeenCalled();
	} finally { fetch.mockRestore(); }
});

it('filters by canonical provider and alias without treating DDG commands as Exa commands', () => {
	const { catalog } = fixture();
	const exa = JSON.parse(renderCliCatalog(catalog, { format: 'json', serviceType: 'exa-search' })) as CliCatalog;
	expect(exa.providers.map((provider) => provider.name)).toEqual(['exa']);
	expect(exa.commands.map((command) => command.name)).toEqual(['search', 'tools']);
	expect(exa.commands[1].commands?.map((command) => command.name)).toEqual(['exa']);
	const ddg = JSON.parse(renderCliCatalog(catalog, { format: 'json', serviceType: 'ddg' })) as CliCatalog;
	expect(ddg.commands.map((command) => command.name)).toEqual(['search', 'duckduckgo']);
	expect(ddg.commands[1].commands?.map((command) => command.name)).toEqual(['search', 'news']);
	expect(() => renderCliCatalog(catalog, { format: 'json', serviceType: 'missing' })).toThrow(CliUsageError);
});

it('exports a versioned catalog document schema that validates actual fixture and builtin catalogs', () => {
	const { catalog, input } = fixture();
	const validate = new Ajv2020({ strict: true }).compile(CliCatalogJsonSchema);
	for (const document of [catalog, createCliCatalog({ ...input, providers: createBuiltinProviders() })]) {
		expect(validate(JSON.parse(renderCliCatalog(document, { format: 'json' }))), JSON.stringify(validate.errors)).toBe(true);
	}
	expect(validate({ ...catalog, schemaVersion: 2 })).toBe(false);
	expect(validate({ ...catalog, nativeConfig: {} })).toBe(false);
	expect(JSON.parse(renderCliCatalog(catalog, { format: 'jsonschema' }))).toEqual(CliCatalogJsonSchema);
});

it('renders stable Markdown with static metadata, defaults, schemas, contracts and tools', () => {
	const { catalog } = fixture();
	catalog.commands = [...catalog.commands, {
		name: 'example', aliases: ['eg'], description: 'Example command', arguments: '<query>',
		usage: '<query>', examples: [{ command: 'woctl example demo' }],
		options: [{ name: 'limit', aliases: ['l'], description: 'Limit | count', default: '10' }],
	}];
	const markdown = renderCliCatalog(catalog, { format: 'md' });
	expect(markdown).toBe(renderCliCatalog(catalog, { format: 'md' }));
	for (const text of ['## Global options', '## Commands', 'woctl example <query>', 'woctl example demo', 'Aliases:', 'Availability:', 'Limit \\| count', '"10"', 'Provider options schema:', '#### Contract', '#### Static tools', 'inputSchema:', 'outputSchema:', 'Static search provider', 'https://example.test/docs', 'Search example']) expect(markdown).toContain(text);
	const http = renderCliCatalog(catalog, { format: 'md', serviceType: 'http' });
	expect(http).not.toContain('inputSchema:');
	expect(http).not.toContain('outputSchema:');
	expect(http).not.toContain('Provider options schema:');
});

it('describes raw Zod provider options with the shared helper and retains supplied metadata', () => {
	const providers = createBuiltinProviders();
	for (const name of ['sql', 'exa']) {
		const provider = providers.find((entry) => entry.name === name)!;
		expect(provider).toBeDefined();
		expect(describeServiceProvider(provider).optionsSchema?.type).toBe('object');
	}
	const exa = describeServiceProvider(fixture().providers[1]);
	expect(exa.title).toBe('Exa');
	expect(exa.examples).toEqual([{ command: 'woctl search example', description: 'Search example' }]);
});

it('emits standalone declarations for every builtin provider and for their combined catalog', async () => {
	const { input } = fixture();
	const providers = createBuiltinProviders().map(describeServiceProvider);
	for (const provider of providers) {
		const source = formatServiceProviderTypeScript(provider);
		await assertTypechecks(source);
	}
	const source = renderCliCatalog(createCliCatalog({ ...input, providers: createBuiltinProviders() }), { format: 'typescript' });
	expect(source).toContain('OpenObserveService');
	expect(source).toContain('RedisService');
	expect(source).toContain('SqlService');
	await assertTypechecks(source);
}, 120000);

it('escapes arbitrary provider/method names and comments, prefers outputType, and supports static tools', async () => {
	const provider: CliCatalogProvider = {
		name: '123-a*/b', optionsSchema: { type: 'object', properties: { 'a-b': { type: 'string', description: 'Field */ description' } } },
		contract: { methods: { 'search-docs*/': { description: 'Method */\n description', inputSchema: { type: 'string' }, outputType: 'number', outputSchema: { type: 'boolean' } } } },
	};
	const source = formatServiceProviderTypeScript(provider);
	expect(source).toContain('Provider123ABService');
	expect(source).toContain('"search-docs*/"(input: string): Promise<number>');
	expect(source).toContain('Method * /  description');
	expect(source).toContain('Field * / description');
	await assertTypechecks(source);
	await assertTypechecks(formatServiceProviderTypeScript({ name: '...', tools: { 'say-hi': { inputSchema: { type: 'object' }, outputSchema: { type: 'boolean' } } } }));
	expect(formatServiceProviderTypeScript({ name: 'http' })).toBe('');
});

it.each([
	{ enum: [{ a: 1 }, { b: 2 }] },
	{ type: ['object', 'null'], properties: { a: { type: 'string' } } },
	{ type: 'object', anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }] },
	{ type: 'object', $defs: { choice: { enum: [{ a: 1 }, { b: 2 }] } }, $ref: '#/$defs/choice' },
])('compiles compound options schemas as type aliases: %j', async (optionsSchema) => {
	const source = formatServiceProviderTypeScript({ name: 'custom', optionsSchema });
	expect(source).toContain('export type CustomServiceOptions =');
	await assertTypechecks(source);
});

it('keeps colliding sanitized provider names compilable in a combined export', async () => {
	const { catalog } = fixture();
	catalog.providers = [
		{ name: 'a-b', optionsSchema: { type: 'string' } },
		{ name: 'a_b', optionsSchema: { type: 'number' } },
	];
	const source = renderCliCatalog(catalog, { format: 'typescript' });
	expect(source).toContain('export namespace CatalogProvider1');
	expect(source).toContain('export namespace CatalogProvider2');
	await assertTypechecks(source);
});

function execution(writeText = vi.fn(async () => {})): CliExecution {
	return {
		signal: new AbortController().signal,
		stdout: vi.fn(), stderr: vi.fn(),
		host: { config: { load: vi.fn(() => { throw new Error('Unexpected config load'); }) }, writeText },
	} as unknown as CliExecution;
}

it('lazily renders after registrations, supports stdout/--output-file, aliases, --json and help', async () => {
	const { catalog } = fixture();
	const callback = vi.fn(() => catalog);
	const cli = new Cli<CliExecution>('woctl');
	cli.add(createCatalogCommand({ catalog: callback }));
	expect(callback).not.toHaveBeenCalled();
	const context = execution();
	await cli.execute(['catalog', '--help'], context);
	expect(callback).not.toHaveBeenCalled();
	expect(context.stdout).toHaveBeenLastCalledWith(expect.stringContaining('not the complete native config file schema'));
	await cli.execute(['catalog', '--json'], context);
	expect(context.stdout).toHaveBeenLastCalledWith(renderCliCatalog(catalog, { format: 'json' }));
	await cli.execute(['catalog', '-o', 'md', '--service-type', 'exa-search', '--output-file', 'catalog.md'], context);
	expect(context.host.writeText).toHaveBeenCalledWith('catalog.md', renderCliCatalog(catalog, { format: 'md', serviceType: 'exa-search' }), { signal: context.signal });
	expect(context.host.config.load).not.toHaveBeenCalled();
});

it.each([
	['--output', 'yaml'], ['--format', 'name'], ['--format', 'json(name)'],
	['--json', '--output', 'md'], ['--service-type', 'unknown'],
])('rejects unsupported export selection before writing files: %j', async (...flags) => {
	const { catalog } = fixture();
	const cli = new Cli<CliExecution>('woctl');
	cli.add(createCatalogCommand({ catalog: () => catalog }));
	const context = execution();
	await expect(cli.execute(['catalog', ...flags, '--output-file', 'no-write'], context)).rejects.toBeInstanceOf(CliUsageError);
	expect(context.host.writeText).not.toHaveBeenCalled();
	expect(context.stdout).not.toHaveBeenCalled();
});

it('checks output host support and cancellation before calling the catalog callback', async () => {
	const callback = vi.fn(() => fixture().catalog);
	const cli = new Cli<CliExecution>('woctl');
	cli.add(createCatalogCommand({ catalog: callback }));
	const unsupported = execution();
	delete unsupported.host.writeText;
	await expect(cli.execute(['catalog', '--output-file', 'missing.txt'], unsupported)).rejects.toBeInstanceOf(CliUsageError);
	const cancelled = execution();
	cancelled.signal = AbortSignal.abort();
	await expect(cli.execute(['catalog', '--output-file', 'cancelled.txt'], cancelled)).rejects.toThrow();
	expect(cancelled.host.writeText).not.toHaveBeenCalled();
	expect(callback).not.toHaveBeenCalled();
});

async function assertTypechecks(source: string) {
	const directory = await mkdtemp(join(tmpdir(), 'woctl-catalog-'));
	try {
		const filename = join(directory, 'declarations.ts');
		await writeFile(filename, source);
		const compiler = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));
		await promisify(execFile)(process.execPath, [compiler, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', filename], { timeout: 30000 }).catch((error: { stdout?: string; stderr?: string }) => { throw new Error(`${error.stdout ?? ''}${error.stderr ?? ''}`); });
	} finally { await rm(directory, { recursive: true, force: true }); }
}
