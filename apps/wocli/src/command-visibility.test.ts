import { CliConfigError, type CliConfigStore, createMemoryCliConfigStore } from 'common/context';
import type { ServiceProvider } from 'common/service';
import { describe, expect, it, vi } from 'vitest';
import { createWocliServiceCommand, type WocliHost } from './createWocliCli';
import { createBrowserConfigStore, createWocliWebCli } from './web';

function output() {
	const lines: string[] = [];
	const errors: string[] = [];
	return {
		lines,
		errors,
		io: {
			signal: new AbortController().signal,
			stdout: (text: string) => void lines.push(text),
			stderr: (text: string) => void errors.push(text),
		},
	};
}

function offline() {
	return {
		fetch: vi.fn<NonNullable<WocliHost['fetch']>>(() => {
			throw new Error('Discovery must not fetch');
		}),
		getEnv: vi.fn<NonNullable<WocliHost['getEnv']>>(() => {
			throw new Error('Discovery must not resolve a secret');
		}),
		readText: vi.fn<NonNullable<WocliHost['readText']>>(() => {
			throw new Error('Discovery must not read input files');
		}),
	};
}

function contexts() {
	return createMemoryCliConfigStore({
		currentContext: 'empty',
		contexts: {
			empty: { services: [] },
			active: { services: [{ name: 'primary', type: 'system' }] },
			off: { services: [{ name: 'primary', type: 'system', disabled: true }] },
		},
	});
}

function recordsCommand() {
	return createWocliServiceCommand<{ read(input: object): Promise<unknown> }>(
		{
			name: 'records',
			aliases: ['rec'],
			description: 'Fixture records',
			commands: [{ name: 'read', aliases: ['get'], description: 'Read', prepare: () => (client) => client.read({}) }],
		},
		'fixture',
	);
}

function recordProvider(): ServiceProvider {
	return {
		name: 'fixture',
		create: vi.fn<ServiceProvider['create']>(({ config }) => ({
			async getSchema() {
				return { tools: { read: { inputSchema: {}, annotations: { readOnlyHint: true } } } };
			},
			async call() {
				return { id: config.id };
			},
		})),
	};
}

describe('configured command snapshots', () => {
	it('retains recovery commands for malformed browser storage without exposing its contents', async () => {
		const setItem = vi.fn();
		const config = createBrowserConfigStore({ getItem: () => 'SECRET42', setItem });
		await expect(config.load()).rejects.toThrow(/^Invalid browser configuration$/);
		const cli = createWocliWebCli({ config });
		const { io, lines } = output();
		for (const line of ['--help', 'version', 'markdown --text offline --no-color']) {
			await cli.executeLine(line, io);
		}
		expect(lines.join('\n')).toContain('offline');
		expect(lines.join('\n')).not.toContain('SECRET42');
		await expect(cli.executeLine('context show', io)).rejects.toThrow('Invalid browser configuration');
		expect(setItem).not.toHaveBeenCalled();
	});
	it('retains recovery and local commands in an empty context, with no domain dispatch', async () => {
		const host = offline();
		const cli = createWocliWebCli(host);
		const tree = await cli.describe();
		expect(tree.map((command) => command.name)).toEqual(
			expect.arrayContaining(['version', 'context', 'service', 'provider', 'model', 'render', 'markdown', 'prompt']),
		);
		expect(tree.some((command) => command.name === 'system')).toBe(false);
		expect(tree.find((command) => command.name === 'prompt')?.arguments).toBeUndefined();
		const { io, lines } = output();
		await cli.executeLine('--help', io);
		expect(lines.pop()).not.toMatch(/^\s+system\s/mu);
		await cli.executeLine('markdown --text "# Offline" --no-color', io);
		expect(lines.pop()).toContain('Offline');
		for (const line of ['system info', 'system --help', 'prompt hello', 'p hello']) {
			await expect(cli.executeLine(line, io)).rejects.toThrow(/Unknown command|Invalid command arguments/u);
		}
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
		expect(host.readText).not.toHaveBeenCalled();
	});

	it('uses the same explicit context in help, describe, aliases and dispatch', async () => {
		const cli = createWocliWebCli({ config: contexts(), env: { WOCTL_CONTEXT: 'off' } });
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		expect((await cli.describe({ context: 'active' })).some((entry) => entry.name === 'system')).toBe(true);
		for (const argv of [
			['-cactive', 'system', 'echo', 'selected', '--json'],
			['system', 'echo', 'selected', '--context=active', '--json'],
		]) {
			expect((await cli.describe({ argv })).some((entry) => entry.name === 'system')).toBe(true);
			const { io, lines } = output();
			await cli.execute(argv, io);
			expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: 'selected' });
		}
		const { io, lines } = output();
		await cli.executeLine('system echo --help -c active', io);
		expect(lines.pop()).toContain('echo');
		await expect(cli.executeLine('system echo hidden', io)).rejects.toThrow('Unknown command');
		await expect(cli.describe({ context: 'empty', argv: ['--context', 'active', '--help'] })).rejects.toThrow();
	});

	it.each([
		['prompt', '--var', 'name=World', 'render', 'greet'],
		['prompt', 'render', 'greet', '--var', 'name=World'],
		['p', '--input', 'name=World', 'render', 'greet'],
		['p', 'render', 'greet', '--input', 'name=World'],
	])('keeps local prompt variables before and after the subcommand without an AI provider: %j', async (...argv) => {
		const host = offline();
		const cli = createWocliWebCli({
			...host,
			config: createMemoryCliConfigStore({ prompts: { greet: { template: 'Hello {{name}}' } } }),
		});
		const prompt = (await cli.describe({ argv })).find((command) => command.name === 'prompt');
		expect(prompt?.options?.map((option) => option.name)).toEqual(expect.arrayContaining(['var', 'input']));
		expect(prompt?.options?.some((option) => option.name === 'model')).toBe(false);
		expect(prompt?.arguments).toBeUndefined();
		const { io, lines } = output();
		await cli.execute(argv, io);
		expect(lines.pop()).toBe('Hello World');
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
		expect(host.readText).not.toHaveBeenCalled();
	});

	it.each([
		{ name: 'off', type: 'system', disabled: true },
		{ name: 'off', type: 'system', enabled: false },
		{ name: 'future', type: 'future-example' },
	])('keeps unavailable services manageable without exposing their domain: %j', async (service) => {
		const cli = createWocliWebCli({ config: createMemoryCliConfigStore({ services: [service] }) });
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual([expect.objectContaining({ name: service.name })]);
		await expect(cli.executeLine('system info', io)).rejects.toThrow('Unknown command');
	});

	it('discovers static commands for multiple matching instances without creating clients or reading secrets', async () => {
		const host = offline();
		const provider = recordProvider();
		const config = createMemoryCliConfigStore({
			services: [
				{ name: 'first', type: 'fixture' },
				{ name: 'second', type: 'fixture' },
			],
			providers: {
				ai: { api: 'openai', baseUrl: 'https://example.com/v1', apiKeyEnv: 'FIXTURE_ONLY_KEY' },
			},
		});
		const cli = createWocliWebCli({ ...host, config, providers: [provider], commands: [recordsCommand()] });
		const tree = await cli.describe({ argv: ['rec', 'get', '--help'] });
		expect(tree.filter((entry) => entry.name === 'records')).toHaveLength(1);
		expect(tree.find((entry) => entry.name === 'prompt')?.arguments).toBe('[text...]');
		const { io } = output();
		for (const line of ['--help', 'records --help', 'rec get --help', 'p --help']) await cli.executeLine(line, io);
		expect(provider.create).not.toHaveBeenCalled();
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
		expect(host.readText).not.toHaveBeenCalled();
	});

	it('requires a supported local provider unless the host supplies its runtime', async () => {
		const config = createMemoryCliConfigStore({ services: [{ name: 'fixture', type: 'fixture' }] });
		const local = createWocliWebCli({ config, commands: [recordsCommand()] });
		expect((await local.describe()).some((entry) => entry.name === 'records')).toBe(false);
		const runtime = {
			getSchema: vi.fn(async () => ({ tools: { read: { inputSchema: {}, annotations: { readOnlyHint: true } } } })),
			call: vi.fn(async () => ({ injected: true })),
		};
		const remote = createWocliWebCli({ config, runtime, commands: [recordsCommand()] });
		expect((await remote.describe()).some((entry) => entry.name === 'records')).toBe(true);
		expect(runtime.getSchema).not.toHaveBeenCalled();
		const { io, lines } = output();
		await remote.executeLine('rec get --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ injected: true });
	});

	it('filters nested domain groups and their aliases while retaining unrelated local extensions', async () => {
		const config = createMemoryCliConfigStore({});
		const cli = createWocliWebCli({
			config,
			providers: [recordProvider()],
			commands: [
				{ name: 'workspace', aliases: ['ws'], description: 'Workspace', commands: [recordsCommand()] },
				{ name: 'local', description: 'Local extension', run: (_input, io) => io.stdout('local') },
			],
		});
		expect((await cli.describe()).some((entry) => entry.name === 'workspace')).toBe(false);
		const { io, lines } = output();
		await cli.executeLine('local', io);
		expect(lines.pop()).toBe('local');
		await expect(cli.executeLine('ws rec get', io)).rejects.toThrow('Unknown command');
		await cli.executeLine('service add one --provider fixture', io);
		const tree = await cli.describe();
		expect(tree.find((entry) => entry.name === 'workspace')?.commands?.map((entry) => entry.name)).toEqual(['records']);
		await cli.executeLine('ws rec get --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({});
	});

	it('selects instances by current defaults and explicit service without widening the tree', async () => {
		const config = createMemoryCliConfigStore({
			services: [
				{ name: 'first', type: 'fixture', id: 'first' },
				{ name: 'second', type: 'fixture', id: 'second' },
			],
		});
		const cli = createWocliWebCli({ config, providers: [recordProvider()], commands: [recordsCommand()] });
		const { io, lines } = output();
		await expect(cli.executeLine('records read', io)).rejects.toThrow('Select one matching service');
		await cli.executeLine('service default set fixture second', io);
		await cli.executeLine('records read --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ id: 'second' });
		await cli.executeLine('rec get --service first --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ id: 'first' });
		expect((await cli.describe()).filter((entry) => entry.name === 'records')).toHaveLength(1);
	});

	it('loads once and binds discovery and invocation to that configuration', async () => {
		const first = createMemoryCliConfigStore({ services: [{ name: 'one', type: 'fixture', id: 'first' }] });
		const second = createMemoryCliConfigStore({});
		const config: CliConfigStore = {
			load: vi
				.fn()
				.mockResolvedValueOnce(await first.load())
				.mockImplementation(() => second.load()),
			save: vi.fn(),
		};
		const cli = createWocliWebCli({ config, providers: [recordProvider()], commands: [recordsCommand()] });
		const { io, lines } = output();
		await cli.executeLine('rec get --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ id: 'first' });
		expect(config.load).toHaveBeenCalledTimes(1);
		expect((await cli.describe()).some((entry) => entry.name === 'records')).toBe(false);
		expect(config.load).toHaveBeenCalledTimes(2);
	});

	it('reuses the loaded edit object for selection and save within management commands', async () => {
		const memory = createMemoryCliConfigStore({ services: [{ name: 'one', type: 'system' }] });
		const loaded = await memory.load();
		const config = { load: vi.fn(async () => loaded), save: vi.fn(async () => {}) };
		const cli = createWocliWebCli({ config });
		await cli.executeLine('service default set system one', output().io);
		expect(config.load).toHaveBeenCalledTimes(1);
		expect(config.save).toHaveBeenCalledExactlyOnceWith(loaded);
		expect(loaded.contexts.local.defaults.system).toBe('one');
	});

	it('refreshes a long-lived CLI after context changes, disablement and type changes', async () => {
		const config = contexts();
		const cli = createWocliWebCli({ config });
		const { io } = output();
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		await cli.executeLine('context use active', io);
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(true);
		await cli.executeLine('service remove primary', io);
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		await cli.executeLine('service add replacement --provider system', io);
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(true);
		const edited = await config.load();
		edited.contexts.active.services.replacement.disabled = true;
		await config.save(edited);
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		edited.contexts.active.services.replacement.disabled = false;
		edited.contexts.active.services.replacement.type = 'future-example';
		edited.contexts.active.services.replacement.provider = 'future-example';
		await config.save(edited);
		await expect(cli.executeLine('system info', io)).rejects.toThrow('Unknown command');
	});

	it('keeps an in-flight invocation on its original snapshot while the next uses new configuration', async () => {
		const config = createMemoryCliConfigStore({ services: [{ name: 'one', type: 'fixture', id: 'before' }] });
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		let started!: () => void;
		const ready = new Promise<void>((resolve) => {
			started = resolve;
		});
		const provider = recordProvider();
		const create = provider.create;
		provider.create = async (input) => {
			started();
			await gate;
			return create(input);
		};
		const cli = createWocliWebCli({ config, providers: [provider], commands: [recordsCommand()] });
		const first = output();
		const pending = cli.executeLine('records read --json', first.io);
		await ready;
		try {
			const edited = await config.load();
			edited.services.one.id = 'after';
			await config.save(edited);
		} finally {
			release();
		}
		await pending;
		expect(JSON.parse(first.lines.pop() ?? '')).toEqual({ id: 'before' });
		const second = output();
		await cli.executeLine('records read --json', second.io);
		expect(JSON.parse(second.lines.pop() ?? '')).toEqual({ id: 'after' });
	});

	it('respects option values and the positional terminator during context selection', async () => {
		const cli = createWocliWebCli({ config: contexts(), env: { WOCTL_CONTEXT: 'active' } });
		const { io, lines } = output();
		await cli.execute(['system', 'echo', '--json', '--', '--context=empty'], io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: '--context=empty' });
		await cli.execute(['render', '--text=--context=empty', '--input', 'text'], io);
		expect(lines.pop()).toContain('--context=empty');
		await expect(cli.execute(['system', 'info', '-c', 'active', '--context', 'empty'], io)).rejects.toThrow(
			'--context requires one value',
		);
	});

	it('offers a recovery help tree for invalid configuration while rejecting service execution', async () => {
		const host = offline();
		const config = {
			load: vi.fn(async () => {
				throw new CliConfigError('Invalid fixture configuration');
			}),
			save: vi.fn(),
		};
		const cli = createWocliWebCli({ ...host, config });
		expect((await cli.describe()).some((entry) => entry.name === 'system')).toBe(false);
		const { io, lines, errors } = output();
		await cli.executeLine('--help', io);
		expect(lines.join('\n')).toContain('context');
		expect([...lines, ...errors].join('\n')).toMatch(/configuration|配置/u);
		await cli.executeLine('markdown --text offline --no-color', io);
		expect(lines.pop()).toContain('offline');
		await expect(cli.executeLine('system info', io)).rejects.toThrow();
		await expect(cli.executeLine('service list', io)).rejects.toThrow('Invalid fixture configuration');
		expect(host.fetch).not.toHaveBeenCalled();
		expect(host.getEnv).not.toHaveBeenCalled();
		expect(host.readText).not.toHaveBeenCalled();
	});
});
