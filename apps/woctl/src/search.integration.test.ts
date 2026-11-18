import { createMemoryCliConfigStore } from 'common/context';
import { Bash } from 'just-bash/browser';
import { describe, expect, it, vi } from 'vitest';
import { createShellCommand } from './shell';
import { createWebCli } from './web';
import type { ServiceProvider } from '@wener/common/service';
import { parse as parseYaml } from 'yaml';
import type { FetchResponse } from '@wener/common/service/fetch';

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

function rootFixture(options: {
	defaults?: Record<string, string>;
	failFetch?: boolean;
	onFetch?: (url: string) => Promise<FetchResponse>;
} = {}) {
	const calls: Array<{ service: string; tool: string; input: unknown }> = [];
	const closes = vi.fn();
	const creates = vi.fn();
	const providers: ServiceProvider[] = ['alpha', 'beta'].map((name) => ({
		name, aliases: [`${name}-alias`], capabilities: ['search', 'fetch'],
		create({ name: service }) {
			creates(service);
			return {
				async getSchema() { return { tools: Object.fromEntries(['search', 'fetch'].map((tool) => [tool, { inputSchema: {}, annotations: { readOnlyHint: true } }])) }; },
				async call(tool, input) {
					calls.push({ service, tool, input });
					if (tool === 'fetch') {
						if (options.failFetch) throw new Error('Fixture fetch failed');
						if (options.onFetch) return options.onFetch((input as { url: string }).url);
						return { url: (input as { url: string }).url, title: 'Article', content: '# Article\n\nFetched body', raw: { fixture: 'raw-fetch' } };
					}
					return { items: [
						{ title: 'First', url: 'https://example.com/1', highlights: ['First highlight'], text: 'Full text' },
						{ title: 'Second', url: 'https://example.com/2', summary: 'Second summary' },
					], raw: { fixture: 'raw-search' } };
				},
				close() { closes(service); },
			};
		},
	}));
	const cli = createWebCli({ providers, config: createMemoryCliConfigStore({
		services: [
			{ name: 'first', type: 'alpha' }, { name: 'second', type: 'beta' },
			{ name: 'off', type: 'alpha', disabled: true },
		], defaults: options.defaults,
	}) });
	const stdout = vi.fn();
	return { cli, calls, creates, closes, stdout, io: { signal: new AbortController().signal, stdout } };
}

describe('root search capability', () => {
	it('uses the builtin Exa provider for root search and chained fetch without reading secrets during help', async () => {
		const getEnv = vi.fn(() => 'fixture-exa-key');
		const fetch = vi.fn<typeof globalThis.fetch>(async (url) => String(url).endsWith('/search')
			? Response.json({ requestId: 'fixture', results: [{ title: 'Exa result', url: 'https://example.com/article', highlights: ['Useful highlight'] }] })
			: Response.json({ results: [{ title: 'Article', url: 'https://example.com/article', text: '# Article\n\nExa body' }] }));
		const cli = createWebCli({ fetch, getEnv, config: createMemoryCliConfigStore({
			services: [{ name: 'web', type: 'exa', baseUrl: 'https://exa.example', options: { apiKey: 'env:FIXTURE_EXA_KEY' } }],
			defaults: { search: 'web', fetch: 'web' },
		}) });
		const stdout = vi.fn();
		const io = { signal: new AbortController().signal, stdout };
		await cli.executeLine('search --help', io);
		await cli.executeLine('fetch --help', io);
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await expect(cli.executeLine('search query --limit 101', io)).rejects.toThrow('at most 100');
		expect(getEnv).not.toHaveBeenCalled();
		await cli.executeLine('search query --fetch --json', io);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ query: 'query', type: 'auto', contents: { highlights: { maxCharacters: 260 } } });
		expect(JSON.parse(stdout.mock.lastCall![0]).fetched[0]).toMatchObject({ service: 'web', content: '# Article\n\nExa body' });
	});

	it('requires an unambiguous enabled instance and lists candidates without creating clients', async () => {
		const fixture = rootFixture();
		await expect(fixture.cli.executeLine('search query', fixture.io)).rejects.toThrow('Select one search service');
		await expect(fixture.cli.executeLine('search query --service off', fixture.io)).rejects.toThrow('disabled');
		await fixture.cli.executeLine('search --list-services --json', fixture.io);
		expect(JSON.parse(fixture.stdout.mock.lastCall![0])).toEqual([
			{ name: 'first', provider: 'alpha', readOnly: true, default: false },
			{ name: 'second', provider: 'beta', readOnly: true, default: false },
		]);
		expect(fixture.creates).not.toHaveBeenCalled();
	});

	it('reads queries from the host stdin only during execution', async () => {
		const readText = vi.fn(async () => '  piped query\n');
		const fetch = fixtureFetch();
		const cli = createWebCli({ readText, fetch, config: createMemoryCliConfigStore({ services: [{ name: 'web', type: 'ddg' }] }) });
		const stdout = vi.fn();
		const io = { signal: new AbortController().signal, stdout };
		await cli.executeLine('search --help', io);
		expect(readText).not.toHaveBeenCalled();
		await cli.executeLine('search --json', io);
		expect(readText).toHaveBeenCalledExactlyOnceWith('-', { signal: io.signal, maxBytes: 16 * 1024 * 1024 });
		expect(JSON.parse(stdout.mock.lastCall![0]).query).toBe('piped query');
	});

	it('selects capability defaults, explicit overrides and provider aliases', async () => {
		const fixture = rootFixture({ defaults: { search: 'second', alpha: 'first' } });
		await fixture.cli.executeLine('search query --json', fixture.io);
		await fixture.cli.executeLine('search query --service first --json', fixture.io);
		await expect(fixture.cli.executeLine('search query --api alpha-alias', fixture.io)).rejects.toThrow('Default search service is unavailable');
		expect(fixture.calls.map((call) => call.service)).toEqual(['second', 'first']);
		const filtered = rootFixture();
		await filtered.cli.executeLine('search query --provider alpha-alias --output yaml', filtered.io);
		expect(parseYaml(filtered.stdout.mock.lastCall![0]).service).toBe('first');
	});

	it('keeps provider defaults as a fallback and rejects conflicting defaults', async () => {
		const fixture = rootFixture({ defaults: { alpha: 'first' } });
		await fixture.cli.executeLine('search query --json', fixture.io);
		expect(fixture.calls[0].service).toBe('first');
		const conflict = rootFixture({ defaults: { alpha: 'first', beta: 'second' } });
		await expect(conflict.cli.executeLine('search query', conflict.io)).rejects.toThrow('Conflicting default search');
		expect(conflict.creates).not.toHaveBeenCalled();
	});

	it('uses capability defaults configured by the shared service command', async () => {
		const fixture = rootFixture();
		await fixture.cli.executeLine('service default set search second', fixture.io);
		await fixture.cli.executeLine('service default set fetch first', fixture.io);
		await fixture.cli.executeLine('search query --fetch --json', fixture.io);
		expect(fixture.calls.map(({ service, tool }) => ({ service, tool }))).toEqual([
			{ service: 'second', tool: 'search' }, { service: 'first', tool: 'fetch' },
		]);
	});

	it('forwards the complete search request and preserves full text in JSON', async () => {
		const fixture = rootFixture();
		await fixture.cli.executeLine('search some query --service first --limit 3 --offset 2 --type deep --category news --include-domain example.com --include example.org --exclude-domain spam.example --time-range w --from 2026-01-01 --to 2026-06-01 --content --summary --no-highlights --live --max-characters 123 --json', fixture.io);
		expect(fixture.calls[0].input).toMatchObject({
			query: 'some query', limit: 3, offset: 2, searchType: 'deep', category: 'news',
			includeDomains: ['example.com', 'example.org'], excludeDomains: ['spam.example'], range: 'w', from: '2026-01-01', to: '2026-06-01',
			content: { text: true, summary: true, highlights: false, live: true, maxCharacters: 123 },
		});
		expect(JSON.parse(fixture.stdout.mock.lastCall![0]).results[0]).toMatchObject({ rank: 3, text: 'Full text', highlight: 'First highlight' });
		expect(fixture.closes).toHaveBeenCalledExactlyOnceWith('first');
	});

	it.each(['--limit 0', '--offset -1', '--max-characters nope', '--time-range bad', '--from bad', '--from 2026-06-01 --to 2026-01-01', '--fetch-rank 1 --fetch-limit 1', '--fetch-offset 1', '--raw', '--output bogus', '--include-domain ""'])('validates before creating clients: %s', async (flags) => {
		const fixture = rootFixture();
		await expect(fixture.cli.executeLine(`search query --service first ${flags}`, fixture.io)).rejects.toThrow();
		expect(fixture.creates).not.toHaveBeenCalled();
	});

	it('emits raw JSON and YAML and requests raw responses explicitly', async () => {
		const fixture = rootFixture();
		await fixture.cli.executeLine('search query --service first --raw --json', fixture.io);
		expect(JSON.parse(fixture.stdout.mock.lastCall![0])).toEqual({ fixture: 'raw-search' });
		await fixture.cli.executeLine('search query --service first --raw -o yaml', fixture.io);
		expect(parseYaml(fixture.stdout.mock.lastCall![0])).toEqual({ fixture: 'raw-search' });
		expect(fixture.calls.every((call) => (call.input as { raw?: boolean }).raw === true)).toBe(true);
	});

	it('chains ranked results through the independently selected fetch capability', async () => {
		const fixture = rootFixture({ defaults: { search: 'first', fetch: 'second' } });
		await fixture.cli.executeLine('search query --offset 4 --fetch-rank 6 --fetch-max-characters 80 --fetch-no-main --json', fixture.io);
		expect(fixture.calls).toEqual([
			expect.objectContaining({ service: 'first', tool: 'search' }),
			{ service: 'second', tool: 'fetch', input: expect.objectContaining({ url: 'https://example.com/2', maxCharacters: 80, main: false }) },
		]);
		expect(JSON.parse(fixture.stdout.mock.lastCall![0]).fetched[0]).toMatchObject({ rank: 6, service: 'second', content: '# Article\n\nFetched body' });
		expect(fixture.closes.mock.calls.flat().sort()).toEqual(['first', 'second']);
	});

	it('supports fetch slices and closes all created clients on chained failure', async () => {
		const fixture = rootFixture({ defaults: { search: 'first', fetch: 'second' }, failFetch: true });
		await expect(fixture.cli.executeLine('search query --fetch-limit 1 --fetch-offset 1', fixture.io)).rejects.toThrow('Fixture fetch failed');
		expect(fixture.calls[1].input).toMatchObject({ url: 'https://example.com/2' });
		expect(fixture.closes.mock.calls.flat().sort()).toEqual(['first', 'second']);
	});

	it.each([1, 2])('settles fetch failure at rank %s before cleanup and never starts later requests', async (failedRank) => {
		const events: string[] = [];
		let releasePending!: () => void;
		const pending = new Promise<void>((resolve) => { releasePending = resolve; });
		const fixture = rootFixture({
			defaults: { search: 'first', fetch: 'second' },
			async onFetch(url) {
				const rank = Number(url.slice(-1));
				events.push(`fetch-start:${rank}`);
				if (failedRank === 1 && rank === 2) await pending;
				else await Promise.resolve();
				if (rank === failedRank) {
					events.push(`fetch-failed:${rank}`);
					throw new Error('Fixture fetch failed');
				}
				events.push(`fetch-complete:${rank}`);
				return { url, content: `BODY${rank}` };
			},
		});
		fixture.closes.mockImplementation((service: string) => { events.push(`close:${service}`); });
		await expect(fixture.cli.executeLine('search query --fetch-limit 2 --json', fixture.io).catch((error) => {
			events.push('command-rejected');
			throw error;
		})).rejects.toThrow('Fixture fetch failed');
		// Release a request that the old parallel implementation left running after rejection.
		releasePending();
		await pending;
		await Promise.resolve();
		expect(events).toEqual([
			...(failedRank === 2 ? ['fetch-start:1', 'fetch-complete:1'] : []),
			`fetch-start:${failedRank}`, `fetch-failed:${failedRank}`,
			'close:first', 'close:second', 'command-rejected',
		]);
		expect(fixture.stdout).not.toHaveBeenCalled();
	});

	it('checks cancellation between sequential fetches before starting the next request', async () => {
		const controller = new AbortController();
		const fixture = rootFixture({
			defaults: { search: 'first', fetch: 'second' },
			async onFetch(url) {
				controller.abort(new Error('Cancelled between fetches'));
				return { url, content: 'Completed first fetch' };
			},
		});
		await expect(fixture.cli.executeLine('search query --fetch-limit 2 --json', {
			...fixture.io, signal: controller.signal,
		})).rejects.toThrow('Cancelled between fetches');
		expect(fixture.calls.filter((call) => call.tool === 'fetch')).toHaveLength(1);
		expect(fixture.closes.mock.calls.flat().sort()).toEqual(['first', 'second']);
		expect(fixture.stdout).not.toHaveBeenCalled();
	});

	it.each(['table', 'wide', 'csv', 'value'])('includes fetched content in %s output in rank order', async (format) => {
		const events: string[] = [];
		const fixture = rootFixture({
			defaults: { search: 'first', fetch: 'second' },
			async onFetch(url) {
				const rank = Number(url.slice(-1));
				events.push(`start:${rank}`);
				await Promise.resolve();
				events.push(`complete:${rank}`);
				return { url, title: `Fetched ${rank}`, content: `BODY${rank}` };
			},
		});
		await fixture.cli.executeLine(`search query --fetch-limit 2 --output ${format}`, { ...fixture.io, columns: 200 });
		const output = fixture.stdout.mock.lastCall![0];
		expect(output).toContain('BODY1');
		expect(output).toContain('BODY2');
		expect(output.indexOf('BODY1')).toBeLessThan(output.indexOf('BODY2'));
		expect(output).not.toContain('First highlight');
		expect(events).toEqual(['start:1', 'complete:1', 'start:2', 'complete:2']);
		if (format === 'value') expect(output).toBe('BODY1\nBODY2\n');
		else {
			expect(output).toContain('Fetched 1');
			expect(output).toContain('https://example.com/1');
			expect(output).toContain('second');
		}
	});

	it('rejects name output with fetching before creating clients or invoking search', async () => {
		const fixture = rootFixture({ defaults: { search: 'first', fetch: 'second' } });
		await expect(fixture.cli.executeLine('search query --fetch --output name', fixture.io)).rejects.toThrow(
			'Search fetching does not support name output; use value for fetched content',
		);
		expect(fixture.creates).not.toHaveBeenCalled();
		expect(fixture.calls).toEqual([]);
	});

	it.each(['table', 'wide', 'csv'])('keeps search rows in %s output when the fetch slice is empty', async (format) => {
		const fixture = rootFixture({ defaults: { search: 'first', fetch: 'second' } });
		await fixture.cli.executeLine(`search query --fetch-limit 2 --fetch-offset 2 --output ${format}`, {
			...fixture.io, columns: 200,
		});
		expect(fixture.stdout.mock.lastCall![0]).toContain('First highlight');
		expect(fixture.calls.map((call) => call.tool)).toEqual(['search']);
	});

	it('renders fetched Markdown with the search title, snippet and selected fetch service', async () => {
		const fixture = rootFixture({ defaults: { search: 'first', fetch: 'second' } });
		await fixture.cli.executeLine('search query --fetch --fetch-provider beta-alias', fixture.io);
		const markdown = fixture.stdout.mock.lastCall![0];
		expect(markdown).toContain('## 1. First');
		expect(markdown).toContain('Search snippet: First highlight');
		expect(markdown).toContain('Fetch service: second');
		expect(markdown).toContain('Fetched body');
	});

	it('runs the builtin root search in web and shell hosts', async () => {
		const fetch = fixtureFetch();
		const cli = createWebCli({ config: config(), fetch });
		const stdout = vi.fn();
		await cli.executeLine('search fixture -c search', { signal: new AbortController().signal, stdout });
		expect(stdout.mock.lastCall![0]).toContain('1. **Fixture**');
		const bash = new Bash({ customCommands: [createShellCommand({ config: config(), fetch })] });
		const result = await bash.exec('woctl search fixture -c search --json');
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout).results[0].title).toBe('Fixture');
	});
});
