import type { XlsxInspectResult, XlsxSheetReadResult, XlsxWorkbookReadResult } from '../shared.js';
import { renderByFormat, renderDataByFormat } from './table.js';

function isMostlyEmpty(row: string[]): boolean {
	return row.filter((cell) => cell.trim() !== '').length === 0;
}

function looksLikeHeaderRow(row: string[], next?: string[]): boolean {
	const nonEmpty = row.map((cell) => cell.trim()).filter(Boolean);
	if (!nonEmpty.length || nonEmpty.length !== row.length) return false;
	if (nonEmpty.filter((cell) => /[\p{L}_]/u.test(cell)).length / nonEmpty.length < 0.6) return false;
	return !next || next.filter((cell) => cell.trim() !== '').length > 0;
}

function makeUniqueHeaders(headers: string[], width: number): string[] {
	const seen = new Set<string>();
	return Array.from({ length: width }, (_, index) => {
		const base = headers[index]?.trim() || `c${index + 1}`;
		let name = base;
		let count = 1;
		while (seen.has(name)) name = `${base}_${++count}`;
		seen.add(name);
		return name;
	});
}

function rowsToObjects(rows: string[][], opts: { detectHeader?: boolean } = {}): { columns: string[]; rows: Record<string, string>[]; headerDetected: boolean } {
	const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
	if (!width) return { columns: [], rows: [], headerDetected: false };
	const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''));
	let headerDetected = false;
	let columns = Array.from({ length: width }, (_, index) => `c${index + 1}`);
	let dataRows = normalized;
	if (opts.detectHeader) {
		const firstDataIndex = normalized.findIndex((row) => !isMostlyEmpty(row));
		if (firstDataIndex >= 0 && looksLikeHeaderRow(normalized[firstDataIndex], normalized[firstDataIndex + 1])) {
			headerDetected = true;
			columns = makeUniqueHeaders(normalized[firstDataIndex], width);
			dataRows = normalized.slice(firstDataIndex + 1);
		}
	}
	return { columns, rows: dataRows.map((row) => Object.fromEntries(columns.map((header, index) => [header, row[index] ?? '']))), headerDetected };
}

function rowsToRawCsv(rows: string[][]): string {
	const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
	const csv = rows.map((row) => Array.from({ length: width }, (_, index) => {
		const text = String(row[index] ?? '');
		return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
	}).join(',')).join('\n');
	return `${csv}${csv ? '\n' : ''}`;
}

export function renderXlsxReadResult(result: XlsxSheetReadResult, output = 'md', opts: { compact?: boolean; detectHeader?: boolean; rawRows?: boolean } = {}): string {
	const format = output === 'markdown' ? 'md' : output;
	if (format === 'json') return renderDataByFormat(result, 'json', opts);
	if (format === 'yaml' || format === 'yml') return renderDataByFormat(result, 'yaml', opts);
	if (opts.rawRows && format === 'csv') return rowsToRawCsv(result.rows);
	const table = rowsToObjects(result.rows, { detectHeader: opts.detectHeader });
	if (format === 'jsonl') return table.rows.map((row) => JSON.stringify(row)).join('\n');
	return renderByFormat({ columns: table.columns, rows: table.rows }, format);
}

export function renderXlsxWorkbookResult(result: XlsxWorkbookReadResult, output = 'md', opts: { compact?: boolean; detectHeader?: boolean; rawRows?: boolean } = {}): string {
	const format = output === 'markdown' ? 'md' : output;
	if (format === 'json') return renderDataByFormat(result, 'json', opts);
	if (format === 'yaml' || format === 'yml') return renderDataByFormat(result, 'yaml', opts);
	if (format === 'jsonl') return result.sheets.flatMap((sheet) => rowsToObjects(sheet.rows, { detectHeader: opts.detectHeader }).rows).map((row) => JSON.stringify(row)).join('\n');
	if (format === 'csv') {
		if (result.sheets.length > 1) throw new Error('CSV output requires a single worksheet; select one with --sheet');
		const sheet = result.sheets[0];
		return sheet ? renderXlsxReadResult(sheet, format, opts) : '';
	}
	return result.sheets.map((sheet) => {
		const rendered = renderXlsxReadResult(sheet, format, opts);
		const suffix = sheet.truncated ? `\n\n_Showing ${sheet.rows.length}/${sheet.totalRows} rows._` : '';
		return `# ${sheet.sheet}\n\n${rendered}${suffix}`;
	}).join('\n\n');
}

export function renderXlsxInspectResult(result: XlsxInspectResult, output = 'md', opts: { compact?: boolean } = {}): string {
	const format = output === 'markdown' ? 'md' : output;
	if (format === 'json') return renderDataByFormat(result, 'json', opts);
	if (format === 'yaml' || format === 'yml') return renderDataByFormat(result, 'yaml', opts);
	const rows = result.sheets.map((sheet) => ({
		index: sheet.index, name: sheet.name, dimension: sheet.computedDimension ?? sheet.dimension,
		declared_dimension: sheet.declaredDimension ?? sheet.dimension, rows: sheet.rows, columns: sheet.columns,
		non_empty_rows: sheet.nonEmptyRows, hidden: sheet.hidden ? 'yes' : 'no', merge_cells: sheet.mergeCells,
	}));
	return renderByFormat({ columns: ['index', 'name', 'dimension', 'declared_dimension', 'rows', 'columns', 'non_empty_rows', 'hidden', 'merge_cells'], rows }, format);
}
