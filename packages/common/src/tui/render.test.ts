import { describe, expect, it } from 'vitest';
import { extractMainMarkdown, renderTerminalMarkdown, renderTuiText, stripMarkdownComments } from './index';

describe('browser-safe wcli text rendering', () => {
	it('renders GFM headings, tables, lists and fences with explicit color control', () => {
		const source =
			'# Heading\n\n- **bold**\n- `code`\n\n| Name | Value |\n| --- | --- |\n| item | 42 |\n\n```ts\nconst n = 1;\n```';
		const plain = renderTerminalMarkdown(source, { color: false });
		expect(plain).toContain('Heading');
		expect(plain).toContain('- bold');
		expect(plain).toContain('Name');
		expect(plain).toContain('const n = 1;');
		expect(plain).not.toContain('\x1b');
		expect(renderTerminalMarkdown(source, { color: true })).toContain('\x1b[');
	});
	it('strips comments outside fences and does not emit unsafe links or raw ANSI', () => {
		const source = '<!-- hidden -->\n```html\n<!-- visible -->\n```';
		expect(stripMarkdownComments(source)).not.toContain('hidden');
		expect(stripMarkdownComments(source)).toContain('visible');
		const output = renderTerminalMarkdown('[bad](javascript:alert) [good](https://example.com)\n\x1b[31mraw', {
			color: false,
			link: 'always',
		});
		expect(output).not.toContain('javascript:');
		expect(output).not.toContain('\x1b');
		expect(output).toContain('https://example.com');
	});
	it('pretty prints JSON by filename and converts structured data between formats', () => {
		expect(renderTuiText('{"n":1}', { source: 'package.json' })).toBe('{\n  "n": 1\n}\n');
		expect(renderTuiText('[{"id":"01","text":"a,b"}]', { input: 'json', format: 'csv' })).toBe('id,text\n01,"a,b"\n');
		expect(JSON.parse(renderTuiText('n: 1', { input: 'yaml', format: 'json' }))).toEqual({ n: 1 });
		expect(() => renderTuiText('private-input', { input: 'json' })).toThrow('Invalid JSON input');
	});
	it('extracts main Markdown while retaining short content', () => {
		expect(
			extractMainMarkdown('# Article\n\nBody text\n\nPrivacy Policy', { title: 'Article', minChars: 0 }),
		).toContain('Body text');
		expect(extractMainMarkdown('short')).toBe('short');
	});
	it.each(['Menu', 'Sign in\nPrivacy policy', '\n\n'])('handles fully filtered Markdown: %j', (source) => {
		expect(extractMainMarkdown(source)).toBe(source.trim());
	});
});
