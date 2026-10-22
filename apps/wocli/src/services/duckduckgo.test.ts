import { Cli, type CliContext } from '@wener/common/cli';
import { type CliServiceConfig, parseCliConfig, resolveCliContext } from 'common/context';
import { createServiceRuntime, ServiceProviderRegistry } from 'common/service';
import { createServiceCliCommand } from 'common/service/cli';
import { createRemoteServiceToolClient } from 'common/service/runtime/client';
import { describe, expect, it, vi } from 'vitest';
import { createDuckDuckGoProvider, DuckDuckGoCliDefinition, type DuckDuckGoServiceClient } from './duckduckgo';

function context() {
	return resolveCliContext(parseCliConfig({ services: [{ name: 'search', type: 'duckduckgo' }] }));
}

function binding(fetch: typeof globalThis.fetch, config: Partial<CliServiceConfig> = {}) {
	return createDuckDuckGoProvider().create({
		name: 'search',
		config: { provider: 'duckduckgo', readOnly: true, ...config },
		context: context(),
		fetch,
	});
}

function answer() {
	return Response.json({
		Heading: 'Example',
		AbstractURL: 'https://example.com/first',
		AbstractText: 'First result',
		RelatedTopics: [{ FirstURL: 'https://example.com/second', Text: 'Second result' }],
	});
}

describe('DuckDuckGo service binding', () => {
	it('exposes static read-only schema without reading client configuration or fetching', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const options = vi.fn(() => {
			throw new Error('PRIVATE_CONFIG');
		});
		const provider = createDuckDuckGoProvider();
		expect(provider.name).toBe('duckduckgo');
		const client = await provider.create({
			name: 'search',
			config: {
				provider: 'duckduckgo',
				readOnly: true,
				get options() {
					return options();
				},
			},
			context: context(),
			fetch,
		});
		const schema = await client.getSchema();
		expect(schema.tools.search.annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
		expect(schema.tools.search.inputSchema).toMatchObject({ required: ['query'], additionalProperties: false });
		delete schema.tools.search;
		expect((await client.getSchema()).tools.search).toBeDefined();
		expect(options).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await expect(client.call('search', { query: 'example' })).rejects.toThrow(
			'Invalid DuckDuckGo service configuration',
		);
		expect(options).toHaveBeenCalledTimes(1);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('maps baseUrl, headers, userAgent and limit while preserving the client response', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => answer());
		const client = await binding(fetch, {
			baseUrl: 'https://example.com/instant/',
			headers: { authorization: 'Bearer FIXTURE_TOKEN' },
			options: { userAgent: 'fixture-agent', timeout: 1000 },
		});
		const result = await client.call('search', { query: 'two words', limit: 1 });
		expect(result).toMatchObject({
			query: 'two words',
			source: 'instant-answer',
			results: [{ title: 'Example' }],
			raw: { Heading: 'Example' },
		});
		expect(fetch).toHaveBeenCalledTimes(1);
		const [input, init] = fetch.mock.calls[0];
		const url = new URL(String(input));
		expect(url.origin + url.pathname).toBe('https://example.com/instant/');
		expect(url.searchParams.get('q')).toBe('two words');
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer FIXTURE_TOKEN');
		expect(new Headers(init?.headers).get('user-agent')).toBe('fixture-agent');
	});

	it('uses explicit Instant Answer override and HTML fallback endpoints', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(Response.json({}))
			.mockResolvedValueOnce(new Response('<a class="result__a" href="https://example.com/result">Result</a>'));
		const client = await binding(fetch, {
			baseUrl: 'https://example.com/base/',
			options: { instantAnswerBaseUrl: 'https://example.com/override/', htmlBaseUrl: 'https://example.com/html/' },
		});
		await expect(client.call('search', { query: 'example' })).resolves.toMatchObject({
			source: 'html',
			results: [{ title: 'Result' }],
		});
		expect(String(fetch.mock.calls[0][0])).toContain('https://example.com/override/');
		expect(String(fetch.mock.calls[1][0])).toContain('https://example.com/html/');
	});

	it('passes offset directly to HTML search and applies limit', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () =>
				new Response(
					[
						'<a class="result__a" href="https://example.com/first">First</a>',
						'<a class="result__a" href="https://example.com/second">Second</a>',
					].join(''),
				),
		);
		const client = await binding(fetch, { options: { htmlBaseUrl: 'https://example.com/html/' } });
		await expect(client.call('search', { query: 'example', limit: 1, offset: 20 })).resolves.toMatchObject({
			source: 'html',
			results: [{ title: 'First' }],
		});
		expect(fetch).toHaveBeenCalledTimes(1);
		const url = new URL(String(fetch.mock.calls[0][0]));
		expect(url.pathname).toBe('/html/');
		expect(url.searchParams.get('s')).toBe('20');
	});

	it.each([
		null,
		[],
		'query',
		{},
		{ query: '' },
		{ query: ' \t\n' },
		{ query: 42 },
		{ query: 'ok', limit: 0 },
		{ query: 'ok', limit: -1 },
		{ query: 'ok', limit: 1.5 },
		{ query: 'ok', limit: '1' },
		{ query: 'ok', limit: null },
		{ query: 'ok', limit: Number.NaN },
		{ query: 'ok', limit: Infinity },
		{ query: 'ok', offset: -1 },
		{ query: 'ok', offset: 0.5 },
		{ query: 'ok', offset: '1' },
		{ query: 'ok', offset: Number.MAX_SAFE_INTEGER + 1 },
		{ query: 'ok', count: 1 },
		{ query: 'ok', signal: {} },
	])('validates direct call input before creating the client: %j', async (input) => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await binding(fetch, { options: { unknown: 'invalid-config' } });
		await expect(client.call('search', input)).rejects.toThrow(/DuckDuckGo (search|limit|offset)/);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('rejects unsupported tool names without echoing the name', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await binding(fetch);
		await expect(client.call('PRIVATE_TOOL', {})).rejects.toThrow(/^Unknown DuckDuckGo operation$/);
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each([
		{ options: { unknown: 'PRIVATE_CONFIG' } },
		{ options: { fetch: 'PRIVATE_CONFIG' } },
		{ options: { timeout: '1000' } },
		{ options: { timeout: 0 } },
		{ options: { timeout: 0.5 } },
		{ options: { timeout: 2_147_483_648 } },
		{ options: { timeout: null } },
		{ options: { userAgent: 42 } },
		{ options: { userAgent: '' } },
		{ options: { userAgent: 'PRIVATE\nCONFIG' } },
		{ options: { htmlBaseUrl: 42 } },
		{ options: { htmlBaseUrl: 'file:///PRIVATE_CONFIG' } },
		{ options: { instantAnswerBaseUrl: 'PRIVATE_CONFIG' } },
		{ options: { instantAnswerBaseUrl: 'https://user:PRIVATE_CONFIG@example.com' } },
		{ baseUrl: 'PRIVATE_CONFIG' },
		{ baseUrl: 'ftp://example.com/PRIVATE_CONFIG' },
		{ headers: { 'bad header': 'PRIVATE_CONFIG' } },
		{ headers: { authorization: 'PRIVATE\nCONFIG' } },
	])('rejects invalid type-specific configuration without fetching: %j', async (config) => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await binding(fetch, config as Partial<CliServiceConfig>);
		await expect(client.getSchema()).resolves.toHaveProperty('tools.search');
		await expect(client.call('search', { query: 'example' })).rejects.toThrow(
			/^Invalid DuckDuckGo service configuration$/,
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each(['http', 'transport', 'body', 'abort'] as const)(
		'redacts %s errors including nested response details',
		async (kind) => {
			const secret = 'https://example.com/PRIVATE_ENDPOINT Bearer PRIVATE_HEADER PRIVATE_BODY';
			const fetch = vi.fn<typeof globalThis.fetch>(async () => {
				if (kind === 'transport') throw new Error(secret);
				if (kind === 'abort') throw new DOMException(secret, 'AbortError');
				const response = new Response(secret, { status: kind === 'http' ? 403 : 200, statusText: 'PRIVATE_STATUS' });
				if (kind === 'body') vi.spyOn(response, 'text').mockRejectedValue(new Error(secret));
				return response;
			});
			const client = await binding(fetch, {
				baseUrl: 'https://example.com/PRIVATE_ENDPOINT',
				headers: { authorization: 'Bearer PRIVATE_HEADER' },
			});
			const error = await client.call('search', { query: 'example' }).catch((error: unknown) => error);
			expect(error).toBeInstanceOf(Error);
			expect(String(error)).toBe(
				kind === 'abort' ? 'AbortError: DuckDuckGo search aborted' : 'Error: DuckDuckGo search failed',
			);
			expect(JSON.stringify(error)).not.toContain('PRIVATE');
			expect(error).not.toHaveProperty('cause');
			expect(error).not.toHaveProperty('response');
			expect(error).not.toHaveProperty('data');
		},
	);

	it('keeps caller cancellation before dispatch and during fetch with timeout enabled', async () => {
		const controller = new AbortController();
		const reason = new Error('Caller cancellation');
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			controller.abort(reason);
			expect(init?.signal?.aborted).toBe(true);
			throw new Error('PRIVATE_TRANSPORT');
		});
		const client = await binding(fetch, { options: { timeout: 1000 } });
		await expect(client.call('search', { query: 'example' }, { signal: controller.signal })).rejects.toBe(reason);
		await expect(client.call('search', { query: 'example' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('validates generic runtime calls that bypass CLI prepare and permits read-only search', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => answer());
		const runtime = createServiceRuntime({
			context: context(),
			providers: new ServiceProviderRegistry([createDuckDuckGoProvider()]),
			fetch,
		});
		try {
			await expect(
				runtime.call({
					params: { service: 'search' },
					body: { toolName: 'search', input: { query: 'example', limit: '1' } },
				}),
			).rejects.toThrow('DuckDuckGo limit');
			expect(fetch).not.toHaveBeenCalled();
			await expect(
				runtime.call({
					params: { service: 'search' },
					body: { toolName: 'search', input: { query: 'example', limit: 1 } },
				}),
			).resolves.toMatchObject({ results: [{ title: 'Example' }] });
		} finally {
			await runtime.close();
		}
	});
});

describe('DuckDuckGo CLI definition', () => {
	it('executes search and ddg alias through a typed runtime client while keeping help offline', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => answer());
		const runtime = createServiceRuntime({
			context: context(),
			providers: new ServiceProviderRegistry([createDuckDuckGoProvider()]),
			fetch,
		});
		const cli = new Cli<CliContext>('fixture');
		const readText = vi.fn(async () => {
			throw new Error('Must not read files');
		});
		const createClient = vi.fn(() => createRemoteServiceToolClient<DuckDuckGoServiceClient>(runtime, 'search'));
		cli.add(
			createServiceCliCommand(DuckDuckGoCliDefinition, {
				readText,
				async run(_operation, _options, context: CliContext, prepare) {
					const invoke = await prepare();
					context.stdout(JSON.stringify(await invoke(await createClient(), { signal: context.signal })));
				},
			}),
		);
		const io = { signal: new AbortController().signal, stdout: vi.fn() };
		try {
			await cli.execute(['ddg', 'search', '--help'], io);
			expect(createClient).not.toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
			await expect(cli.execute(['ddg', 'search', 'example', '--limit', '0'], io)).rejects.toThrow('DuckDuckGo limit');
			expect(createClient).not.toHaveBeenCalled();
			for (const name of ['duckduckgo', 'ddg']) {
				await cli.execute([name, 'search', 'two words', '--limit', '1', '--offset', '0'], io);
				expect(JSON.parse(io.stdout.mock.lastCall![0])).toMatchObject({
					query: 'two words',
					results: [{ title: 'Example' }],
				});
			}
			expect(fetch).toHaveBeenCalledTimes(2);
			expect(readText).not.toHaveBeenCalled();
		} finally {
			await runtime.close();
		}
	});

	it.each(['', ' ', '1.5', '-1', '1e2', '0x10', 'Infinity', '9007199254740992'])(
		'rejects malformed numeric CLI options: %j',
		async (limit) => {
			const operation = DuckDuckGoCliDefinition.commands[0];
			expect(() => operation.prepare({ args: ['example'], options: { limit }, readText: vi.fn() })).toThrow();
		},
	);
});
