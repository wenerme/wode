import { expect, it, vi } from 'vitest';
import { Cli, CliOutputOptions, splitCliCommandLine } from '@wener/common/cli';
import { createServiceCliCommand } from '@wener/common/service/cli';
import type { ServiceRuntimeClient } from '@wener/common/service/runtime';
import { BuiltinServiceCliBindings } from './cli';

it('describes built-in bindings without connecting services', () => {
	const metadata = BuiltinServiceCliBindings.map((binding) => binding.metadata);
	expect(metadata.map(({ provider }) => provider.name)).toEqual([
		'sql', 'redis', 'prometheus', 'grafana', 's3', 'linear', 'feishu', 'cls', 'telegram', 'google-analytics', 'powerdns', 'fs',
	]);
	expect(metadata.map(({ definition }) => definition.name)).toEqual([
		'sql', 'redis', 'prometheus', 'grafana', 's3', 'linear', 'feishu', 'cls', 'telegram', 'google-analytics', 'dns', 'fs',
	]);
	expect(metadata.map(({ provider }) => provider.provides)).toEqual([
		['sql'], ['redis'], ['prometheus'], ['grafana'], ['s3'], ['linear'], ['feishu'], ['cls'], ['telegram'], ['google-analytics'],
		['dns', 'powerdns'], ['fs'],
	]);
	expect(metadata.map(({ capability }) => capability)).toEqual([...Array(10).fill(undefined), 'dns', undefined]);
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
	const responses: Record<string, unknown> = {
		sql: { columns: [], rows: [], durationMs: 0 },
		redis: { success: true, durationMs: 0 },
		prometheus: { status: 'success', data: { resultType: 'vector', result: [] }, warnings: [] },
		grafana: { database: 'ok' },
		s3: [],
		linear: { id: 'fixture-user', name: 'Fixture User' },
		feishu: { code: 0, data: { message_id: 'fixture-message' } },
		cls: { Context: '', ListOver: true, RequestId: 'fixture-request', Results: [] },
		telegram: { ok: true, result: { id: 1, is_bot: true, first_name: 'Fixture' } },
		'google-analytics': { accountSummaries: [] },
		dns: { zones: [] },
		fs: [],
	};
	for (const binding of BuiltinServiceCliBindings) {
		const runtime: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({
				tools: {
					query: { inputSchema: {} },
					ping: { inputSchema: {} },
					getViewer: { inputSchema: {} },
					health: { inputSchema: {} },
					listObject: { inputSchema: {} },
					getObject: { inputSchema: {} },
					putObject: { inputSchema: {} },
					deleteObject: { inputSchema: {} },
					getMe: { inputSchema: {} },
					whoami: { inputSchema: {} },
					sendMessage: { inputSchema: {} },
					listTopic: { inputSchema: {} },
					listAccountSummaries: { inputSchema: {} },
					listZone: { inputSchema: {} },
					list: { inputSchema: {} },
				},
			})),
			call: vi.fn(async () => {
				const name = binding.metadata.definition.name;
				if (!Object.hasOwn(responses, name)) throw new Error(`Missing builtin response fixture for ${name}`);
				return responses[name];
			}),
		};
		await binding.register(async (definition, provider, createClient) => {
			if (!createClient) throw new Error('Missing built-in client factory');
			expect(runtime.getSchema).not.toHaveBeenCalled();
			const operation = definition.commands[0]!;
			const invoke = await operation.prepare({
				args: provider === 'sql' ? ['SELECT 1'] : provider === 'prometheus' ? ['up'] : provider === 'cls' ? ['*'] : provider === 's3' ? ['foo.txt'] : [],
				options: provider === 'feishu' ? { to: 'ou_test', text: 'hi', yes: true } : provider === 'cls' ? { topic: 'my-topic' } : {},
				readText: async (value) => value,
			});
			const client = await createClient(runtime, 'selected-service', { signal, readOnly: provider === 'feishu' ? false : true });
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
