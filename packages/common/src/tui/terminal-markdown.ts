import { getAnsiStyle, stripAnsi } from '@wener/utils/ansi';
import { marked, type Token, type Tokens } from 'marked';
import stringWidth from 'string-width';
import { stripMarkdownComments } from './markdown-comments';

export type TerminalMarkdownLinkMode = 'auto' | 'always' | 'never';

export interface RenderTerminalMarkdownOptions {
	width?: number;
	/** Explicit only: the renderer never reads process, environment variables, or a terminal stream. */
	color?: boolean;
	link?: TerminalMarkdownLinkMode;
}

interface RenderContext {
	width: number;
	color: boolean;
	link: TerminalMarkdownLinkMode;
	style: ReturnType<typeof getAnsiStyle>;
}

const UnsafeLinkScheme = /^(?:javascript|data|vbscript):/iu;
const EscapeSequence = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][\s\S]*?(?:\x07|\x1b\\))/gu;

function visibleWidth(value: string): number {
	return stringWidth(stripAnsi(value).replace(EscapeSequence, ''));
}

function pad(value: string, width: number): string {
	return `${value}${' '.repeat(Math.max(0, width - visibleWidth(value)))}`;
}

function wrapText(value: string, width: number): string {
	if (width < 8 || visibleWidth(value) <= width) return value;
	const lines: string[] = [];
	let line = '';
	for (const word of value.split(/\s+/u)) {
		if (!word) continue;
		const candidate = line ? `${line} ${word}` : word;
		if (line && visibleWidth(candidate) > width) {
			lines.push(line);
			line = word;
		} else line = candidate;
	}
	if (line) lines.push(line);
	return lines.join('\n');
}

function safeHref(href: string): string | undefined {
	const value = href.trim();
	if (!value || UnsafeLinkScheme.test(value) || /[\u0000-\u001f\u007f]/u.test(value)) return undefined;
	return value;
}

function osc8(text: string, href: string): string {
	return `\x1b]8;;${href}\x1b\\${text}\x1b]8;;\x1b\\`;
}

function inline(tokens: Token[] | undefined, context: RenderContext): string {
	if (!tokens) return '';
	return tokens.map((token) => renderInline(token, context)).join('');
}

function renderInline(token: Token, context: RenderContext): string {
	switch (token.type) {
		case 'text':
			return token.tokens ? inline(token.tokens, context) : token.text;
		case 'escape':
			return token.text;
		case 'strong':
			return context.style.bold(inline(token.tokens, context));
		case 'em':
			return context.style.italic(inline(token.tokens, context));
		case 'del':
			return context.style.strikethrough(inline(token.tokens, context));
		case 'codespan':
			return context.style.cyan(token.text);
		case 'br':
			return '\n';
		case 'checkbox':
			return token.checked ? '[x] ' : '[ ] ';
		case 'link': {
			const text = inline(token.tokens, context) || token.text || token.href;
			const href = safeHref(token.href);
			if (!href) return text;
			const styled = context.style.blue.underline(text);
			if (context.color && context.link === 'always') return osc8(styled, href);
			return `${styled} (${context.style.blue(href)})`;
		}
		case 'image': {
			const href = safeHref(token.href);
			const label = token.text || 'image';
			return href ? `[image: ${label}] (${href})` : `[image: ${label}]`;
		}
		case 'html':
			return token.text.replace(/<[^>]*>/gu, '');
		default:
			return 'text' in token && typeof token.text === 'string' ? token.text : '';
	}
}

function prefixLines(value: string, first: string, rest: string): string {
	return value
		.split('\n')
		.map((line, index) => `${index === 0 ? first : rest}${line}`)
		.join('\n');
}

function renderList(token: Tokens.List, context: RenderContext, indent = ''): string {
	return token.items
		.map((item, index) => {
			const marker = item.task
				? item.checked
					? '[x] '
					: '[ ] '
				: token.ordered
					? `${Number(token.start || 1) + index}. `
					: '- ';
			const body = renderBlocks(item.tokens, context, indent + '  ').trim();
			return prefixLines(body, `${indent}${marker}`, `${indent}${' '.repeat(marker.length)}`);
		})
		.join('\n');
}

function distributeWidths(natural: number[], available: number): number[] {
	const widths = natural.map((width) => Math.max(3, Math.min(width, 36)));
	while (widths.reduce((sum, width) => sum + width, 0) > available) {
		const index = widths.reduce((largest, width, current) => (width > widths[largest] ? current : largest), 0);
		if (widths[index] <= 3) break;
		widths[index] -= 1;
	}
	return widths;
}

function renderTable(token: Tokens.Table, context: RenderContext): string {
	const cells = [token.header, ...token.rows].map((row) =>
		row.map((cell) => inline(cell.tokens, context) || cell.text),
	);
	if (!cells.length || !cells[0]?.length) return '';
	const count = cells[0].length;
	const natural = Array.from({ length: count }, (_, index) =>
		Math.max(3, ...cells.map((row) => visibleWidth(row[index] ?? ''))),
	);
	const widths = distributeWidths(natural, Math.max(count * 3, context.width - count * 3 - 1));
	const border = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
	const renderRow = (row: string[], header = false) => {
		const lines = row.map((cell, index) => wrapText(cell, widths[index]).split('\n'));
		const height = Math.max(...lines.map((item) => item.length));
		return Array.from({ length: height }, (_, rowIndex) => {
			const line = lines.map((column, index) => pad(column[rowIndex] ?? '', widths[index])).join(' | ');
			return `| ${header ? context.style.bold(line) : line} |`;
		}).join('\n');
	};
	return [border, renderRow(cells[0], true), border, ...cells.slice(1).map((row) => renderRow(row)), border].join('\n');
}

function renderBlocks(tokens: Token[], context: RenderContext, indent = ''): string {
	const blocks: string[] = [];
	for (const token of tokens) {
		switch (token.type) {
			case 'space':
			case 'def':
				break;
			case 'heading':
				blocks.push(context.style.bold.cyan(inline(token.tokens, context)));
				break;
			case 'paragraph':
				blocks.push(wrapText(inline(token.tokens, context), Math.max(8, context.width - indent.length)));
				break;
			case 'text':
				blocks.push(wrapText(inline([token], context), Math.max(8, context.width - indent.length)));
				break;
			case 'code':
				blocks.push(token.text);
				break;
			case 'blockquote':
				blocks.push(
					prefixLines(renderBlocks(token.tokens ?? [], context, `${indent}> `).trim(), `${indent}> `, `${indent}> `),
				);
				break;
			case 'list':
				blocks.push(renderList(token as Tokens.List, context, indent));
				break;
			case 'table':
				blocks.push(renderTable(token as Tokens.Table, context));
				break;
			case 'hr':
				blocks.push(context.style.dim('-'.repeat(Math.max(3, Math.min(context.width, 40)))));
				break;
			case 'html': {
				const text = token.text.replace(/<[^>]*>/gu, '').trim();
				if (text) blocks.push(text);
				break;
			}
			default: {
				const text = inline([token], context).trim();
				if (text) blocks.push(text);
			}
		}
	}
	return blocks.join('\n\n');
}

/** Renders GFM Markdown without inspecting Node globals or terminal capabilities. */
export function renderTerminalMarkdown(markdown: string, options: RenderTerminalMarkdownOptions = {}): string {
	const color = options.color === true;
	const context: RenderContext = {
		width: Math.max(20, Math.floor(options.width ?? 80)),
		color,
		link: options.link ?? 'auto',
		style: getAnsiStyle(color),
	};
	const tokens = marked.lexer(stripAnsi(stripMarkdownComments(markdown)), { gfm: true, breaks: false });
	const rendered = renderBlocks(tokens, context)
		.replace(/\n{3,}/gu, '\n\n')
		.trimEnd();
	return rendered ? `${rendered}\n` : '';
}
