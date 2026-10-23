import { createMemoryCliConfigStore } from 'common/context';
import type { ServiceProvider, ServiceRuntimeClient } from 'common/service';
import { describe, expect, it, vi } from 'vitest';
import { createWocliCli } from './createWocliCli';
import { createBrowserConfigStore, createWocliWebCli } from './web';

function output() {
	const lines: string[] = [];
	return {
		lines,
		io: {
			signal: new AbortController().signal,
			stdout: (text: string) => {
				lines.push(text);
			},
		},
	};
}
function serviceConfig() {
	return createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }], defaults: { system: 'system' } });
}
describe('wocli Node/Web shared commands', () => {
	it('starts with an empty service directory and keeps help and render available', async () => {
		const cli = createWocliWebCli();
		const { io, lines } = output();
		await cli.executeLine('--help', io);
		await cli.executeLine('service list --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual([]);
		await expect(cli.executeLine('system info', io)).rejects.toThrow('Unknown command');
		await expect(cli.executeLine('service call system info', io)).rejects.toThrow('Unknown service');
		await cli.executeLine('markdown --text "# Empty config"', io);
		expect(lines.pop()).toContain('Empty config');
	});
	it('isolates injected command aliases from built-in service input options', async () => {
		const run = vi.fn();
		const cli = createWocliWebCli({
			commands: [
				{
					name: 'inspect',
					description: 'inspect',
					options: [{ name: 'interactive', aliases: ['i'], description: 'interactive', type: 'boolean' }],
					run,
				},
			],
		});
		await cli.executeLine('inspect -i', output().io);
		expect(run.mock.calls[0]?.[0].options).toEqual({ interactive: true });
	});
	it('runs service definitions and schema/call using the same offline service', async () => {
		const cli = createWocliWebCli({ config: serviceConfig() });
		const { io, lines } = output();
		await cli.executeLine('system echo "Hello, Wener" --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: 'Hello, Wener' });
		await cli.execute(['service', 'call', 'system', 'echo', '--input', '{"text":"raw"}', '--json'], io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: 'raw' });
		await cli.executeLine('service schema system --json', io);
		expect(JSON.parse(lines.pop() ?? '').tools.echo.inputSchema).toMatchObject({ type: 'object' });
	});
	it('persists context changes and applies command-local context overrides', async () => {
		const config = serviceConfig();
		const cli = createWocliWebCli({ config });
		const { io, lines } = output();
		await cli.executeLine('context create test', io);
		await cli.executeLine('context use test', io);
		await cli.executeLine('service add extra --provider system', io);
		await cli.executeLine('service list --context local --json', io);
		expect(JSON.parse(lines.pop() ?? '').map((entry: { name: string }) => entry.name)).toEqual(['system']);
		await cli.executeLine('service list --json', io);
		expect(JSON.parse(lines.pop() ?? '').map((entry: { name: string }) => entry.name)).toEqual(['system', 'extra']);
		await expect(cli.executeLine('context remove test', io)).rejects.toThrow('current');
		expect((await config.load()).currentContext).toBe('test');
	});
	it('help and invalid input do not instantiate providers', async () => {
		const create = vi.fn<ServiceProvider['create']>();
		const cli = createWocliCli({
			config: createMemoryCliConfigStore({ services: { test: { provider: 'test' } } }),
			providers: [{ name: 'test', create }],
		});
		const { io } = output();
		await cli.executeLine('service call --help', io);
		await expect(cli.executeLine('service call test operation --input invalid', io)).rejects.toThrow('valid JSON');
		expect(create).not.toHaveBeenCalled();
		await expect(cli.executeLine('unknown-command', io)).rejects.toThrow('Unknown command');
	});
	it('checks the injected service catalog and read-only policy before remote calls', async () => {
		const call = vi.fn(async () => ({ ok: true }));
		const runtime: ServiceRuntimeClient = { getSchema: async () => ({ tools: { write: { inputSchema: {} } } }), call };
		const cli = createWocliWebCli({ runtime, config: serviceConfig() });
		const { io } = output();
		await expect(cli.executeLine('service call system write', io)).rejects.toThrow('read-only');
		await expect(cli.executeLine('service call missing write', io)).rejects.toThrow('Unknown service');
		expect(call).not.toHaveBeenCalled();
	});
	it('uses host-owned file input and storage without Node dependencies', async () => {
		const entries = new Map<string, string>([['woctl.config', JSON.stringify(await serviceConfig().load())]]);
		const config = createBrowserConfigStore({
			getItem: (key) => entries.get(key) ?? null,
			setItem: (key, value) => {
				entries.set(key, value);
			},
		});
		const cli = createWocliWebCli({ config, readText: async () => '{"text":"from-file"}' });
		const { io, lines } = output();
		await cli.executeLine('service call system echo --input @virtual.json --json', io);
		expect(JSON.parse(lines.pop() ?? '')).toEqual({ text: 'from-file' });
		await cli.executeLine('context create browser', io);
		expect(
			(await createBrowserConfigStore({ getItem: (key) => entries.get(key) ?? null, setItem: () => {} }).load())
				.contexts,
		).toHaveProperty('browser');
	});
	it('stops aborted executions before service calls', async () => {
		const { io } = output();
		const controller = new AbortController();
		controller.abort();
		await expect(
			createWocliWebCli().executeLine('system info', { ...io, signal: controller.signal }),
		).rejects.toThrow();
	});
});
