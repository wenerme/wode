import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { type CliHost, createCli, createWoctlServiceCommand } from './createCli';

type FixtureClient = { echo(input: { size: number }): Promise<{ size: number }> };

function setup(host: Pick<CliHost, 'readBytes' | 'writeBytes'>) {
	return createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'fixture', type: 'fixture' }] }),
		...host,
		providers: [
			{
				name: 'fixture',
				create: () => ({
					getSchema: async () => ({
						tools: { echo: { inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } } },
					}),
					call: async (_tool: string, input: unknown) => input,
				}),
			},
		],
		commands: [
			createWoctlServiceCommand<FixtureClient>({
				name: 'fixture',
				description: 'Fixture service',
				commands: [
					{
						name: 'copy',
						description: 'Read bytes and write them back',
						options: [
							{ name: 'in', description: 'Input' },
							{ name: 'out', description: 'Output' },
						],
						async prepare(context) {
							const bytes = await context.readBytes!(String(context.options.in), { maxBytes: 16 });
							const out = String(context.options.out);
							return async (client, { signal }) => {
								await context.writeBytes!(out, bytes, { signal });
								return client.echo({ size: bytes.byteLength });
							};
						},
					},
				],
			}),
		],
	});
}

const io = () => {
	const stdout: string[] = [];
	return { stdout, io: { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) } };
};

it('routes binary @file input and file output through the host ports', async () => {
	const readBytes = vi.fn(async () => new Uint8Array([1, 2, 3]));
	const writeBytes = vi.fn(async () => undefined);
	const cli = setup({ readBytes, writeBytes });
	const { stdout, io: options } = io();
	await cli.executeLine('fixture copy --in @input.bin --out out.bin --json', options);
	expect(JSON.parse(stdout.at(-1)!)).toEqual({ size: 3 });
	expect(readBytes).toHaveBeenCalledWith('@input.bin', expect.objectContaining({ maxBytes: 16 }));
	expect(writeBytes).toHaveBeenCalledWith('out.bin', new Uint8Array([1, 2, 3]), expect.objectContaining({ signal: expect.any(AbortSignal) }));
});

it('rejects plain text as binary input and hosts without binary ports', async () => {
	const readBytes = vi.fn(async () => new Uint8Array([1]));
	const { io: options } = io();
	await expect(setup({ readBytes }).executeLine('fixture copy --in not-a-file --out o --json', options)).rejects.toThrow(
		'Binary input must be @file or - (stdin)',
	);
	expect(readBytes).not.toHaveBeenCalled();
	await expect(setup({}).executeLine('fixture copy --in @x --out o --json', options)).rejects.toThrow(
		'Host does not support binary file or stdin input',
	);
});
