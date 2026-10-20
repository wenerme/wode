import { describe, expect, it, vi } from 'vitest';
import { Cli } from './Cli';
import { CliOutputOptions, defineCommand } from './CliCommand';
import type { CliIO } from './CliIO';

describe('Cli', () => {
	it('parses aliases, defaults, repeatable options, and stdin-like positional values', async () => {
		const run = vi.fn();
		const cli = new Cli('demo');
		cli.add(
			defineCommand({
				name: 'service',
				aliases: ['svc'],
				description: 'Manage services',
				commands: [
					{
						name: 'create',
						description: 'Create a service',
						arguments: '[input]',
						options: [
							{ name: 'query', description: 'Query' },
							{ name: 'topic', description: 'Topic', repeatable: true },
							{ name: 'read-only', description: 'Read only', type: 'boolean', default: true },
						],
						run,
					},
				],
			}),
		);
		const stdout = vi.fn<CliIO['stdout']>();
		await cli.execute(
			['-o', 'json', 'svc', 'create', '-', '--query', '000123', '--topic', 'a', '--topic', 'b', '--no-read-only'],
			{
				stdout,
				signal: new AbortController().signal,
			},
		);
		expect(run).toHaveBeenCalledWith(
			expect.objectContaining({
				args: ['-'],
				options: { output: 'json', query: '000123', topic: ['a', 'b'], 'read-only': false },
			}),
			expect.anything(),
		);
	});

	it('renders help without running a handler and hides root-only options below root', async () => {
		const run = vi.fn();
		const stdout = vi.fn();
		const cli = new Cli('demo', {
			options: [...CliOutputOptions, { name: 'context', description: 'Context', helpScope: 'root' }],
		});
		cli.add({
			name: 'service',
			description: 'Services',
			commands: [{ name: 'list', description: 'List services', run }],
		});
		await cli.execute(['service', 'list', '--help'], { stdout, signal: new AbortController().signal });
		expect(stdout).toHaveBeenCalledWith(expect.not.stringContaining('--context'));
		expect(run).not.toHaveBeenCalled();
	});

	it('returns serializable definitions and rejects duplicates or post-seal registrations', () => {
		const cli = new Cli('demo');
		cli.add({ name: 'status', description: 'Status', run: () => undefined });
		expect(cli.describe()).toEqual([{ name: 'status', aliases: [], description: 'Status', options: [], commands: [] }]);
		expect(Object.isFrozen(cli.describe())).toBe(true);
		expect(() => cli.add({ name: 'status', description: 'Duplicate' })).toThrow('Duplicate');
		cli.seal();
		expect(() => cli.add({ name: 'other', description: 'Other' })).toThrow('sealed');
	});

	it('does not echo credential-like unknown command tokens', async () => {
		const cli = new Cli('demo');
		await expect(
			cli.execute(['sk-live-ABCDEFGHIJKLMNOPQRSTUVWXYZ'], { stdout: vi.fn(), signal: new AbortController().signal }),
		).rejects.toThrow('Unknown command;');
	});
});
