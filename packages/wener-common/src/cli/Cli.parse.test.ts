import { describe, expect, it, vi } from 'vitest';
import { Cli } from './Cli';

function fixture() {
	const cli = new Cli('fixture', { options: [{ name: 'context', aliases: ['c'], description: 'Context' }] });
	const run = vi.fn();
	cli.add({
		name: 'group',
		aliases: ['g'],
		description: 'Group',
		options: [{ name: 'message', aliases: ['m'], description: 'Message' }],
		commands: [{ name: 'send', aliases: ['s'], description: 'Send', arguments: '[text...]', run }],
	});
	cli.add({
		name: 'other',
		description: 'Other',
		options: [{ name: 'mute', aliases: ['m'], type: 'boolean', description: 'Mute' }],
		run,
	});
	cli.seal();
	return { cli, run, io: { stdout: vi.fn(), signal: new AbortController().signal } };
}

describe('Cli.parse', () => {
	it.each([
		{ argv: ['--context=dev', 'g', 's', 'hello'], options: { context: 'dev' }, args: ['hello'] },
		{ argv: ['g', '-cdev', 's'], options: { context: 'dev' }, args: [] },
		{ argv: ['g', 's', '-c', 'dev'], options: { context: 'dev' }, args: [] },
		{ argv: ['g', '--message=--context', 's'], options: { message: '--context' }, args: [] },
		{ argv: ['g', '-mhello', 's'], options: { message: 'hello' }, args: [] },
		{ argv: ['g', 's', '--', '--context', 'other'], options: {}, args: ['--context', 'other'] },
	])('shares selected-branch parsing with execute: $argv', async ({ argv, options, args }) => {
		const { cli, run, io } = fixture();
		expect(cli.parse(argv)).toEqual({ path: ['group', 'send'], args, options });
		expect(run).not.toHaveBeenCalled();
		await cli.execute(argv, io);
		expect(run).toHaveBeenCalledWith(expect.objectContaining({ args, options }), io);
	});

	it.each([
		['g', 's', '-cdev', '--context=other'],
		['g', '--message', '--context', 'other', 's'],
		['g', 's', '-m'],
		['other', '--message=hello'],
	])('shares option validation with execute: %j', async (...argv) => {
		const { cli, io } = fixture();
		expect(() => cli.parse(argv)).toThrow();
		await expect(cli.execute(argv, io)).rejects.toThrow();
	});

	it('does not import sibling aliases into the selected path', async () => {
		const { cli, run, io } = fixture();
		expect(cli.parse(['other', '-m'])).toEqual({ path: ['other'], args: [], options: { mute: true } });
		await cli.execute(['other', '-m'], io);
		expect(run).toHaveBeenCalledWith(expect.objectContaining({ options: { mute: true } }), io);
	});

	it('leaves argument-count checks to execution so callers can prepare incomplete commands', async () => {
		const cli = new Cli('fixture');
		cli.add({ name: 'show', description: 'Show', arguments: '<name>', run: vi.fn() });
		expect(cli.parse(['show']).args).toEqual([]);
		await expect(cli.execute(['show'], { stdout: vi.fn(), signal: new AbortController().signal })).rejects.toThrow(
			'arguments',
		);
	});

	it('consumes only globals before an independent raw command without inspecting its body', async () => {
		const cli = new Cli('fixture', { options: [{ name: 'context', aliases: ['c'], description: 'Context' }] });
		const runRaw = vi.fn();
		cli.add({ name: 'adapter', aliases: ['a'], description: 'Adapter', raw: false, runRaw });
		const argv = ['-cdev', 'a', '--message', '--context', '--context=private', '--', '-cother'];
		expect(cli.parse(argv)).toEqual({ path: ['adapter'], options: { context: 'dev' }, args: argv.slice(2) });
		expect(runRaw).not.toHaveBeenCalled();
		const io = { stdout: vi.fn(), signal: new AbortController().signal };
		await cli.execute(argv, io);
		expect(runRaw).toHaveBeenCalledWith(['-cdev', ...argv.slice(2)], io);
		expect(cli.parse(['a', '--context=private']).options).toEqual({});
	});

	it('parses merged non-raw children normally and preserves raw dispatch and merged help', async () => {
		const cli = new Cli('fixture', { options: [{ name: 'context', aliases: ['c'], description: 'Context' }] });
		const runRaw = vi.fn();
		const run = vi.fn();
		cli.add({ name: 'adapter', description: 'Adapter', runRaw });
		cli.merge({
			name: 'adapter',
			description: 'Adapter',
			commands: [{ name: 'local', description: 'Local', raw: false, run }],
		});
		expect(cli.parse(['adapter', 'local', '-cdev'])).toEqual({
			path: ['adapter', 'local'],
			args: [],
			options: { context: 'dev' },
		});
		const io = { stdout: vi.fn(), signal: new AbortController().signal };
		await cli.execute(['adapter', 'local', '-cdev'], io);
		expect(run).toHaveBeenCalledOnce();
		expect(cli.parse(['adapter', '--help']).options).toEqual({ help: true });
		await cli.execute(['adapter', '--help'], io);
		expect(runRaw).not.toHaveBeenCalled();
		await cli.execute(['adapter', '--unrecognized-by-host'], io);
		expect(runRaw).toHaveBeenCalledWith(['--unrecognized-by-host'], io);
	});

	it('preserves the raw handler receiver and does not pre-validate its independent options during execute', async () => {
		const cli = new Cli('fixture', { options: [{ name: 'context', aliases: ['c'], description: 'Context' }] });
		const received = vi.fn();
		cli.add({
			name: 'adapter',
			description: 'Adapter',
			raw: false,
			runRaw(argv) {
				received(this.name, argv);
			},
		});
		await cli.execute(['-cfirst', '-csecond', 'adapter', '--private'], {
			stdout: vi.fn(),
			signal: new AbortController().signal,
		});
		expect(received).toHaveBeenCalledWith('adapter', ['-cfirst', '-csecond', '--private']);
	});
});
