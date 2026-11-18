import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { createCli, createWoctlServiceCommand } from './createCli';

type FixtureClient = { apply(input: { dryRun?: boolean }): Promise<unknown> };

function setup() {
	const call = vi.fn(async (_tool: string, input: unknown) => ({ applied: !(input as { dryRun?: boolean }).dryRun }));
	const cli = createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'fixture', type: 'fixture' }] }),
		providers: [
			{
				name: 'fixture',
				create: () => ({
					getSchema: async () => ({
						tools: {
							apply: {
								inputSchema: { type: 'object' },
								annotations: { readOnlyHint: false, destructiveHint: true, supportsDryRun: true },
							},
							request: { inputSchema: { type: 'object' }, annotations: { readOnlyHint: false } },
						},
					}),
					call,
				}),
			},
		],
		commands: [
			createWoctlServiceCommand<FixtureClient>({
				name: 'fixture',
				description: 'Fixture service',
				commands: [
					{
						name: 'apply',
						description: 'Apply a change',
						mutating: true,
						supportsDryRun: true,
						options: [{ name: 'dry-run', type: 'boolean', description: 'Preview only' }],
						prepare: ({ options }) => (client) => client.apply(options['dry-run'] === true ? { dryRun: true } : {}),
					},
				],
			}),
		],
	});
	return { cli, call };
}

it('lets a declared dry-run through a read-only service and still blocks the real write', async () => {
	const { cli, call } = setup();
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	await cli.executeLine('fixture apply --dry-run --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual({ applied: false });
	expect(call).toHaveBeenCalledTimes(1);
	await expect(cli.executeLine('fixture apply --json', io)).rejects.toThrow('Selected service is read-only');
	expect(call).toHaveBeenCalledTimes(1);
});
