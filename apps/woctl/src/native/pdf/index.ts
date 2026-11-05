import { mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	type CliCommand,
	type CliOption,
	type CliOptions,
	CliUsageError,
	renderCliOutput,
	resolveCliOutputSelection,
} from '@wener/common/cli';
import type { PdfInspectOptions, PdfReadOptions } from 'common/pdf';
import { optionNumber, optionString } from '../../command-utils';
import type { WoctlCommand, CliExecution } from '../../createCli';

const flag = (name: string, description: string): CliOption => ({ name, description, type: 'boolean' });
const value = (name: string, description: string): CliOption => ({ name, description });
const pageOptions = [
	value('pages', 'Pages: 1,3-5,last,odd,even,all'),
	value('page-limit', 'Read first N pages when --pages is omitted'),
];
const passwordOptions = [
	value('password', 'PDF password'),
	value('password-env', 'Read PDF password from the named environment variable'),
];
const verbosityOption = value('verbosity', 'PDF.js verbosity: errors | warnings | infos (default: errors)');
const outputOptions: CliOption[] = [
	{ name: 'output', aliases: ['o'], description: 'Output format: md | json | yaml | table (default: md)' },
	{ name: 'format', aliases: ['f'], description: 'Field projection for structured output or template list' },
	flag('json', 'Output JSON'),
	value('output-file', 'Write text output to a file; - or omitted for stdout'),
	flag('in-place', 'Allow an output path that overwrites the source file'),
];
function positive(options: CliOptions, name: string, integer = true): number | undefined {
	return optionNumber(options, name, { min: integer ? 1 : Number.MIN_VALUE, integer });
}
function password(options: CliOptions, context: CliExecution): string | undefined {
	const env = optionString(options, 'password-env');
	return env ? context.host.getEnv?.(env) : optionString(options, 'password');
}
function verbosity(options: CliOptions): PdfReadOptions['verbosity'] {
	const level = (optionString(options, 'verbosity') ?? 'errors').trim().toLowerCase();
	if (level !== 'errors' && level !== 'warnings' && level !== 'infos')
		throw new CliUsageError('Invalid --verbosity; expected errors | warnings | infos');
	return level;
}
function readOptions(options: CliOptions, context: CliExecution): PdfReadOptions {
	const result: PdfReadOptions = {
		pages: optionString(options, 'pages'),
		pageLimit: positive(options, 'page-limit'),
		verbosity: verbosity(options),
		includeFrontmatter: options.frontmatter === true,
		includePageHeadings: options['page-headings'] !== false,
		preserveEmptyPages: options['preserve-empty-pages'] === true,
		lineGap: positive(options, 'line-gap', false),
	};
	result.password = password(options, context);
	return result;
}
function inspectOptions(options: CliOptions, context: CliExecution): PdfInspectOptions {
	const detail = options.debug
		? 'debug'
		: options.full
			? 'full'
			: options.brief
				? 'brief'
				: (optionString(options, 'detail') ?? 'normal').trim().toLowerCase();
	if (!['brief', 'normal', 'full', 'debug'].includes(detail))
		throw new CliUsageError('Invalid --detail; expected brief | normal | full | debug');
	return {
		detail: detail as PdfInspectOptions['detail'],
		pages: optionString(options, 'pages'),
		pageLimit: positive(options, 'page-limit'),
		allPages: options['all-pages'] === true,
		strict: options.strict === true,
		verbosity: verbosity(options),
		includePages: options['skip-pages'] ? false : undefined,
		includeMetadata: options['skip-metadata'] ? false : undefined,
		includeViewer: options['skip-viewer'] ? false : undefined,
		includeOutline: options['skip-outline'] ? false : undefined,
		includeAttachments: options['skip-attachments'] ? false : undefined,
		includeAnnotations: options.annotations === true ? true : undefined,
		includeText: options.text === true ? true : undefined,
		includeOperators: options.operators === true ? true : undefined,
		includeStructTree: options['struct-tree'] === true ? true : undefined,
		includeJs: options.js === true ? true : undefined,
		includeForms: options.forms === true ? true : undefined,
		includeDestinations: options.destinations === true ? true : undefined,
		includeOptionalContent: options['optional-content'] === true ? true : undefined,
		raw: options.raw === true ? true : undefined,
		timings: options.timings === true ? true : undefined,
		textLimit: positive(options, 'text-limit'),
		annotationLimit: positive(options, 'annotation-limit'),
		outlineLimit: positive(options, 'outline-limit'),
		outlineDepth: positive(options, 'outline-depth'),
		maxArray: positive(options, 'max-array'),
		maxDepth: positive(options, 'max-depth'),
		password: password(options, context),
	};
}
function selection(options: CliOptions) {
	return resolveCliOutputSelection({ ...options, output: options.json ? 'json' : (options.output ?? 'md') });
}
async function renderResult(
	result: unknown,
	markdown: string,
	options: CliOptions,
	context: CliExecution,
): Promise<string> {
	const selected = selection(options);
	if (selected.format === 'md' || selected.format === 'markdown') return markdown;
	if (
		selected.format === 'json' ||
		selected.format === 'yaml' ||
		selected.format === 'yml' ||
		selected.format === 'jsonl' ||
		selected.format === 'csv' ||
		selected.format === 'name' ||
		selected.format === 'value'
	)
		return renderCliOutput(result, { ...selected, columns: context.columns });
	const { renderTuiText } = await import('common/tui');
	return renderTuiText(markdown, {
		input: 'markdown',
		format: 'terminal',
		color: context.host.term?.stdoutIsTTY ?? false,
		width: context.columns,
	});
}
async function assertOutputPath(source: string | undefined, output: string, inPlace: boolean): Promise<void> {
	if (!source || inPlace) return;
	if (path.resolve(source) === path.resolve(output))
		throw new CliUsageError('Output would overwrite the source; pass --in-place explicitly');
	try {
		const [sourcePath, outputPath, sourceStat, outputStat] = await Promise.all([
			realpath(source),
			realpath(output),
			stat(source),
			stat(output),
		]);
		if (sourcePath === outputPath || (sourceStat.dev === outputStat.dev && sourceStat.ino === outputStat.ino))
			throw new CliUsageError('Output would overwrite the source; pass --in-place explicitly');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
}
async function emit(text: string, source: string | undefined, options: CliOptions, context: CliExecution) {
	context.signal.throwIfAborted();
	const output = optionString(options, 'output-file');
	if (!output || output === '-') {
		context.stdout(text);
		return;
	}
	await assertOutputPath(source, output, options['in-place'] === true);
	if (!context.host.writeText) throw new CliUsageError('Host does not support text file output');
	await context.host.writeText(output, text, { signal: context.signal });
}
function textCommand(command: CliCommand<CliExecution>): WoctlCommand {
	return { ...command, output: 'custom', options: [...(command.options ?? []), ...outputOptions] };
}
function createInfoCommand(): WoctlCommand {
	return textCommand({
		name: 'info',
		description: 'Read PDF metadata, page sizes, outline and attachments',
		arguments: '<file>',
		options: [
			value('page-limit', 'Number of pages to sample (default: 20)'),
			flag('all-pages', 'Inspect all pages'),
			...passwordOptions,
		],
		async run({ args, options }, context) {
			selection(options);
			const pageLimit = positive(options, 'page-limit');
			const { readPdfInfo } = await import('common/pdf');
			const { renderPdfInfoMarkdown } = await import('common/pdf/markdown');
			const result = await readPdfInfo(args[0]!, {
				pageLimit,
				allPages: options['all-pages'] === true,
				password: password(options, context),
			});
			await emit(
				await renderResult(result, renderPdfInfoMarkdown(result), options, context),
				args[0],
				options,
				context,
			);
		},
	});
}
function createInspectCommand(): WoctlCommand {
	return textCommand({
		name: 'inspect',
		description: 'Explore PDF internals for extraction planning',
		arguments: '<file>',
		options: [
			value('detail', 'Detail: brief | normal | full | debug (default: normal)'),
			flag('brief', 'Use brief detail'),
			flag('full', 'Use full detail'),
			flag('debug', 'Use debug detail'),
			...pageOptions,
			flag('all-pages', 'Inspect every page'),
			flag('skip-pages', 'Skip page inspection'),
			flag('skip-metadata', 'Skip metadata'),
			flag('skip-viewer', 'Skip viewer metadata'),
			flag('skip-outline', 'Skip bookmarks'),
			flag('skip-attachments', 'Skip attachments'),
			flag('annotations', 'Include page annotations'),
			flag('text', 'Include bounded page text'),
			flag('operators', 'Include operator statistics'),
			flag('struct-tree', 'Include page structure tree'),
			flag('js', 'Include JavaScript action summaries'),
			flag('forms', 'Include form field summary'),
			flag('destinations', 'Include named destinations'),
			flag('optional-content', 'Include optional content configuration'),
			flag('raw', 'Include bounded raw previews'),
			flag('timings', 'Include timing measurements'),
			value('text-limit', 'Maximum text sample characters per page'),
			value('annotation-limit', 'Maximum annotations per page'),
			value('outline-limit', 'Maximum outline items'),
			value('outline-depth', 'Maximum outline depth'),
			value('max-array', 'Maximum raw array/object entries'),
			value('max-depth', 'Maximum raw preview depth'),
			verbosityOption,
			flag('strict', 'Fail on the first PDF.js section error'),
			...passwordOptions,
		],
		async run({ args, options }, context) {
			selection(options);
			const parsed = inspectOptions(options, context);
			const { inspectPdf } = await import('common/pdf');
			const { renderPdfInspectMarkdown } = await import('common/pdf/markdown');
			const result = await inspectPdf(args[0]!, parsed);
			await emit(
				await renderResult(result, renderPdfInspectMarkdown(result), options, context),
				args[0],
				options,
				context,
			);
		},
	});
}
function createReadCommand(): WoctlCommand {
	return textCommand({
		name: 'read',
		description: 'Read PDF text as Markdown',
		arguments: '<file>',
		options: [
			...pageOptions,
			flag('frontmatter', 'Include YAML frontmatter'),
			{ ...flag('page-headings', 'Include page headings; disable with --no-page-headings'), negatable: true },
			flag('preserve-empty-pages', 'Mark empty pages'),
			value('line-gap', 'Y-axis tolerance for line grouping (default: 3)'),
			flag('text', 'Output plain text'),
			verbosityOption,
			...passwordOptions,
		],
		async run({ args, options }, context) {
			selection(options);
			const parsed = readOptions(options, context);
			const { readPdfText } = await import('common/pdf');
			const result = await readPdfText(args[0]!, parsed);
			await emit(
				options.text ? result.text : await renderResult(result, result.markdown, options, context),
				args[0],
				options,
				context,
			);
		},
	});
}
function createParseCommand(): WoctlCommand {
	return textCommand({
		name: 'parse',
		description: 'Parse PDF with heuristic templates',
		arguments: '[file]',
		options: [
			value('template', 'Template name/alias (default: auto)'),
			flag('list-templates', 'List available templates without reading a PDF'),
			value('min-confidence', 'Minimum confidence, 0..1 (default: 0.25)'),
			flag('debug', 'Include intermediate text and lines'),
			...pageOptions,
			verbosityOption,
			...passwordOptions,
		],
		async run({ args, options }, context) {
			const selected = selection(options);
			const { listPdfParseTemplates, parsePdfWithTemplate } = await import('common/pdf/parser');
			if (options['list-templates']) {
				const result = listPdfParseTemplates();
				await emit(renderCliOutput(result, { ...selected, columns: context.columns }), undefined, options, context);
				return;
			}
			if (!args[0]) throw new CliUsageError('Missing PDF file path; pass <file> or use --list-templates');
			const minConfidence = optionNumber(options, 'min-confidence', { min: 0, max: 1 });
			const parsed = readOptions(options, context);
			const result = await parsePdfWithTemplate(args[0], {
				...parsed,
				template: optionString(options, 'template'),
				minConfidence,
				debug: options.debug === true,
			});
			const { renderPdfParseMarkdown } = await import('common/pdf/markdown');
			await emit(
				await renderResult(result, renderPdfParseMarkdown(result), options, context),
				args[0],
				options,
				context,
			);
		},
	});
}
function formatOutputPath(pattern: string, page: number, index: number, total: number): string {
	if (total > 1 && !/%0?\d*d/.test(pattern) && !pattern.includes('{page}') && !pattern.includes('{index}'))
		throw new CliUsageError('Multiple PDF pages require an output pattern such as page-%03d.png or page-{page}.png');
	return pattern
		.replace(/%0?(\d*)d/g, (_all, width: string) => {
			const padding = width ? Number(width) : 0;
			if (padding > 256) throw new CliUsageError('Output page padding must not exceed 256');
			return String(page).padStart(padding, '0');
		})
		.replaceAll('{page}', String(page))
		.replaceAll('{index}', String(index + 1));
}
async function emitPng(data: Uint8Array, context: CliExecution): Promise<void> {
	const stream = context.writeStream ?? context.stdoutStream;
	if (stream) {
		const writer = stream.getWriter();
		try {
			await writer.write(data);
		} finally {
			writer.releaseLock();
		}
		return;
	}
	await new Promise<void>((resolve, reject) => {
		process.stdout.write(data, (error) => (error ? reject(error) : resolve()));
	});
}
function createRenderCommand(): WoctlCommand {
	return {
		name: 'render',
		description: 'Render PDF pages to PNG with PDFium and CanvasKit',
		arguments: '<file>',
		output: 'custom',
		options: [
			value('page', 'Single page to render'),
			...pageOptions,
			{
				name: 'output',
				aliases: ['o'],
				description: 'PNG path; multiple pages require page-%03d.png, {page} or {index}; - for stdout',
			},
			value('dpi', 'Render DPI and PNG resolution metadata (default: 150)'),
			value('scale', 'Scale override when width/height are omitted'),
			value('width', 'Fit to this pixel width'),
			value('height', 'Fit to this pixel height'),
			flag('transparent', 'Use transparent background'),
			flag('render-form-fields', 'Render interactive form fields'),
			...passwordOptions,
			flag('in-place', 'Allow an output path that overwrites the source file'),
		],
		async run({ args, options }, context) {
			const page = positive(options, 'page');
			const pages = optionString(options, 'pages');
			if (page !== undefined && pages) throw new CliUsageError('Use either --page or --pages');
			const output = optionString(options, 'output');
			if ((!output || output === '-') && context.host.term?.stdoutIsTTY)
				throw new CliUsageError('Choose --output <file> to save PNG output');
			const parsed = {
				pages: pages ?? (page === undefined ? undefined : String(page)),
				pageLimit: positive(options, 'page-limit'),
				dpi: positive(options, 'dpi', false),
				scale: positive(options, 'scale', false),
				width: positive(options, 'width'),
				height: positive(options, 'height'),
				transparent: options.transparent === true,
				renderFormFields: options['render-form-fields'] === true,
				password: password(options, context),
			};
			const { renderPdfPages } = await import('common/pdf');
			const result = await renderPdfPages(args[0]!, parsed);
			context.signal.throwIfAborted();
			if (!result.pages.items.length) throw new CliUsageError('No PDF pages selected');
			if (!output || output === '-') {
				if (result.pages.items.length > 1) throw new CliUsageError('Multiple PNGs require --output page-%03d.png');
				await emitPng(result.pages.items[0]!.data, context);
				return;
			}
			const files = result.pages.items.map((item, i) =>
				formatOutputPath(output, item.number, i, result.pages.items.length),
			);
			if (new Set(files.map((file) => path.resolve(file))).size !== files.length)
				throw new CliUsageError('Output pattern produces duplicate paths');
			for (const file of files) await assertOutputPath(args[0], file, options['in-place'] === true);
			for (let i = 0; i < files.length; i++) {
				context.signal.throwIfAborted();
				await mkdir(path.dirname(files[i]!), { recursive: true });
				await writeFile(files[i]!, result.pages.items[i]!.data, { signal: context.signal });
			}
			context.stdout(files.join('\n'));
		},
	};
}
export function createPdfCommand(): WoctlCommand {
	return {
		name: 'pdf',
		description: 'PDF utilities: info, inspect, read, parse, render',
		commands: [
			createInfoCommand(),
			createInspectCommand(),
			createReadCommand(),
			createParseCommand(),
			createRenderCommand(),
		],
	};
}
