import { stringify as stringifyYaml } from 'yaml';
import type { CliTable } from '../render/CliTable';
import { formatCliTable } from './formatCliTable';
import { cliFieldKey, findCliFieldIndex, isCliDetailTable, projectCliTable } from './projectCliTable';
import { CliFormatError, type CliFormatOptions } from './types';

export function formatCliOutput(value: unknown, options: CliFormatOptions & { table?: CliTable } = {}): string {
	const mode = options.format ?? 'table';
	const fields = options.fields?.length ? options.fields : undefined;
	const projectedValue = fields && !options.table ? projectObjectFields(value, fields) : value;
	if (mode === 'json' || mode === 'jsonl' || mode === 'yaml' || mode === 'yml') {
		const data = fields && options.table ? tableData(projectCliTable(options.table, fields)) : projectedValue;
		if (mode === 'json') return `${json(data, options.compact ? 0 : 2)}\n`;
		if (mode === 'jsonl') return `${(Array.isArray(data) ? data : [data]).map((item) => json(item)).join('\n')}\n`;
		const yaml = stringifyYaml(JSON.parse(json(data)), { lineWidth: 0 });
		return yaml.endsWith('\n') ? yaml : `${yaml}\n`;
	}
	const table = options.table ? projectCliTable(options.table, fields) : deriveTable(projectedValue, fields);
	const layoutOptions = { ...options, fields: undefined };
	if (mode === 'csv') return formatCsv(table, options.headers !== false);
	if (mode === 'md' || mode === 'markdown') return formatMarkdown(table, options.headers !== false);
	if (mode === 'name' || mode === 'value') return formatScalar(table, mode, Boolean(fields));
	if (mode === 'describe' || mode === 'desc') {
		if (isCliDetailTable(table)) return formatCliTable({ ...table, kind: 'detail' }, layoutOptions);
		return formatCliTable(table, { ...layoutOptions, format: 'describe' });
	}
	return formatCliTable(table, { ...layoutOptions, truncate: mode === 'wide' ? false : options.truncate });
}

function deriveTable(value: unknown, fields?: readonly string[]): CliTable {
	if (Array.isArray(value)) {
		if (!value.every(isPlainObject)) return { headers: ['VALUE'], rows: value.map((item) => [item]), kind: 'list' };
		const headers = fields ? [...fields] : [...new Set(value.flatMap((item) => Object.keys(item)))];
		return {
			headers,
			rows: value.map((item) => headers.map((key) => item[key])),
			columnOptions: headers.map((key) => ({ key })),
			kind: 'list',
		};
	}
	if (isPlainObject(value))
		return { headers: ['FIELD', 'VALUE'], rows: Object.entries(value), kind: 'detail', emptyMessage: 'No fields.' };
	return { headers: ['VALUE'], rows: [[value]], kind: 'plain' };
}

function tableData(table: CliTable): unknown {
	if (isCliDetailTable(table)) {
		const keys = table.rows.map((row) => cliFieldKey(String(row[0])));
		assertDistinctKeys(keys);
		return Object.fromEntries(table.rows.map((row, index) => [keys[index], row[1]]));
	}
	const keys = table.headers.map((header, index) => table.columnOptions?.[index]?.key ?? cliFieldKey(header));
	assertDistinctKeys(keys);
	return table.rows.map((row) => Object.fromEntries(keys.map((key, index) => [key, row[index]])));
}

function assertDistinctKeys(keys: readonly string[]) {
	if (new Set(keys).size !== keys.length)
		throw new CliFormatError('Ambiguous column keys; provide distinct field names or columnOptions.key values');
}

function projectObjectFields(value: unknown, fields: readonly string[]): unknown {
	const records = Array.isArray(value) ? value : [value];
	if (records.length === 0) return [];
	for (const field of fields)
		if (!records.some((record) => getPath(record, field).found)) throw new CliFormatError(`Unknown field: ${field}`);
	const projected = records.map((record) =>
		Object.fromEntries(fields.map((field) => [field, getPath(record, field).value])),
	);
	return Array.isArray(value) ? projected : projected[0];
}

function getPath(value: unknown, path: string): { found: boolean; value?: unknown } {
	if (!isPlainObject(value) && !Array.isArray(value)) return { found: false };
	const keys = Object.keys(value);
	const direct = keys[findCliFieldIndex(path, keys)];
	if (direct !== undefined) return { found: true, value: (value as Record<string, unknown>)[direct] };
	const [first, ...rest] = path.split('.');
	const key = keys[findCliFieldIndex(first, keys)];
	if (key === undefined || !rest.length) return { found: false };
	return getPath((value as Record<string, unknown>)[key], rest.join('.'));
}

function formatCsv(table: CliTable, headers: boolean): string {
	if (isCliDetailTable(table)) {
		return formatCsv(
			{
				kind: 'list',
				headers: table.rows.map((row) => String(row[0])),
				columnOptions: table.rows.map((row) => ({ key: String(row[0]) })),
				rows: [table.rows.map((row) => row[1])],
			},
			headers,
		);
	}
	const lines: string[] = [];
	const count = table.rows.reduce((max, row) => Math.max(max, row.length), table.headers.length);
	if (headers && count)
		lines.push(
			Array.from({ length: count }, (_, index) =>
				csvCell(table.columnOptions?.[index]?.key ?? cliFieldKey(table.headers[index] ?? `column_${index + 1}`)),
			).join(','),
		);
	for (const row of table.rows) lines.push(Array.from({ length: count }, (_, index) => csvCell(row[index])).join(','));
	return `${lines.join('\n')}\n`;
}

function csvCell(value: unknown): string {
	const text = rawCell(value);
	return /[",\r\n]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

function formatMarkdown(table: CliTable, headers: boolean): string {
	const count = table.rows.reduce((max, row) => Math.max(max, row.length), table.headers.length);
	const line = (row: readonly unknown[]) =>
		`| ${Array.from({ length: count }, (_, index) =>
			rawCell(row[index])
				.replace(/\\/gu, '\\\\')
				.replace(/\|/gu, '\\|')
				.replace(/\r\n?|\n/gu, '<br>'),
		).join(' | ')} |`;
	const lines: string[] = [];
	if (headers && count) lines.push(line(table.headers), line(Array.from({ length: count }, () => '---')));
	for (const row of table.rows) lines.push(line(row));
	return `${lines.join('\n')}\n`;
}

function formatScalar(table: CliTable, mode: 'name' | 'value', projected: boolean): string {
	if (isCliDetailTable(table)) return `${table.rows.map((row) => rawCell(row[mode === 'name' ? 0 : 1])).join('\n')}\n`;
	if (mode === 'value') return `${table.rows.map((row) => row.map(rawCell).join('\t')).join('\n')}\n`;
	const nameIndex = projected
		? 0
		: table.headers.findIndex((header, index) => cliFieldKey(table.columnOptions?.[index]?.key ?? header) === 'name');
	return `${table.rows.map((row) => rawCell(row[Math.max(0, nameIndex)])).join('\n')}\n`;
}

function rawCell(value: unknown): string {
	if (value === undefined || value === null) return '';
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string') return value;
	if (value !== null && typeof value === 'object') return json(value);
	return String(value);
}

function json(value: unknown, indent = 0): string {
	return JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item), indent) ?? 'null';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
