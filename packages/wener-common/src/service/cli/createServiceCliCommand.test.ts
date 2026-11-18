import { expect, it, vi } from 'vitest';
import { Cli, type CliContext } from '../../cli';
import { createRedactor, setRedactor } from '../../redact';
import { createServiceCliCommand } from './createServiceCliCommand';

it('preserves service results and applies redaction only to explicitly requested CLI output', async () => {
	const value = Object.freeze({ password: 'fixture-value', content: 'Bearer fixture-token', safe: 1 });
	const read = vi.fn(async () => value);
	const policy = createRedactor();
	const project = vi.fn();
	const previous = setRedactor({
		redact<T>(input: T): T {
			project();
			return policy.redact(input);
		},
		isSensitive: policy.isSensitive,
	});
	try {
		const results: unknown[] = [];
		const cli = new Cli<CliContext>('test');
		cli.add(
			createServiceCliCommand(
				{
					name: 'example',
					description: 'Read a business object',
					commands: [
						{
							name: 'read',
							description: 'Read',
							prepare: () => (client: { read(): Promise<typeof value> }) => client.read(),
						},
					],
				},
				{
					readText: async (input) => input,
					async run(_operation, _options, context: CliContext, prepare) {
						const invoke = await prepare();
						const result = await invoke({ read }, { signal: context.signal });
						results.push(result);
						context.stdout(JSON.stringify(result));
					},
				},
			),
		);
		const context = { signal: new AbortController().signal, stdout: vi.fn() };
		await cli.execute(['example', '--help'], context);
		expect(read).not.toHaveBeenCalled();
		expect(project).not.toHaveBeenCalled();
		await cli.execute(['example', 'read'], context);
		expect(results[0]).toBe(value);
		expect(project).not.toHaveBeenCalled();
		await cli.execute(['example', 'read', '--redact'], context);
		expect(results[1]).toEqual({ password: '<redacted>', content: 'Bearer <redacted>', safe: 1 });
		expect(results[1]).not.toBe(value);
		expect(project).toHaveBeenCalledTimes(1);
		await cli.execute(['example', 'read'], context);
		expect(results[2]).toBe(value);
		expect(project).toHaveBeenCalledTimes(1);
		expect(value.password).toBe('fixture-value');
	} finally {
		setRedactor(previous);
	}
});

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
				examples: [{ command: 'test example text echo hello', description: 'Echo text' }],
				commands: [
					{
						name: 'echo',
						group: 'text',
						arguments: '<value>',
						description: 'echo input',
						examples: [{ command: 'test example text echo 00012' }],
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
	expect(cli.describe()[0]?.examples).toEqual([{ command: 'test example text echo hello', description: 'Echo text' }]);
	expect(cli.describe()[0]?.commands?.[0]?.commands?.[0]?.examples).toEqual([
		{ command: 'test example text echo 00012' },
	]);
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

it('forwards optional binary ports only when the host provides them', async () => {
	const seen: Array<{ readBytes: boolean; writeBytes: boolean }> = [];
	const definition = {
		name: 'bin',
		description: 'binary ports',
		commands: [
			{
				name: 'probe',
				description: 'probe ports',
				async prepare(context: import('./ServiceCliDefinition').ServiceCliInputContext) {
					seen.push({
						readBytes: typeof context.readBytes === 'function',
						writeBytes: typeof context.writeBytes === 'function',
					});
					if (context.readBytes && context.writeBytes) {
						const bytes = await context.readBytes('@in.bin', { maxBytes: 4 });
						await context.writeBytes('out.bin', bytes, {});
					}
					return async () => undefined;
				},
			},
		],
	};
	const run = async (_operation: unknown, _options: unknown, _context: CliContext, prepare: () => Promise<unknown>) => {
		await prepare();
	};
	const context = { signal: new AbortController().signal, stdout: vi.fn() };
	const plain = new Cli<CliContext>('test');
	plain.add(createServiceCliCommand(definition, { readText: async (value) => value, run }));
	await plain.execute(['bin', 'probe'], context);

	const readBytes = vi.fn(async () => new Uint8Array([1, 2]));
	const writeBytes = vi.fn(async () => undefined);
	const binary = new Cli<CliContext>('test');
	binary.add(createServiceCliCommand(definition, { readText: async (value) => value, readBytes, writeBytes, run }));
	await binary.execute(['bin', 'probe'], context);

	expect(seen).toEqual([
		{ readBytes: false, writeBytes: false },
		{ readBytes: true, writeBytes: true },
	]);
	expect(readBytes).toHaveBeenCalledWith('@in.bin', context, { maxBytes: 4 });
	expect(writeBytes).toHaveBeenCalledWith('out.bin', new Uint8Array([1, 2]), context, {});
});
