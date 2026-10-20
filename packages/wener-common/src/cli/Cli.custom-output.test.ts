import { expect, it, vi } from 'vitest';
import { Cli } from './Cli';

it('keeps custom output semantics local and supports positional text beside prompt subcommands', async () => {
	const custom = vi.fn();
	const standard = vi.fn();
	const prompt = vi.fn();
	const list = vi.fn();
	const cli = new Cli('test');
	cli.add({ name: 'render', description: 'render', arguments: '[source]', output: 'custom', run: custom });
	cli.add({ name: 'service', description: 'service', run: standard });
	cli.add({
		name: 'prompt',
		description: 'prompt',
		arguments: '[text...]',
		output: 'custom',
		run: prompt,
		commands: [{ name: 'list', description: 'list', run: list }],
	});
	const context = { signal: new AbortController().signal, stdout: vi.fn() };
	await cli.execute(['render', 'input.md', '-o', 'output.md'], context);
	expect(custom.mock.calls[0]?.[0]).toMatchObject({ args: ['input.md'], options: { output: 'output.md' } });
	await expect(cli.execute(['service', '-o', 'output.md'], context)).rejects.toThrow('Supported output formats');
	expect(standard).not.toHaveBeenCalled();
	await cli.execute(['prompt', 'hello', 'world', '-o', 'text'], context);
	expect(prompt.mock.calls[0]?.[0].args).toEqual(['hello', 'world']);
	await cli.execute(['prompt', 'list', '--json'], context);
	expect(list).toHaveBeenCalledOnce();
	expect(cli.describe().find((command) => command.name === 'render')?.output).toBe('custom');
});
