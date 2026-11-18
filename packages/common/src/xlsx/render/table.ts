import { stringify as stringifyYaml } from 'yaml';

export interface TableResult {
	columns: string[];
	rows: Record<string, unknown>[];
}

function cellStr(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'bigint') return value.toString();
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function isNumericString(value: string): boolean {
	return value !== '' && /^-?\d+(\.\d+)?$/.test(value);
}

function pad(value: string, width: number, right = false): string {
	const size = Math.max(0, width - [...value].length);
	return right ? `${' '.repeat(size)}${value}` : `${value}${' '.repeat(size)}`;
}

export function stringifyJson(value: unknown, opts: { compact?: boolean } = {}): string {
	return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, opts.compact ? 0 : 2);
}

export function renderDataByFormat(value: unknown, format: string, opts: { compact?: boolean } = {}): string {
	switch (format) {
		case 'json': return stringifyJson(value, opts);
		case 'yaml':
		case 'yml': return stringifyYaml(JSON.parse(stringifyJson(value, { compact: true })));
		default: return typeof value === 'string' ? value : stringifyJson(value, opts);
	}
}

export function renderTable(result: TableResult): string {
	if (!result.columns.length) return '(empty result)';
	const rows = result.rows.map((row) => result.columns.map((column) => cellStr(row[column])));
	const widths = result.columns.map((column, index) => rows.reduce((max, row) => Math.max(max, [...row[index]].length), [...column].length));
	const right = result.columns.map((_, index) => rows.length > 0 && rows.every((row) => isNumericString(row[index]) || row[index] === ''));
	const header = result.columns.map((column, index) => pad(column, widths[index], right[index])).join(' | ');
	const sep = widths.map((width) => '-'.repeat(width)).join('-+-');
	const body = rows.map((row) => row.map((cell, index) => pad(cell, widths[index], right[index])).join(' | '));
	return [header, sep, ...body].join('\n');
}

export function renderMarkdown(result: TableResult): string {
	if (!result.columns.length) return '(empty result)';
	const rows = result.rows.map((row) => result.columns.map((column) => cellStr(row[column])));
	const widths = result.columns.map((column, index) => rows.reduce((max, row) => Math.max(max, [...row[index]].length), [...column].length));
	const right = result.columns.map((_, index) => rows.length > 0 && rows.every((row) => isNumericString(row[index]) || row[index] === ''));
	const header = `| ${result.columns.map((column, index) => pad(column, widths[index])).join(' | ')} |`;
	const sep = `| ${widths.map((width, index) => right[index] ? `${'-'.repeat(Math.max(1, width - 1))}:` : '-'.repeat(width)).join(' | ')} |`;
	const body = rows.map((row) => `| ${row.map((cell, index) => pad(cell, widths[index], right[index])).join(' | ')} |`);
	return [header, sep, ...body].join('\n');
}

export function renderCsv(result: TableResult): string {
	const escape = (value: unknown) => {
		const text = cellStr(value);
		return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
	};
	return [result.columns.map(escape).join(','), ...result.rows.map((row) => result.columns.map((column) => escape(row[column])).join(','))].join('\n');
}

export function renderJsonl(result: TableResult): string {
	return result.rows.map((row) => stringifyJson(row, { compact: true })).join('\n');
}

export function renderByFormat(result: TableResult, format: string): string {
	switch (format) {
		case 'md':
		case 'markdown': return renderMarkdown(result);
		case 'json': return renderDataByFormat(result.rows, 'json');
		case 'jsonl': return renderJsonl(result);
		case 'csv': return renderCsv(result);
		case 'yaml':
		case 'yml': return renderDataByFormat(result.rows, 'yaml');
		case 'table':
		default: return renderTable(result);
	}
}
