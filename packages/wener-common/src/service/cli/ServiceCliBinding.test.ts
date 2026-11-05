import { expect, it, vi } from 'vitest';
import { Cli, type CliContext } from '../../cli';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createServiceCliCommand } from './createServiceCliCommand';
import { defineServiceCliBinding, type ServiceCliBinding } from './ServiceCliBinding';
import type { ServiceCliDefinition } from './ServiceCliDefinition';

interface TextClient {
	read(): Promise<string>;
}

const definition: ServiceCliDefinition<TextClient> = {
	name: 'custom',
	aliases: ['text'],
	description: 'Read text',
	examples: [{ command: 'test custom read', description: 'Read a value' }],
	commands: [{ name: 'read', description: 'Read', prepare: () => (client) => client.read() }],
};

it('keeps a definition paired with its factory through a heterogeneous visitor', async () => {
	const runtime: ServiceRuntimeClient = {
		getSchema: vi.fn(async () => ({ tools: {} })),
		call: vi.fn(async () => undefined),
	};
	const signal = new AbortController().signal;
	const createClient = vi.fn(async () => ({ read: async () => 'hello' }));
	const numberDefinition: ServiceCliDefinition<{ count(): Promise<number> }> = {
		name: 'counter',
		description: 'Count values',
		commands: [{ name: 'read', description: 'Count', prepare: () => (client) => client.count() }],
	};
	const bindings: readonly ServiceCliBinding[] = [
		defineServiceCliBinding({ provider: { name: 'text-provider', provides: ['text'] }, definition, createClient }),
		defineServiceCliBinding({
			provider: { name: 'counter-provider', provides: ['count'] },
			definition: numberDefinition,
			createClient: async () => ({ count: async () => 42 }),
		}),
	];
	const cli = new Cli<CliContext>('test');
	for (const binding of bindings) {
		cli.add(
			binding.register((definition, provider, factory) =>
				createServiceCliCommand(definition, {
					readText: async (value) => value,
					async run(_operation, _options, context: CliContext, prepare) {
						if (!factory) throw new Error('A client factory is required');
						const invoke = await prepare();
						const client = await factory(runtime, `${provider}-service`, { readOnly: true, signal: context.signal });
						context.stdout(JSON.stringify(await invoke(client, { signal: context.signal })));
					},
				}),
			),
		);
	}
	expect(createClient).not.toHaveBeenCalled();
	expect(runtime.getSchema).not.toHaveBeenCalled();
	expect(cli.describe().map((command) => command.name)).toEqual(['custom', 'counter']);
	const stdout = vi.fn();
	await cli.execute(['text', 'read', '--help'], { stdout, signal });
	expect(createClient).not.toHaveBeenCalled();
	await cli.execute(['text', 'read'], { stdout, signal });
	expect(createClient).toHaveBeenCalledWith(runtime, 'text-provider-service', { readOnly: true, signal });
	expect(stdout).toHaveBeenLastCalledWith('"hello"');
	await cli.execute(['counter', 'read'], { stdout, signal });
	expect(stdout).toHaveBeenLastCalledWith('42');
});

it('exports only static metadata and snapshots nested options and examples', () => {
	const createClient = vi.fn(async () => ({ read: async () => 'hello' }));
	const example = { command: 'test custom read', description: 'Read', extra: () => undefined };
	const option = { name: 'verbose', description: 'Verbose output', extra: () => undefined };
	const source = {
		...definition,
		examples: [example],
		options: [option],
		commands: [{ ...definition.commands[0]!, examples: [example], options: [option], mutating: false }],
		extra: () => undefined,
	};
	const binding = defineServiceCliBinding({
		provider: { name: 'text-provider', aliases: ['txt'], provides: ['text'] },
		definition: source,
		createClient,
	});
	const metadata = binding.metadata;
	expect(structuredClone(metadata)).toStrictEqual(metadata);
	expect(JSON.parse(JSON.stringify(metadata))).toStrictEqual(metadata);
	expect(metadata.provider).toEqual({ name: 'text-provider', aliases: ['txt'], provides: ['text'] });
	expect(metadata.definition).not.toHaveProperty('extra');
	expect(metadata.definition.commands[0]).not.toHaveProperty('prepare');
	expect(metadata.definition.commands[0]).not.toHaveProperty('table');
	expect(metadata.definition.examples?.[0]).not.toHaveProperty('extra');
	expect(metadata.definition.options?.[0]).not.toHaveProperty('extra');
	example.command = 'changed';
	option.description = 'changed';
	expect(metadata.definition.examples?.[0]?.command).toBe('test custom read');
	expect(metadata.definition.options?.[0]?.description).toBe('Verbose output');
	expect(createClient).not.toHaveBeenCalled();
});

it('uses one immutable definition for metadata, registration and later execution', async () => {
	const operation = { name: 'read', description: 'Original operation', mutating: false, prepare: () => (client: TextClient) => client.read() };
	const source = { name: 'original', description: 'Original definition', commands: [operation] };
	const binding = defineServiceCliBinding({ provider: { name: 'text', provides: ['text'] }, definition: source, createClient: async () => ({ read: async () => 'original' }) });
	source.name = 'changed';
	operation.mutating = true;
	operation.prepare = () => async () => 'changed';
	const runtime: ServiceRuntimeClient = { getSchema: async () => ({ tools: {} }), call: async () => undefined };
	const cli = new Cli<CliContext>('test');
	cli.add(binding.register((definition, _provider, factory) => {
		expect(definition.name).toBe(binding.metadata.definition.name);
		expect(definition.commands[0]?.mutating).toBe(false);
		expect(Reflect.set(definition.commands[0]!, 'mutating', true)).toBe(false);
		return createServiceCliCommand(definition, {
			readText: async (value) => value,
			async run(operation, _options, context: CliContext, prepare) {
				expect(operation.mutating).toBe(false);
				const invoke = await prepare();
				const client = await factory!(runtime, 'fixture', { readOnly: true, signal: context.signal });
				context.stdout(String(await invoke(client, { signal: context.signal })));
			},
		});
	}));
	operation.prepare = () => async () => 'changed-after-registration';
	const stdout = vi.fn();
	await cli.execute(['original', 'read'], { stdout, signal: new AbortController().signal });
	expect(stdout).toHaveBeenCalledWith('original');
});

it('allows the host to supply its default client factory', () => {
	const binding = defineServiceCliBinding({ provider: { name: 'custom', provides: ['text'] }, definition });
	expect(binding.register((_definition, provider, factory) => ({ provider, factory }))).toEqual({
		provider: 'custom',
		factory: undefined,
	});
});

it('rejects a client factory with the wrong service type at compile time', () => {
	defineServiceCliBinding({
		provider: { name: 'custom', provides: ['text'] },
		definition,
		// @ts-expect-error The definition requires TextClient, not a counter client.
		createClient: async () => ({ count: async () => 42 }),
	});
});
