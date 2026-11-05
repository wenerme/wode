import type { ServiceProvider } from '@wener/common/service';
import { defineServiceCliBinding, type ServiceCliClientFactory, type ServiceCliDefinition } from '@wener/common/service/cli';
import Ajv2020 from 'ajv/dist/2020.js';
import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { CliCatalogJsonSchema } from './catalog';
import { createCli } from './createCli';

function output() {
	const stdout: string[] = [];
	return { stdout, io: { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) } };
}

it('exports a complete catalog and help without loading configuration or creating clients', async () => {
	const load = vi.fn(async () => { throw new Error('Config load forbidden'); });
	const getEnv = vi.fn(() => { throw new Error('Secret resolution forbidden'); });
	const fetch = vi.fn<typeof globalThis.fetch>(async () => { throw new Error('Network forbidden'); });
	const sqlDriver = vi.fn(async () => { throw new Error('Driver creation forbidden'); });
	const env = new Proxy({}, { get() { throw new Error('Environment access forbidden'); } });
	const cli = createCli({ config: { load, save: async () => undefined }, env, getEnv, fetch, sqlDriver });
	const catalog = cli.catalog();
	expect(catalog.commands.map((command) => command.name)).toEqual(expect.arrayContaining(['sql', 'redis', 'prometheus', 'search', 'fetch', 'catalog']));
	expect(catalog.globalOptions.some((option) => option.name === 'help')).toBe(true);
	expect(catalog.providers.find((provider) => provider.name === 'sql')?.optionsSchema).toMatchObject({ properties: { dialect: { type: 'string' } } });
	expect(catalog.commands.find((command) => command.name === 'mcp')?.availability).toEqual({ hostCapability: 'mcp' });
	expect(catalog.commands.find((command) => command.name === 'sql')?.examples?.length).toBeGreaterThan(0);
	const validate = new Ajv2020({ strict: true }).compile(CliCatalogJsonSchema);
	expect(validate(catalog), JSON.stringify(validate.errors)).toBe(true);
	const listed = output();
	await cli.executeLine('catalog --output json', listed.io);
	expect(JSON.parse(listed.stdout.join(''))).toEqual(JSON.parse(JSON.stringify(catalog)));
	await cli.executeLine('catalog --help', output().io);
	expect(load).not.toHaveBeenCalled();
	expect(getEnv).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
	expect(sqlDriver).not.toHaveBeenCalled();
	await expect(cli.describe()).rejects.toThrow('Environment access forbidden');
});

it('writes a filtered Markdown export only after validation and keeps static exports isolated', async () => {
	const load = vi.fn(async () => { throw new Error('Config load forbidden'); });
	const writeText = vi.fn(async () => undefined);
	const cli = createCli({ config: { load, save: async () => undefined }, writeText });
	const snapshot = cli.catalog();
	Reflect.set(snapshot.providers[0], 'name', 'changed');
	expect(cli.catalog().providers[0].name).not.toBe('changed');
	await expect(cli.executeLine('catalog -o invalid --output-file out.md', output().io)).rejects.toThrow('Supported catalog output formats');
	await expect(cli.executeLine('catalog --service-type missing --output-file out.md', output().io)).rejects.toThrow('Unknown catalog service type');
	expect(writeText).not.toHaveBeenCalled();
	const exported = output();
	await cli.executeLine('catalog --service-type pg --output md --output-file sql.md', exported.io);
	expect(writeText).toHaveBeenCalledWith('sql.md', expect.stringContaining('SQL'), { signal: exported.io.signal });
	expect(exported.stdout).toHaveLength(0);
	expect(load).not.toHaveBeenCalled();
});

it('registers an injected typed CLI binding without changing the application command assembler', async () => {
	const close = vi.fn(async () => undefined);
	const result = { message: 'registered' };
	const tool = { inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } };
	const create = vi.fn<ServiceProvider['create']>(() => ({ getSchema: async () => ({ tools: { read: tool } }), call: async () => result, close }));
	const provider: ServiceProvider = { name: 'widget', aliases: ['wgt'], capabilities: ['widget'], tools: { read: tool }, create };
	type Widget = { read(input: object): Promise<unknown> };
	const definition: ServiceCliDefinition<Widget> = {
		name: 'widget', aliases: ['wdg'], description: 'A registered fixture',
		examples: [{ command: 'woctl widget read' }],
		commands: [{ name: 'read', description: 'Read the fixture', prepare: () => (client) => client.read({}) }],
	};
	const createClient = vi.fn<ServiceCliClientFactory<Widget>>(async (runtime, service, _options) => ({ read: (input: object) => runtime.call({ params: { service }, body: { toolName: 'read', input } }) }));
	const binding = defineServiceCliBinding({ provider: { name: 'widget', aliases: ['wgt'], provides: ['widget'] }, definition, createClient });
	const cli = createCli({ config: createMemoryCliConfigStore({ services: [{ name: 'example', type: 'wgt' }] }), providers: [provider], serviceCliBindings: [binding] });
	expect(cli.catalog().commands.find((command) => command.name === 'widget')?.availability).toEqual({ serviceProvider: 'widget' });
	expect(create).not.toHaveBeenCalled();
	expect(createClient).not.toHaveBeenCalled();
	const read = output();
	await cli.executeLine('wdg read --json', read.io);
	expect(JSON.parse(read.stdout.join(''))).toEqual(result);
	expect(createClient).toHaveBeenCalledWith(expect.any(Object), 'example', { readOnly: true, signal: read.io.signal });
	expect(create).toHaveBeenCalledTimes(1);
	expect(close).toHaveBeenCalledTimes(1);
});

it('requires an MCP host capability even if a service happens to be named mcp', async () => {
	const cli = createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'fixture', type: 'mcp' }] }),
		providers: [{ name: 'mcp', create: () => { throw new Error('Must not create a client'); } }],
	});
	expect((await cli.describe()).some((command) => command.name === 'mcp')).toBe(false);
	await expect(cli.executeLine('mcp tools', output().io)).rejects.toThrow('Unknown command');
});
