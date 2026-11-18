import { type CliOptions, CliUsageError } from '@wener/common/cli';
import type { XlsxCellValue, XlsxEditStyleSet, XlsxStylePreset } from 'common/xlsx';
import { optionString, optionStrings, readCommandText } from '../../command-utils';
import type { CliExecution } from '../../createCli';

export function parseScalar(value: string): XlsxCellValue {
	const trimmed = value.trim();
	if (trimmed === '') return '';
	if (trimmed === 'null') return null;
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
	return value;
}

export function parseCsv(text: string): XlsxCellValue[][] {
	const rows: XlsxCellValue[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
			else if (ch === '"') quoted = false;
			else cell += ch;
			continue;
		}
		if (ch === '"') quoted = true;
		else if (ch === ',') { row.push(cell); cell = ''; }
		else if (ch === '\n') {
			row.push(cell.replace(/\r$/, ''));
			rows.push(row.map(parseScalar));
			row = [];
			cell = '';
		} else cell += ch;
	}
	if (quoted) throw new CliUsageError('Unterminated CSV quote');
	if (cell || row.length) {
		row.push(cell.replace(/\r$/, ''));
		rows.push(row.map(parseScalar));
	}
	return rows;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cellValue(value: unknown): XlsxCellValue {
	if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
	throw new CliUsageError('JSON cells must be strings, finite numbers, booleans, or null');
}

export function parseJsonRows(text: string): XlsxCellValue[][] {
	let value: unknown;
	try { value = JSON.parse(text); }
	catch { throw new CliUsageError('Invalid JSON input'); }
	if (!Array.isArray(value)) throw new CliUsageError('JSON input must be an array of arrays or array of objects');
	if (!value.length) return [];
	if (value.every(Array.isArray)) return value.map((row) => row.map(cellValue));
	if (value.every(isObject)) {
		const columns = Array.from(new Set(value.flatMap((row) => Object.keys(row))));
		return [columns, ...value.map((row) => columns.map((column) => cellValue(Object.hasOwn(row, column) ? row[column] : null)))];
	}
	throw new CliUsageError('JSON input must be an array of arrays or array of objects');
}

function assignment(value: string, flag: string): { target: string; value: string } {
	const index = value.indexOf('=');
	if (index <= 0) throw new CliUsageError(`Invalid --${flag}; expected TARGET=VALUE`);
	return { target: value.slice(0, index), value: value.slice(index + 1) };
}

export function parseCellAssignment(value: string): { cell: string; value: XlsxCellValue } {
	const parsed = assignment(value, 'set');
	return { cell: parsed.target, value: parseScalar(parsed.value) };
}

function parseStyleValue(raw: string): XlsxEditStyleSet['style'] {
	const value = raw.trim();
	if (value.startsWith('{')) {
		let parsed: unknown;
		try { parsed = JSON.parse(value); }
		catch { throw new CliUsageError('Invalid style JSON'); }
		if (!isObject(parsed)) throw new CliUsageError('Style JSON must be an object');
		return parsed;
	}
	if (/^font-size:\d+(?:\.\d+)?$/i.test(value)) {
		const size = Number(value.split(':')[1]);
		if (size <= 0) throw new CliUsageError('Font size must be positive');
		return { Font: { Size: size } };
	}
	if (!['header', 'bold', 'wrap', 'money', 'number', 'percent', 'date', 'align-center', 'align-left', 'align-right'].includes(value))
		throw new CliUsageError('Unknown style preset');
	return value as XlsxStylePreset;
}

export function parseStyles(options: CliOptions): XlsxEditStyleSet[] {
	const out = optionStrings(options, 'style').map((item) => {
		const parsed = assignment(item, 'style');
		return { range: parsed.target, style: parseStyleValue(parsed.value) };
	});
	for (const item of optionStrings(options, 'font-size')) {
		const parsed = assignment(item, 'font-size');
		const size = Number(parsed.value);
		if (!Number.isFinite(size) || size <= 0) throw new CliUsageError('Invalid --font-size; size must be a positive number');
		out.push({ range: parsed.target, style: { Font: { Size: size } } });
	}
	for (const range of optionStrings(options, 'wrap')) out.push({ range, style: 'wrap' });
	for (const item of optionStrings(options, 'fill')) {
		const parsed = assignment(item, 'fill');
		out.push({ range: parsed.target, style: { Fill: { Type: 'pattern', Pattern: 1, Color: [parsed.value] } } });
	}
	for (const item of optionStrings(options, 'align')) {
		const parsed = assignment(item, 'align');
		const align = parsed.value.toLowerCase();
		if (!['left', 'center', 'right'].includes(align)) throw new CliUsageError('Invalid --align; expected left, center, or right');
		out.push({ range: parsed.target, style: `align-${align}` as XlsxStylePreset });
	}
	for (const item of optionStrings(options, 'numfmt')) {
		const parsed = assignment(item, 'numfmt');
		const preset = parsed.value.toLowerCase();
		out.push({ range: parsed.target, style: ['money', 'number', 'percent', 'date'].includes(preset) ? preset as XlsxStylePreset : { CustomNumFmt: parsed.value } });
	}
	return out;
}

export async function resolveEditRows(options: CliOptions, context: CliExecution): Promise<XlsxCellValue[][]> {
	const sources = ['csv', 'csv-file', 'json', 'json-file'].filter((key) => options[key] !== undefined);
	if (!sources.length) return [];
	if (sources.length > 1) throw new CliUsageError('Use only one of --csv, --csv-file, --json, --json-file');
	const key = sources[0];
	const source = optionString(options, key)!;
	const text = source === '-' || key.endsWith('-file')
		? await readCommandText(source === '-' ? '-' : `@${source}`, context)
		: source;
	return key.startsWith('csv') ? parseCsv(text) : parseJsonRows(text);
}
