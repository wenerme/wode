import { renderCliOutput } from '@wener/common/cli/render/renderCliOutput';
import { parse as parseYaml } from 'yaml';
import { isKnownCodeSource, languageForSource, prettyJsonLinesText, prettyJsonText } from './code';
import { stripMarkdownComments } from './markdown-comments';
import { type ExtractMainMarkdownOptions, extractMainMarkdown } from './markdown-main';
import {
	type RenderTerminalMarkdownOptions,
	renderTerminalMarkdown,
	type TerminalMarkdownLinkMode,
} from './terminal-markdown';

export { isKnownCodeSource, languageForSource, prettyJsonLinesText, prettyJsonText } from './code';
export type { ExtractMainMarkdownOptions, RenderTerminalMarkdownOptions, TerminalMarkdownLinkMode };
export { extractMainMarkdown, renderTerminalMarkdown, stripMarkdownComments };

export type TuiTextInput = 'auto' | 'markdown' | 'md' | 'json' | 'jsonl' | 'yaml' | 'code' | 'text';
export type TuiTextFormat =
	| 'terminal'
	| 'text'
	| 'md'
	| 'markdown'
	| 'json'
	| 'jsonl'
	| 'yaml'
	| 'yml'
	| 'csv'
	| 'table'
	| 'wide'
	| 'describe'
	| 'desc'
	| 'name'
	| 'value';

export interface RenderTuiTextOptions extends RenderTerminalMarkdownOptions {
	input?: TuiTextInput;
	format?: TuiTextFormat;
	/** Filename-like value used for automatic input detection; it is never opened. */
	source?: string;
}

export class TuiTextRenderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TuiTextRenderError';
	}
}

const MarkdownExtensions = new Set(['md', 'markdown', 'mdown', 'mkd']);
const JsonExtensions = new Set(['json', 'jsonc']);
const JsonlExtensions = new Set(['jsonl', 'ndjson']);
const YamlExtensions = new Set(['yaml', 'yml']);
const Formats = new Set<TuiTextFormat>([
	'terminal',
	'text',
	'md',
	'markdown',
	'json',
	'jsonl',
	'yaml',
	'yml',
	'csv',
	'table',
	'wide',
	'describe',
	'desc',
	'name',
	'value',
]);

function sourceExtension(source: string | undefined): string {
	const filename = source?.split(/[\\/]/u).at(-1)?.toLowerCase() ?? '';
	return filename.includes('.') ? (filename.split('.').at(-1) ?? '') : '';
}

function normalizeInput(
	input: TuiTextInput | undefined,
	source: string | undefined,
): Exclude<TuiTextInput, 'auto' | 'md'> {
	if (input && input !== 'auto') return input === 'md' ? 'markdown' : input;
	const extension = sourceExtension(source);
	if (MarkdownExtensions.has(extension)) return 'markdown';
	if (JsonExtensions.has(extension)) return 'json';
	if (JsonlExtensions.has(extension)) return 'jsonl';
	if (YamlExtensions.has(extension)) return 'yaml';
	if (isKnownCodeSource(source)) return 'code';
	return source ? 'text' : 'markdown';
}

function normalizeFormat(format: string | undefined): TuiTextFormat {
	const value = (format ?? 'terminal').toLowerCase() as TuiTextFormat;
	if (!Formats.has(value)) throw new TuiTextRenderError(`Unsupported render format: ${format}`);
	return value;
}

function sourceText(text: string): string {
	return text.endsWith('\n') ? text : `${text}\n`;
}

function parseJson(text: string, input: 'json' | 'jsonl'): unknown {
	try {
		return input === 'jsonl'
			? text
					.split(/\r?\n/u)
					.filter((line) => line.trim())
					.map((line) => JSON.parse(line))
			: JSON.parse(text);
	} catch {
		throw new TuiTextRenderError(`Invalid ${input.toUpperCase()} input`);
	}
}

function parseData(text: string, input: 'json' | 'jsonl' | 'yaml'): unknown {
	if (input === 'yaml') {
		try {
			return parseYaml(text);
		} catch {
			throw new TuiTextRenderError('Invalid YAML input');
		}
	}
	return parseJson(text, input);
}

function renderData(value: unknown, format: TuiTextFormat, options: RenderTuiTextOptions): string {
	const output = format === 'terminal' || format === 'text' || format === 'table' ? 'table' : format;
	return renderCliOutput(value, { format: output, columns: options.width });
}

/**
 * Converts text already supplied by a host. This function performs no file, environment, or terminal access.
 */
export function renderTuiText(text: string, options: RenderTuiTextOptions = {}): string {
	const input = normalizeInput(options.input, options.source);
	const format = normalizeFormat(options.format);
	if (input === 'markdown') {
		if (format === 'md' || format === 'markdown') return sourceText(stripMarkdownComments(text));
		if (format !== 'terminal' && format !== 'text') throw new TuiTextRenderError(`Cannot render Markdown as ${format}`);
		return renderTerminalMarkdown(text, { ...options, color: format === 'text' ? false : options.color });
	}
	if (input === 'json' || input === 'jsonl' || input === 'yaml') {
		const value = parseData(text, input);
		if (format === 'terminal' || format === 'text') {
			if (input === 'json') return prettyJsonText(text);
			if (input === 'jsonl') return prettyJsonLinesText(text);
			return renderData(value, 'yaml', options);
		}
		return renderData(value, format, options);
	}
	if (format === 'terminal' || format === 'text') return sourceText(text);
	if (format === 'md' || format === 'markdown') {
		const language = languageForSource(options.source);
		return `\`\`\`${language ?? ''}\n${text.replace(/\n$/u, '')}\n\`\`\`\n`;
	}
	throw new TuiTextRenderError(`Cannot render ${input} as ${format}`);
}
