import { describe, expect, it, vi } from 'vitest';
import { createBaseFetchService } from '../providers/base';
import { createJinaFetchService } from '../providers/jina';
import { decodeHtmlEntities, extractMainMarkdown, htmlToReadableMarkdown } from './content';

describe('normalized page content', () => {
	it('extracts HTML main content as Markdown with optional full and raw content', async () => {
		const html =
			'<html><head><title>Page &amp; title</title></head><body><nav>Navigation</nav><main><h1>Page &amp; title</h1><p>Readable &#x1F600; body.</p><a href="https://example.test">Link</a></main><footer>Footer</footer><script>bad()</script></body></html>';
		const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
			expect(init?.cache).toBe('no-store');
			return new Response(html, { headers: { 'content-type': 'text/html' } });
		});
		const service = createBaseFetchService({ fetch });
		const result = await service.fetch({ url: 'https://example.test', live: true });
		expect(result.title).toBe('Page & title');
		expect(result.content).toBe('# Page & title\nReadable 😀 body.\n[Link](https://example.test)');
		expect(result).not.toHaveProperty('raw');
		const full = await service.fetch({
			url: 'https://example.test',
			live: true,
			main: false,
			raw: true,
			metadata: true,
		});
		expect(full.content).toContain('Navigation');
		expect(full.content).toContain('Footer');
		expect(full.content).not.toContain('bad()');
		expect(full.raw).toMatchObject({ content: html });
		expect(full.metadata).toMatchObject({ status: 200 });
	});

	it('does not remove fenced Markdown examples or return an empty extraction', () => {
		expect(extractMainMarkdown('```md\n# example\n```\nbody')).toBe('```md\n# example\n```\nbody');
		expect(extractMainMarkdown('Copyright © fixture')).toBe('Copyright © fixture');
		expect(decodeHtmlEntities('&#99999999; &amp; &#39;')).toBe("&#99999999; & '");
	});

	it('keeps complete nested main containers and all articles when no main exists', () => {
		expect(htmlToReadableMarkdown('<main><article>First</article><article>Second</article></main>')).toBe(
			'First\nSecond',
		);
		expect(htmlToReadableMarkdown('<main>First<main>Nested</main><article>Second</article></main>')).toContain(
			'Second',
		);
		expect(
			htmlToReadableMarkdown('<article>First<article>Nested</article>Tail</article><article>Second</article>'),
		).toBe('First Nested\nTail\nSecond');
		expect(htmlToReadableMarkdown('<article>Outside</article><main data-note=">">Inside</main>')).toBe('Inside');
	});

	it('finds titles only outside fenced examples and preserves matching fence boundaries', () => {
		const example = 'Intro\n```md\n# Page\ncode sample\n```\nActual body';
		expect(extractMainMarkdown(example, 'Page')).toBe(example);
		for (const [opening, mismatches, closing] of [
			['````md', ['~~~', '```', '```` trailing'], '`````'],
			['~~~~md', ['```', '~~~', '~~~~ trailing'], '~~~~~'],
		] as const) {
			const fenced = [opening, '# Page', ...mismatches, 'Copyright © code sample', closing].join('\n');
			const content = `Intro\n${fenced}\nActual body`;
			expect(extractMainMarkdown(content, 'Page')).toBe(content);
			expect(extractMainMarkdown(`${content}\n# Page\nActual section`, 'Page')).toBe('# Page\nActual section');
			expect(extractMainMarkdown(`# Page\n${fenced}\nBody\nCopyright © footer`, 'Page')).toBe(
				`# Page\n${fenced}\nBody`,
			);
		}
	});

	it('passes live requests to Jina and keeps opt-in raw responses free of authentication', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
			expect(new Headers(init?.headers).get('x-no-cache')).toBe('true');
			return Response.json({
				data: {
					title: 'Page',
					content: 'Navigation\n# Page\nText',
					description: 'Description',
					publishedTime: '2026-01-01',
				},
				echoed: 'fixture-key',
				authorization: 'Bearer fixture-key',
			});
		});
		const result = await createJinaFetchService({ fetch, apiKey: 'fixture-key' }).fetch({
			url: 'https://example.test',
			live: true,
			raw: true,
		});
		expect(result).toMatchObject({
			content: '# Page\nText',
			description: 'Description',
			publishedDate: '2026-01-01',
			raw: { echoed: '[REDACTED]' },
		});
		expect(JSON.stringify(result)).not.toContain('fixture-key');
	});
});
