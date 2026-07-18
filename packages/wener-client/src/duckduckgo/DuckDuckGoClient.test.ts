import { describe, expect, it } from 'vite-plus/test';
import { DuckDuckGoClient, type DuckDuckGoClientError } from './index';

describe('DuckDuckGoClient', () => {
	it('uses the free Instant Answer API when it returns results', async () => {
		const calls: string[] = [];
		const client = new DuckDuckGoClient({
			fetch: async (input) => {
				calls.push(String(input));
				return new Response(
					JSON.stringify({
						Heading: 'OpenAI',
						AbstractText: 'OpenAI is an AI research organization.',
						AbstractURL: 'https://en.wikipedia.org/wiki/OpenAI',
						RelatedTopics: [
							{ FirstURL: 'https://duckduckgo.com/OpenAI', Text: 'OpenAI Topic', Result: '<a>OpenAI Topic</a>' },
						],
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } },
				);
			},
		});

		const response = await client.search('openai', { count: 2 });

		expect(calls).toHaveLength(1);
		expect(calls[0]).toContain('api.duckduckgo.com');
		expect(response.source).toBe('instant-answer');
		expect(response.results).toEqual([
			expect.objectContaining({
				title: 'OpenAI',
				url: 'https://en.wikipedia.org/wiki/OpenAI',
				snippet: 'OpenAI is an AI research organization.',
			}),
			expect.objectContaining({ title: 'OpenAI Topic', url: 'https://duckduckgo.com/OpenAI' }),
		]);
	});

	it('treats empty instant answer bodies as no results before html fallback', async () => {
		const calls: string[] = [];
		const client = new DuckDuckGoClient({
			fetch: async (input) => {
				calls.push(String(input));
				if (calls.length === 1) {
					return new Response('', { status: 202, headers: { 'content-type': 'application/x-javascript' } });
				}
				return new Response(
					'<div class="result"><a class="result__a" href="https://example.com/empty">Empty Fallback</a></div>',
					{
						status: 200,
						headers: { 'content-type': 'text/html' },
					},
				);
			},
		});

		const response = await client.search('empty');

		expect(calls).toHaveLength(2);
		expect(response.source).toBe('html');
		expect(response.results[0]).toMatchObject({ title: 'Empty Fallback', url: 'https://example.com/empty' });
	});

	it('passes offset to html search instead of Instant Answer', async () => {
		const calls: string[] = [];
		const client = new DuckDuckGoClient({
			fetch: async (input) => {
				calls.push(String(input));
				return new Response(
					'<div class="result"><a class="result__a" href="https://example.com/page2">Page 2</a></div>',
					{
						status: 200,
						headers: { 'content-type': 'text/html' },
					},
				);
			},
		});

		const response = await client.search('example', { count: 10, offset: 20 });

		expect(calls).toHaveLength(1);
		expect(calls[0]).toContain('html.duckduckgo.com');
		expect(calls[0]).toContain('s=20');
		expect(response.results[0]).toMatchObject({ title: 'Page 2', url: 'https://example.com/page2' });
	});

	it('falls back to html search and extracts result links', async () => {
		const calls: string[] = [];
		const client = new DuckDuckGoClient({
			fetch: async (input) => {
				calls.push(String(input));
				if (calls.length === 1) {
					return new Response(JSON.stringify({ Results: [], RelatedTopics: [] }), {
						status: 200,
						headers: { 'content-type': 'application/json' },
					});
				}
				return new Response(
					[
						'<div class="result results_links">',
						'<a class="result__a" href="/l/?uddg=https%3A%2F%2Fexample.com%2Fa">Example &amp; Result</a>',
						'<a class="result__snippet">Example snippet &amp; detail</a>',
						'</div>',
					].join(''),
					{ status: 200, headers: { 'content-type': 'text/html' } },
				);
			},
		});

		const response = await client.search('example', { count: 1, range: 'w' });

		expect(calls).toHaveLength(2);
		expect(calls[1]).toContain('html.duckduckgo.com');
		expect(calls[1]).toContain('df=w');
		expect(response.source).toBe('html');
		expect(response.results).toEqual([
			expect.objectContaining({
				title: 'Example & Result',
				url: 'https://example.com/a',
				snippet: 'Example snippet & detail',
			}),
		]);
	});

	it('deduplicates html results by canonical URL', async () => {
		const client = new DuckDuckGoClient({
			fetch: async (input) => {
				if (String(input).includes('api.duckduckgo.com')) {
					return new Response(JSON.stringify({ Results: [], RelatedTopics: [] }), {
						status: 200,
						headers: { 'content-type': 'application/json' },
					});
				}
				return new Response(
					[
						'<div class="result"><a class="result__a" href="https://example.com/a">First</a></div>',
						'<div class="result"><a class="result__a" href="https://example.com/a?ref=ddg">Duplicate</a></div>',
						'<div class="result"><a class="result__a" href="https://example.com/b">Second</a></div>',
					].join(''),
					{ status: 200, headers: { 'content-type': 'text/html' } },
				);
			},
		});

		const response = await client.search('dedupe', { count: 10 });

		expect(response.results.map((item) => item.url)).toEqual(['https://example.com/a', 'https://example.com/b']);
	});

	it('throws DuckDuckGoClientError with response details', async () => {
		const client = new DuckDuckGoClient({
			fetch: async () => new Response('blocked', { status: 403, statusText: 'Forbidden' }),
		});

		await expect(client.instantAnswer('blocked')).rejects.toMatchObject({
			name: 'DuckDuckGoClientError',
			status: 403,
			message: expect.stringContaining('403'),
		} satisfies Partial<DuckDuckGoClientError>);
	});
});
