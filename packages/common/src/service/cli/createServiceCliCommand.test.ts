import { Cli, type CliContext } from '@wener/common/cli';
import { expect, it, vi } from 'vitest';
import { createServiceCliCommand } from './createServiceCliCommand';

it('prepares arguments before creating the client and shares grouped operations', async () => {
	const call = vi.fn(async (input: string) => ({ text: input }));
	const createClient = vi.fn(() => ({ call }));
	const readText = vi.fn(async (value: string) => value);
	const cli = new Cli<CliContext>('test');
	cli.add(
		createServiceCliCommand(
			{
				name: 'example',
				description: 'example service',
				commands: [
					{
						name: 'echo',
						group: 'text',
						arguments: '<value>',
						description: 'echo input',
						async prepare({ args, readText }) {
							if (args[0] === 'invalid') throw new Error('Invalid value');
							const value = await readText(args[0]);
							return (client: { call(input: string): Promise<unknown> }) => client.call(value);
						},
					},
				],
			},
			{
				readText,
				async run(_operation, _options, context: CliContext, prepare) {
					const invoke = await prepare();
					context.stdout(JSON.stringify(await invoke(createClient(), {})));
				},
			},
		),
	);
	const stdout = vi.fn();
	const context = { signal: new AbortController().signal, stdout };
	await cli.execute(['example', 'text', 'echo', '--help'], context);
	await expect(cli.execute(['example', 'text', 'echo', 'invalid'], context)).rejects.toThrow('Invalid value');
	await expect(cli.execute(['example', 'text', 'echo'], context)).rejects.toThrow();
	expect(createClient).not.toHaveBeenCalled();
	await cli.execute(['example', 'text', 'echo', '00012'], context);
	expect(createClient).toHaveBeenCalledTimes(1);
	expect(call).toHaveBeenCalledWith('00012');
	expect(stdout).toHaveBeenLastCalledWith('{"text":"00012"}');
});
