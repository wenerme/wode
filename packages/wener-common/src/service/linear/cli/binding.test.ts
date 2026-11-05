import { describe, expect, test, vi } from 'vitest';
import { Cli, type CliContext } from '../../../cli/Cli';
import { createServiceCliCommand } from '../../cli/createServiceCliCommand';
import type { ServiceRuntimeClient } from '../../runtime/types';
import { LinearCliDefinition, LinearServiceCliBinding } from './index';

describe('Linear service CLI binding', () => {
	test('exports static, immutable metadata without connecting to a service', () => {
		expect(LinearServiceCliBinding.metadata.provider).toMatchObject({ name: 'linear', provides: ['linear'] });
		expect(LinearServiceCliBinding.metadata.definition.commands).toHaveLength(11);
		expect(LinearServiceCliBinding.metadata.definition.examples?.[0]?.command).toBe(
			'woctl linear status --service work',
		);
		expect(LinearServiceCliBinding.metadata.definition.examples).toHaveLength(5);
		expect(LinearServiceCliBinding.metadata.definition.commands[0]?.examples).toEqual([
			{ command: 'woctl linear status', description: 'Show the authenticated viewer.' },
		]);
		expect(structuredClone(LinearServiceCliBinding.metadata)).toEqual(LinearServiceCliBinding.metadata);
		expect(LinearServiceCliBinding.metadata.definition.commands[0]).not.toHaveProperty('prepare');
		expect(LinearServiceCliBinding.metadata.definition.commands[0]).not.toHaveProperty('table');
		expect(Object.isFrozen(LinearServiceCliBinding.metadata.definition)).toBe(true);
		expect(LinearCliDefinition.name).toBe('linear');
	});

	test('registers a typed factory and executes through the actual parser and runtime bridge', async () => {
		const viewer = { id: 'u', name: 'User' };
		const runtime: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({ tools: { getViewer: { inputSchema: { type: 'object' } } } })),
			call: vi.fn(async () => viewer),
		};
		const cli = new Cli('test');
		cli.add(
			LinearServiceCliBinding.register((definition, provider, factory) => {
				expect(provider).toBe('linear');
				expect(factory).toBeTypeOf('function');
				return createServiceCliCommand(definition, {
					readText: vi.fn(async (value) => value),
					async run(_operation, _options, context: CliContext, prepare) {
						const invoke = await prepare();
						const client = await factory!(runtime, 'example', { readOnly: true, signal: context.signal });
						context.stdout(JSON.stringify(await invoke(client, { signal: context.signal })));
					},
				});
			}),
		);
		const context = { stdout: vi.fn(), signal: new AbortController().signal };
		cli.describe();
		await cli.execute(['linear', 'status', '--help'], context);
		expect(runtime.getSchema).not.toHaveBeenCalled();
		expect(runtime.call).not.toHaveBeenCalled();
		await cli.execute(['linear', 'status'], context);
		expect(runtime.getSchema).toHaveBeenCalledExactlyOnceWith(
			{ params: { service: 'example' } },
			{ readOnly: true, signal: context.signal },
		);
		expect(runtime.call).toHaveBeenCalledExactlyOnceWith(
			{ params: { service: 'example' }, body: { toolName: 'getViewer', input: {} } },
			{ signal: expect.any(AbortSignal) },
		);
		expect(context.stdout).toHaveBeenLastCalledWith(JSON.stringify(viewer));
	});
});
