import { expect, it, vi } from 'vitest';
import { Cli, CliOutputOptions, splitCliCommandLine } from '../../cli';
import { createServiceCliCommand } from '../cli';
import type { ServiceRuntimeClient } from '../runtime/types';
import { BuiltinServiceCliBindings } from './cli';

it('describes built-in bindings without connecting services', () => {
	const metadata = BuiltinServiceCliBindings.map((binding) => binding.metadata);
	expect(metadata.map(({ provider }) => provider.name)).toEqual(['sql', 'redis', 'prometheus', 'grafana', 'linear']);
	expect(metadata.map(({ provider }) => provider.provides)).toEqual([['sql'], ['redis'], ['prometheus'], ['grafana'], ['linear']]);
	expect(metadata[0]?.provider.aliases).toContain('postgresql');
	expect(metadata[1]?.definition.aliases).toContain('valkey');
	expect(metadata[2]?.definition.aliases).toContain('prom');
	expect(structuredClone(metadata)).toStrictEqual(metadata);
	expect(JSON.parse(JSON.stringify(metadata))).toStrictEqual(metadata);
	const cli = new Cli('woctl');
	for (const binding of BuiltinServiceCliBindings) {
		expect(binding.metadata.definition.examples?.length).toBeGreaterThan(0);
		expect(binding.metadata.definition.commands.some((command) => command.examples?.length)).toBe(true);
		binding.register((definition, provider) => {
			expect(binding.metadata.provider.name).toBe(provider);
			expect(binding.metadata.definition.description).toBe(definition.description);
			expect(binding.metadata.definition.commands.map(({ name, description }) => ({ name, description }))).toEqual(
				definition.commands.map(({ name, description }) => ({ name, description })),
			);
		});
		cli.add(
			binding.register((definition) =>
				createServiceCliCommand(definition, {
					readText: vi.fn(async (value) => value),
					run: vi.fn(async () => undefined),
				}),
			),
		);
	}
	expect(cli.describe().map((command) => command.examples)).toEqual(
		metadata.map(({ definition }) => definition.examples),
	);
});

it('parses and prepares every built-in example without creating a client', async () => {
	for (const binding of BuiltinServiceCliBindings) {
		const prepare = vi.fn();
		const cli = new Cli('woctl', { options: CliOutputOptions });
		cli.add(
			binding.register((definition) =>
				createServiceCliCommand(definition, {
					options: [{ name: 'service', description: 'Select a configured service' }],
					readText: async (value) => value,
					async run(_operation, _options, _context, prepareOperation) {
						await prepareOperation();
						prepare();
					},
				}),
			),
		);
		for (const example of binding.metadata.definition.examples ?? []) {
			await cli.execute(splitCliCommandLine(example.command).slice(1), {
				stdout: vi.fn(),
				signal: new AbortController().signal,
			});
		}
		expect(prepare).toHaveBeenCalledTimes(binding.metadata.definition.examples?.length ?? 0);
	}
});

it('reuses the typed tool clients and forwards the selected service and abort signal', async () => {
	const signal = new AbortController().signal;
	for (const binding of BuiltinServiceCliBindings) {
		const runtime: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({
				tools: {
					query: { inputSchema: {} },
					ping: { inputSchema: {} },
					getViewer: { inputSchema: {} },
					health: { inputSchema: {} },
				},
			})),
			call: vi.fn(async () => ({ success: true, status: 'success', data: { resultType: 'vector', result: [] } })),
		};
		await binding.register(async (definition, provider, createClient) => {
			if (!createClient) throw new Error('Missing built-in client factory');
			expect(runtime.getSchema).not.toHaveBeenCalled();
			const operation = definition.commands[0]!;
			const invoke = await operation.prepare({
				args: provider === 'sql' ? ['SELECT 1'] : provider === 'prometheus' ? ['up'] : [],
				options: {},
				readText: async (value) => value,
			});
			const client = await createClient(runtime, 'selected-service', { signal, readOnly: true });
			await invoke(client, { signal });
			expect(runtime.getSchema).toHaveBeenCalledWith(
				{ params: { service: 'selected-service' } },
				expect.objectContaining({ signal }),
			);
			expect(runtime.call).toHaveBeenCalledWith(
				expect.objectContaining({ params: { service: 'selected-service' } }),
				expect.objectContaining({ signal: expect.any(AbortSignal) }),
			);
		});
	}
});
