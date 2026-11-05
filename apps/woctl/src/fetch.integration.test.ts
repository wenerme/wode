import type { ServiceProvider } from '@wener/common/service';
import { createMemoryCliConfigStore } from 'common/context';
import { Bash } from 'just-bash/browser';
import { describe, expect, it, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { createWebCli } from './web';
import { createShellCommand } from './shell';

function fixture() {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('<html><head><title>Article</title></head><body><nav>Navigation</nav><main><h1>Article</h1><p>Useful body</p></main><footer>Footer</footer></body></html>', { headers: { 'content-type': 'text/html' } }));
	const config = createMemoryCliConfigStore({ services: [{ name: 'web', type: 'direct' }] });
	const stdout = vi.fn();
	return { fetch, config, stdout, cli: createWebCli({ config, fetch }), io: { signal: new AbortController().signal, stdout } };
}

describe('root fetch capability', () => {
	it('fetches Markdown with metadata and keeps full pages with --no-main', async () => {
		const f = fixture();
		await f.cli.executeLine('fetch https://example.com --metadata', f.io);
		expect(f.stdout.mock.lastCall![0]).toContain('Source: <https://example.com>');
		expect(f.stdout.mock.lastCall![0]).toContain('Useful body');
		expect(f.stdout.mock.lastCall![0]).not.toContain('Navigation');
		await f.cli.executeLine('fetch https://example.com --no-main --json', f.io);
		expect(JSON.parse(f.stdout.mock.lastCall![0]).content).toContain('Navigation');
	});

	it('provides raw JSON/YAML and honors character limits and live fetching', async () => {
		const f = fixture();
		await f.cli.executeLine('fetch https://example.com --raw --json', f.io);
		expect(JSON.parse(f.stdout.mock.lastCall![0]).content).toContain('<html>');
		await f.cli.executeLine('fetch https://example.com --raw -o yaml', f.io);
		expect(parseYaml(f.stdout.mock.lastCall![0]).status).toBe(200);
		await f.cli.executeLine('fetch https://example.com --maxcharacters 8 --live --output yaml', f.io);
		expect(parseYaml(f.stdout.mock.lastCall![0]).content.length).toBeLessThanOrEqual(8);
		expect(f.fetch.mock.lastCall![1]?.cache).toBe('no-store');
	});

	it.each(['', 'file:///etc/hosts', 'https://user:pass@example.com', 'https://example.com --max-characters 0', 'https://example.com --raw', 'https://example.com --output invalid'])('rejects invalid input without invoking fetch: %s', async (args) => {
		const f = fixture();
		await expect(f.cli.executeLine(`fetch ${args}`, f.io)).rejects.toThrow();
		expect(f.fetch).not.toHaveBeenCalled();
	});

	it('forwards all content options through the runtime and closes on failure', async () => {
		const call = vi.fn(async () => { throw new Error('Fixture failure'); });
		const close = vi.fn();
		const provider: ServiceProvider = { name: 'fixture-fetch', capabilities: ['fetch'], create: () => ({
			async getSchema() { return { tools: { fetch: { inputSchema: {}, annotations: { readOnlyHint: true } } } }; }, call, close,
		}) };
		const cli = createWebCli({ providers: [provider], config: createMemoryCliConfigStore({ services: [{ name: 'reader', type: provider.name }] }) });
		const signal = new AbortController().signal;
		await expect(cli.executeLine('fetch https://example.com --no-text --summary --highlights --live --no-main --metadata --max-characters 80 --raw --json', { signal, stdout: vi.fn() })).rejects.toThrow('Fixture failure');
		expect(call).toHaveBeenCalledWith('fetch', { url: 'https://example.com', text: false, summary: true, highlights: true, live: true, main: false, metadata: true, maxCharacters: 80, raw: true }, { signal });
		expect(close).toHaveBeenCalledOnce();
	});

	it('lists configured instances with provider aliases and executes in the shell host', async () => {
		const f = fixture();
		await f.cli.executeLine('fetch --list-services --api direct --json', f.io);
		expect(JSON.parse(f.stdout.mock.lastCall![0])).toEqual([{ name: 'web', provider: 'base', readOnly: true, default: true }]);
		expect(f.fetch).not.toHaveBeenCalled();
		const bash = new Bash({ customCommands: [createShellCommand({ config: f.config, fetch: f.fetch })] });
		const result = await bash.exec('woctl fetch https://example.com --json');
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout).content).toContain('Useful body');
	});
});
