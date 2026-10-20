import { describe, expect, it, vi } from 'vitest';
import type { CliContext } from './Cli';
import { Cli } from './Cli';
import type { CliCommand, CliInput } from './CliCommand';

describe('command option scopes', () => {
	for (const reversed of [false, true]) {
		it(`isolates same aliases and different option types (reversed=${reversed})`, async () => {
			const text = vi.fn<(input: CliInput) => void>();
			const inspect = vi.fn<(input: CliInput) => void>();
			const commands: CliCommand<CliContext>[] = [
				{
					name: 'text',
					description: 'text',
					options: [
						{ name: 'input', aliases: ['i'], description: 'input' },
						{ name: 'mode', description: 'mode' },
					],
					run: text,
				},
				{
					name: 'inspect',
					description: 'inspect',
					options: [
						{ name: 'interactive', aliases: ['i'], description: 'interactive', type: 'boolean' },
						{ name: 'mode', description: 'mode', type: 'boolean' },
					],
					run: inspect,
				},
			];
			const cli = new Cli('test');
			for (const command of reversed ? commands.reverse() : commands) cli.add(command);
			const context = { signal: new AbortController().signal, stdout: vi.fn() };
			await cli.execute(['inspect', '-i', '--mode'], context);
			expect(inspect.mock.calls[0]?.[0].options).toEqual({ interactive: true, mode: true });
			await cli.execute(['text', '-i', '00012', '--mode', 'plain'], context);
			expect(text.mock.calls[0]?.[0].options).toEqual({ input: '00012', mode: 'plain' });
			await expect(cli.execute(['inspect', '--input', 'bad'], context)).rejects.toThrow('Unknown option');
		});
	}
	it('discovers nested commands with ancestor/global options and preserves literal arguments', async () => {
		const run = vi.fn();
		const cli = new Cli('test', {
			options: [
				{ name: 'context', aliases: ['c'], description: 'context' },
				{ name: 'verbose', aliases: ['v'], description: 'verbose', type: 'boolean' },
			],
		});
		cli.add({
			name: 'parent',
			description: 'parent',
			options: [{ name: 'service', description: 'service' }],
			commands: [
				{
					name: 'child',
					description: 'child',
					arguments: '<value>',
					options: [{ name: 'interactive', aliases: ['i'], description: 'interactive', type: 'boolean' }],
					run,
				},
			],
		});
		await cli.execute(['-vcdev', 'parent', '--service', 'one', 'child', '-i', '--', '--literal'], {
			signal: new AbortController().signal,
			stdout: vi.fn(),
		});
		expect(run.mock.calls[0]?.[0]).toMatchObject({
			args: ['--literal'],
			options: { context: 'dev', verbose: true, service: 'one', interactive: true },
		});
	});
});
