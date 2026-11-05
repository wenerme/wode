import fs from 'node:fs';
import path from 'node:path';
import { type CliCommand, type CliOption, type CliOptions, CliUsageError } from '@wener/common/cli';
import type { XlsxInspectResult } from 'common/xlsx';
import { optionNumber, optionStrings, optionString as text } from '../../command-utils';
import type { WoctlCommand, CliExecution } from '../../createCli';
import { parseCellAssignment, parseStyles, resolveEditRows } from './input';

type Command = CliCommand<CliExecution>;
const flag = (name: string, description: string): CliOption => ({ name, type: 'boolean', description });
const value = (name: string, description: string, defaultValue?: string): CliOption => ({ name, description, default: defaultValue });
const multiple = (name: string, description: string): CliOption => ({ name, description, repeatable: true, variadic: true });
const output = (description: string): CliOption => ({ name: 'output', aliases: ['o'], description });
const sheet = value('sheet', 'Sheet name or 0-based index');
const raw = flag('raw', 'Read raw cell values instead of formatted values');
const styling = [flag('header-style', 'Style the first written row as a header'), flag('freeze-header', 'Freeze panes below the first written row'), flag('autofit', 'Set simple column widths from written rows')];
const resultFormats = ['table', 'md', 'markdown', 'json', 'yaml', 'yml'];
const readFormats = [...resultFormats, 'csv', 'jsonl'];

function format(options: CliOptions, fallback: string, allowed = resultFormats): string {
	const selected = options.json === true ? 'json' : text(options, 'output') ?? fallback;
	if (!allowed.includes(selected)) throw new CliUsageError(`Unsupported output format; expected ${allowed.join(', ')}`);
	return selected;
}

function emit(context: CliExecution, result: string): void {
	context.signal.throwIfAborted();
	context.stdout(result);
}

/** Compare aliases too, so --out cannot accidentally bypass explicit in-place intent. */
function sameFile(a: string, b: string): boolean {
	if (path.resolve(a) === path.resolve(b)) return true;
	try {
		const left = fs.statSync(a);
		const right = fs.statSync(b);
		return left.dev === right.dev && left.ino === right.ino;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
}

function destination(file: string | undefined, options: CliOptions, requireOut: boolean): string {
	const out = text(options, 'out');
	const inPlace = options['in-place'] === true;
	if (inPlace && !file) throw new CliUsageError('--in-place requires an input file');
	if (inPlace && file && out && !sameFile(file, out)) throw new CliUsageError('Choose --in-place or a separate --out file');
	if (!inPlace && file && (!out || sameFile(file, out))) throw new CliUsageError('Use --out for a separate file or --in-place to overwrite the input workbook');
	if (inPlace) return file!;
	if (!out) throw new CliUsageError(requireOut ? '--out is required unless --in-place is specified' : '--out is required when creating a workbook');
	return out;
}

function resolveSheets(inspect: XlsxInspectResult, selected: string[]): Array<{ name: string; index: number }> {
	if (!selected.length) return inspect.sheets.map(({ name, index }) => ({ name, index }));
	return selected.map((value) => {
		const index = Number(value);
		const found = (Number.isInteger(index) ? inspect.sheets.find((sheet) => sheet.index === index) : undefined)
			?? inspect.sheets.find((sheet) => sheet.name === value);
		if (!found) throw new CliUsageError(`Sheet not found: ${value}`);
		return { name: found.name, index: found.index };
	});
}

function readCommand(): Command {
	return {
		name: 'read', description: 'Read or preview one XLSX worksheet', arguments: '<file>', output: 'custom',
		options: [sheet, value('range', 'A1 range to read before offset and limit'), value('limit', 'Rows to render; 0 means all rows', '50'), value('offset', 'Rows to skip after applying the range', '0'), raw, flag('raw-rows', 'CSV output uses exact rows without generated c1,c2 headers'), flag('header', 'Use the first row as field names for table, CSV, or JSONL'), output('Output format: md | table | csv | json | jsonl | yaml (default: md)')],
		async run({ args, options }, context) {
			const fmt = format(options, 'md', readFormats);
			const limit = optionNumber(options, 'limit', { min: 0, integer: true });
			const offset = optionNumber(options, 'offset', { min: 0, integer: true });
			const { readXlsxSheet, renderXlsxReadResult } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const result = await readXlsxSheet(args[0], { sheet: text(options, 'sheet'), range: text(options, 'range'), limit, offset, raw: options.raw === true, signal: context.signal });
			emit(context, renderXlsxReadResult(result, fmt, { detectHeader: options.header === true, rawRows: options['raw-rows'] === true }));
		},
	};
}

function inspectCommand(): Command {
	return {
		name: 'inspect', description: 'Inspect XLSX workbook and sheet metadata', arguments: '<file>', output: 'custom',
		options: [value('sample', 'Sample rows per sheet in JSON/YAML output', '5'), raw, output('Output format: md | table | json | yaml (default: md)')],
		async run({ args, options }, context) {
			const fmt = format(options, 'md');
			const limit = optionNumber(options, 'sample', { min: 0, integer: true });
			const { inspectXlsx, renderXlsxInspectResult } = await import('common/xlsx');
			context.signal.throwIfAborted();
			emit(context, renderXlsxInspectResult(await inspectXlsx(args[0], { limit, raw: options.raw === true, signal: context.signal }), fmt));
		},
	};
}

function propsCommand(): Command {
	return {
		name: 'props', aliases: ['properties'], description: 'Read XLSX workbook custom properties', arguments: '<file>', output: 'custom',
		options: [value('prefix', 'Include only property names starting with this prefix'), flag('strip-prefix', 'Strip --prefix from property names'), output('Output format: table | md | json | yaml (default: table)')],
		async run({ args, options }, context) {
			const fmt = format(options, 'table');
			const prefix = text(options, 'prefix');
			const { readXlsxCustomProperties, renderByFormat, renderDataByFormat } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const result = await readXlsxCustomProperties(args[0], { signal: context.signal });
			const rows = result.properties.filter((property) => !prefix || property.name.startsWith(prefix)).map((property) => ({ name: prefix && options['strip-prefix'] ? property.name.slice(prefix.length) : property.name, value: property.value }));
			emit(context, ['json', 'yaml', 'yml'].includes(fmt) ? renderDataByFormat({ ...result, properties: rows }, fmt) : renderByFormat({ columns: ['name', 'value'], rows }, fmt));
		},
	};
}

function listCommand(): Command {
	return {
		name: 'list', aliases: ['sheets'], description: 'List worksheets in an XLSX workbook', arguments: '<file>', output: 'custom',
		options: [output('Output format: name | table | json | yaml (default: name)')],
		async run({ args, options }, context) {
			const fmt = format(options, 'name', ['name', ...resultFormats]);
			const { inspectXlsx, renderXlsxInspectResult, renderDataByFormat } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const result = await inspectXlsx(args[0], { limit: 0, signal: context.signal });
			if (fmt === 'name') emit(context, result.sheets.map((sheet) => sheet.name).join('\n'));
			else if (['json', 'yaml', 'yml'].includes(fmt)) emit(context, renderDataByFormat(result.sheets.map(({ sample: _sample, ...sheet }) => sheet), fmt));
			else emit(context, renderXlsxInspectResult(result, fmt));
		},
	};
}

function editCommand(): Command {
	return {
		name: 'edit', description: 'Create or edit XLSX cells, rows, and styles', arguments: '[file]', output: 'custom',
		options: [
			flag('create', 'Create a new workbook'), value('out', 'Output XLSX file'), flag('in-place', 'Explicitly overwrite the input workbook'), value('sheet', 'Target sheet name; created if missing', 'Sheet1'), value('start', 'Top-left cell for CSV/JSON rows', 'A1'), flag('append', 'Append rows after existing data'), flag('replace-sheet', 'Delete and recreate the target sheet'),
			value('csv', 'CSV text, or - for stdin'), value('csv-file', 'CSV input file, or - for stdin'), value('json', 'JSON array rows/objects, or - for stdin'), value('json-file', 'JSON input file, or - for stdin'),
			multiple('set', 'CELL=VALUE; repeatable'), multiple('style', 'RANGE=PRESET, font-size:N, or Style JSON; repeatable'), value('style-mode', 'Style application: merge | replace', 'merge'), multiple('font-size', 'RANGE=SIZE'), multiple('wrap', 'RANGE'), multiple('fill', 'RANGE=COLOR'), multiple('align', 'RANGE=left|center|right'), multiple('numfmt', 'RANGE=preset-or-custom-format'),
			...styling, raw, output('Result output: table | json | yaml (default: table)'),
		],
		async run({ args, options }, context) {
			const fmt = format(options, 'table');
			const file = args[0];
			const outFile = destination(file, options, false);
			if (!file && !options.create) throw new CliUsageError('Use --create when no input file is provided');
			const styleMode = text(options, 'style-mode') ?? 'merge';
			if (styleMode !== 'merge' && styleMode !== 'replace') throw new CliUsageError('Invalid --style-mode; expected merge or replace');
			const styles = parseStyles(options);
			const cells = optionStrings(options, 'set').map(parseCellAssignment);
			const rows = await resolveEditRows(options, context);
			const { editXlsx, renderByFormat, renderDataByFormat } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const result = await editXlsx({ file, outFile, create: options.create === true, sheet: text(options, 'sheet'), startCell: text(options, 'start'), append: options.append === true, replaceSheet: options['replace-sheet'] === true, rows, cells, styles, styleMode, headerStyle: options['header-style'] === true, freezeHeader: options['freeze-header'] === true, autofit: options.autofit === true, raw: options.raw === true, signal: context.signal });
			emit(context, ['json', 'yaml', 'yml'].includes(fmt) ? renderDataByFormat([result], fmt) : renderByFormat({ columns: Object.keys(result), rows: [{ ...result }] }, fmt));
		},
	};
}

function tidyCommand(): Command {
	return {
		name: 'tidy', description: 'Rebuild a workbook from actual rows; drops stale styles, images, drawings, and sheet internals', arguments: '<file>', output: 'custom',
		options: [value('out', 'Output rebuilt XLSX file'), flag('in-place', 'Explicitly overwrite the input workbook'), flag('keep-empty-sheets', 'Keep empty sheets'), ...styling, raw, output('Result output: table | json | yaml (default: table)')],
		async run({ args, options }, context) {
			const fmt = format(options, 'table');
			const outFile = destination(args[0], options, true);
			const { tidyXlsx, renderByFormat, renderDataByFormat } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const result = await tidyXlsx({ file: args[0], outFile, keepEmptySheets: options['keep-empty-sheets'] === true, headerStyle: options['header-style'] === true, freezeHeader: options['freeze-header'] === true, autofit: options.autofit === true, raw: options.raw === true, signal: context.signal });
			const { sheets: _sheets, ...summary } = result;
			emit(context, ['json', 'yaml', 'yml'].includes(fmt) ? renderDataByFormat(result, fmt) : renderByFormat({ columns: Object.keys(summary), rows: [summary] }, fmt));
		},
	};
}

function exportCommand(): Command {
	return {
		name: 'export', description: 'Export XLSX worksheets to CSV files', arguments: '<file>', output: 'custom',
		options: [value('out-dir', 'Output directory; defaults to XLSX basename'), multiple('sheet', 'Sheet name or 0-based index; repeatable, defaults to all'), raw, flag('bom', 'Prefix CSV files with UTF-8 BOM'), { name: 'manifest', type: 'boolean', default: true, negatable: true, description: 'Write xlsx.manifest.json; --no-manifest disables it' }, output('Export format: csv (default: csv)')],
		async run({ args, options }, context) {
			if (text(options, 'output') && text(options, 'output') !== 'csv') throw new CliUsageError('Only CSV export is supported');
			const file = args[0];
			const outDir = text(options, 'out-dir') ?? path.join(path.dirname(file), path.basename(file, path.extname(file)));
			const { inspectXlsx, exportXlsxCsv, renderDataByFormat } = await import('common/xlsx');
			context.signal.throwIfAborted();
			const inspect = await inspectXlsx(file, { limit: 0, raw: options.raw === true, signal: context.signal });
			context.signal.throwIfAborted();
			const result = await exportXlsxCsv(file, outDir, { sheets: resolveSheets(inspect, optionStrings(options, 'sheet')), raw: options.raw === true, bom: options.bom === true, manifest: options.manifest !== false, signal: context.signal });
			emit(context, renderDataByFormat({ outDir, exports: result }, 'json'));
		},
	};
}

/** Native-only registration: inject this command through WocliHost.commands. */
export function createXlsxCommand(): WoctlCommand {
	return { name: 'xlsx', description: 'Inspect, read, edit, tidy, and export XLSX workbooks', output: 'custom', commands: [readCommand(), inspectCommand(), propsCommand(), listCommand(), editCommand(), tidyCommand(), exportCommand()] };
}
