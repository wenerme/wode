import { type CliCommand, CliUsageError } from '@wener/common/cli';
import { type RenderTuiTextOptions, renderTuiText, TuiTextRenderError } from 'common/tui';
import { optionNumber, optionString, readCommandText } from '../command-utils';
import type { CliExecution } from '../createCli';

export interface DocumentRenderOptions {
	input: 'pdf' | 'xlsx';
	format?: string;
	width?: number;
	color?: boolean;
	link?: 'auto' | 'always' | 'never';
	pages?: string;
	pageLimit?: number;
	password?: string;
	sheet?: string;
	range?: string;
	limit?: number;
	offset?: number;
	raw?: boolean;
	header?: boolean;
	signal: AbortSignal;
}

function command(markdown: boolean): CliCommand<CliExecution> {
	return {
		name: markdown ? 'markdown' : 'render',
		aliases: markdown ? ['md'] : undefined,
		description: markdown ? 'Render Markdown as terminal text' : 'Render Markdown, JSON, YAML, text, PDF or spreadsheets',
		arguments: '[source]',
		output: 'custom',
		options: [
			{ name: 'text', description: 'Inline text; skips file and stdin input' },
			{ name: 'input', description: 'auto | markdown | md | json | jsonl | yaml | code | text | pdf | xlsx' },
			{ name: 'format', aliases: ['f'], description: 'terminal | text | md | json | jsonl | yaml | csv | table' },
			{ name: 'output', aliases: ['o'], description: 'Output file; - or omitted for stdout' },
			{ name: 'width', description: 'Terminal display width, 20..4096' },
			{ name: 'color', type: 'boolean', negatable: true, description: 'ANSI styling; defaults to the host terminal setting' },
			{ name: 'link', description: 'auto | always | never; always enables OSC 8 links' },
			...(!markdown ? [
				{ name: 'pages', description: 'PDF page selection, e.g. 1,3-5' },
				{ name: 'page-limit', description: 'Maximum PDF pages to read' },
				{ name: 'password', description: 'PDF document password' },
				{ name: 'password-env', description: 'Environment variable containing the PDF password' },
				{ name: 'sheet', description: 'Spreadsheet sheet name or index' },
				{ name: 'range', description: 'Spreadsheet cell range, e.g. A1:D20' },
				{ name: 'limit', description: 'Maximum spreadsheet rows to read' },
				{ name: 'offset', description: 'Spreadsheet row offset' },
				{ name: 'raw', type: 'boolean' as const, description: 'Read raw spreadsheet cell values' },
				{ name: 'header', type: 'boolean' as const, negatable: true, description: 'Detect spreadsheet column headers' },
			] : []),
		],
		async run({ args, options }, context) {
			const inline = optionString(options, 'text');
			const source = args[0] ?? '-';
			if (inline !== undefined && args.length) throw new CliUsageError('Choose --text or a source file');
			const input = optionString(options, 'input') ?? (markdown ? 'markdown' : 'auto');
			if (!['auto', 'markdown', 'md', 'json', 'jsonl', 'yaml', 'code', 'text', ...(!markdown ? ['pdf', 'xlsx'] : [])].includes(input))
				throw new CliUsageError('Unsupported render input');
			const link = optionString(options, 'link') ?? 'auto';
			if (!['auto', 'always', 'never'].includes(link)) throw new CliUsageError('Invalid --link mode');
			const format = optionString(options, 'format');
			const destination = optionString(options, 'output');
			if (destination && destination !== '-' && !context.host.writeText)
				throw new CliUsageError('Host does not support file output');
			const width = optionNumber(options, 'width', { min: 20, max: 4096, integer: true }) ?? context.columns;
			const color = destination && destination !== '-' ? false
				: typeof options.color === 'boolean' ? options.color : (context.host.term?.stdoutIsTTY ?? false);
			const documentInput = input === 'pdf' || input === 'xlsx' ? input
				: input === 'auto' && inline === undefined && /\.pdf$/iu.test(source) ? 'pdf'
					: input === 'auto' && inline === undefined && /\.(xlsx|xlsm|xltx|xltm)$/iu.test(source) ? 'xlsx' : undefined;
			if (documentInput) {
				if (inline !== undefined || source === '-') throw new CliUsageError('PDF and spreadsheet rendering requires a source file');
				if (!context.host.renderDocument) throw new CliUsageError('Host does not support PDF or spreadsheet rendering');
				const pageLimit = optionNumber(options, 'page-limit', { min: 1, integer: true });
				const limit = optionNumber(options, 'limit', { min: 0, integer: true });
				const offset = optionNumber(options, 'offset', { min: 0, integer: true });
				const passwordEnv = optionString(options, 'password-env');
				const password = optionString(options, 'password');
				if (passwordEnv && password !== undefined) throw new CliUsageError('Choose --password or --password-env');
				if (format && !['terminal', 'text', 'md', 'markdown', 'json', 'jsonl', 'yaml', 'yml', 'csv', 'table'].includes(format))
					throw new CliUsageError('Unsupported document output format');
				const rendered = await context.host.renderDocument(source.replace(/^@/u, ''), {
					input: documentInput, format, width, color, link: link as DocumentRenderOptions['link'],
					pages: optionString(options, 'pages'), pageLimit,
					password: passwordEnv ? context.host.getEnv?.(passwordEnv) : password,
					sheet: optionString(options, 'sheet'), range: optionString(options, 'range'), limit, offset,
					raw: options.raw === true, header: options.header !== false, signal: context.signal,
				});
				context.signal.throwIfAborted();
				if (destination && destination !== '-') await context.host.writeText?.(destination, rendered, { signal: context.signal });
				else context.stdout(rendered);
				return;
			}
			const text =
				inline ?? (await readCommandText(source === '-' || source.startsWith('@') ? source : `@${source}`, context));
			let rendered: string;
			try {
				rendered = renderTuiText(text, {
					input: input as RenderTuiTextOptions['input'],
					format: format as RenderTuiTextOptions['format'],
					source: inline !== undefined || source === '-' ? undefined : source.replace(/^@/, ''),
					width,
					color,
					link: link as RenderTuiTextOptions['link'],
				});
			} catch (error) {
				if (error instanceof TuiTextRenderError || error instanceof RangeError) throw new CliUsageError(error.message);
				throw error;
			}
			context.signal.throwIfAborted();
			if (destination && destination !== '-')
				await context.host.writeText?.(destination, rendered, { signal: context.signal });
			else context.stdout(rendered);
		},
	};
}
export function createRenderCommands(): CliCommand<CliExecution>[] {
	return [command(false), command(true)];
}
