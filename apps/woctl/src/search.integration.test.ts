import { createMemoryCliConfigStore } from 'common/context';
import { Bash } from 'just-bash/browser';
import { describe, expect, it, vi } from 'vitest';
import { createWocliShellCommand } from './shell';
import { createWocliWebCli } from './web';

function config() {
	return createMemoryCliConfigStore({
		currentContext: 'empty',
		contexts: {
			empty: { services: [] },
			search: { services: [{ name: 'public-search', type: 'duckduckgo' }] },
		},
	});
}

function fixtureFetch() {
	return vi.fn<typeof fetch>(async () =>
		Response.json({
			Heading: 'Fixture',
			AbstractText: 'A search result',
			AbstractURL: 'https://example.com/result',
		}),
	);
}

describe('DuckDuckGo host integration', () => {
	it('resolves provider aliases for discovery, defaults and explicit selection', async () => {
		const fetch = fixtureFetch();
		const cli = createWocliWebCli({
			fetch,
			config: createMemoryCliConfigStore({
				services: [
					{ name: 'first', type: 'ddg', headers: { 'x-search': 'first' } },
					{ name: 'second', type: 'duckduckgo', headers: { 'x-search': 'second' } },
				],
				defaults: { ddg: 'first' },
			}),
		});
		const io = { signal: new AbortController().signal, stdout: vi.fn() };
		expect((await cli.describe()).some((command) => command.name === 'duckduckgo')).toBe(true);
		await cli.executeLine('ddg search --help', io);
		expect(fetch).not.toHaveBeenCalled();
		await cli.executeLine('ddg search fixture --json', io);
		expect(new Headers(fetch.mock.calls[0][1]?.headers).get('x-search')).toBe('first');
		await cli.executeLine('service default set duckduckgo first', io);
		await cli.executeLine('ddg search fixture --json', io);
		await cli.executeLine('service default set duckduckgo second', io);
		await expect(cli.executeLine('ddg search fixture', io)).rejects.toThrow('Conflicting default services');
		await cli.executeLine('ddg search fixture --service second --json', io);
		expect(new Headers(fetch.mock.calls[2][1]?.headers).get('x-search')).toBe('second');
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it('discovers configured search in one context and executes both domain and generic service calls', async () => {
		const fetch = fixtureFetch();
		const cli = createWocliWebCli({ config: config(), fetch });
		const lines: string[] = [];
		const io = { signal: new AbortController().signal, stdout: (text: string) => lines.push(text) };
		expect((await cli.describe()).some((item) => item.name === 'duckduckgo')).toBe(false);
		expect((await cli.describe({ context: 'search' })).some((item) => item.name === 'duckduckgo')).toBe(true);
		await cli.execute(['ddg', 'search', '--help', '-c', 'search'], io);
		expect(fetch).not.toHaveBeenCalled();
		await cli.execute(['ddg', 'search', 'fixture', '--context', 'search', '--json'], io);
		expect(JSON.parse(lines.pop() ?? '').items[0].url).toBe('https://example.com/result');
		await cli.execute(
			['service', 'call', 'public-search', 'search', '-c', 'search', '--input', '{"query":"fixture"}', '--json'],
			io,
		);
		expect(JSON.parse(lines.pop() ?? '').metadata.query).toBe('fixture');
		await expect(
			cli.execute(['service', 'call', 'public-search', 'search', '-c', 'search', '--input', '{"query":""}'], io),
		).rejects.toThrow();
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('runs configured search through the real just-bash command', async () => {
		const fetch = fixtureFetch();
		const bash = new Bash({ customCommands: [createWocliShellCommand({ config: config(), fetch })] });
		const result = await bash.exec('woctl ddg search fixture --context search --json | cat');
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout).items[0].title).toBe('Fixture');
	});
});
