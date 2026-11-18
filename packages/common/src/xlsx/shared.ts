import fs from 'node:fs';
import { createRequire } from 'node:module';
import type { Options, Style } from 'excelize-wasm';

const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
type ExcelizeModule = typeof import('excelize-wasm');
export type ExcelizeApi = Awaited<ReturnType<ExcelizeModule['init']>>;
export type ExcelizeFile = ReturnType<ExcelizeApi['OpenReader']>;

export interface XlsxReadOptions {
	signal?: AbortSignal;
	sheet?: string;
	range?: string;
	limit?: number;
	offset?: number;
	raw?: boolean;
	output?: string;
	compact?: boolean;
}
export interface XlsxSheetInfo {
	index: number;
	name: string;
	dimension: string;
	declaredDimension: string;
	computedDimension: string;
	rows: number;
	columns: number;
	nonEmptyRows: number;
	hidden: boolean;
	mergeCells: number;
	sample: string[][];
}
export interface XlsxInspectResult {
	file: string;
	size: number;
	sheets: XlsxSheetInfo[];
}
export interface XlsxSheetReadResult {
	file: string;
	sheet: string;
	sheetIndex: number;
	rows: string[][];
	totalRows: number;
	columns: number;
	truncated: boolean;
}
export interface XlsxWorkbookReadResult {
	file: string;
	sheets: XlsxSheetReadResult[];
}
export interface XlsxCustomProperty {
	name: string;
	value: unknown;
}
export interface XlsxCustomPropertiesResult {
	file: string;
	size: number;
	properties: XlsxCustomProperty[];
}
export type XlsxCellValue = boolean | number | string | null;
export type XlsxStylePreset =
	| 'header' | 'bold' | 'wrap' | 'money' | 'number' | 'percent' | 'date'
	| 'align-center' | 'align-left' | 'align-right';
export interface XlsxEditCellSet {
	cell: string;
	value: XlsxCellValue;
}
export interface XlsxEditStyleSet {
	range: string;
	style: XlsxStylePreset | Style;
}
export interface XlsxEditOptions {
	signal?: AbortSignal;
	file?: string;
	outFile?: string;
	create?: boolean;
	sheet?: string;
	startCell?: string;
	append?: boolean;
	replaceSheet?: boolean;
	rows?: XlsxCellValue[][];
	cells?: XlsxEditCellSet[];
	styles?: XlsxEditStyleSet[];
	styleMode?: 'merge' | 'replace';
	headerStyle?: boolean;
	freezeHeader?: boolean;
	autofit?: boolean;
	raw?: boolean;
}
export interface XlsxEditResult {
	file?: string;
	outFile: string;
	sheet: string;
	created: boolean;
	rowsWritten: number;
	cellsWritten: number;
	stylesApplied: number;
}
export interface XlsxExportResult {
	sheet: string;
	path: string;
	rows: number;
	columns: number;
}
export interface XlsxTidyOptions {
	signal?: AbortSignal;
	file: string;
	outFile: string;
	keepEmptySheets?: boolean;
	headerStyle?: boolean;
	freezeHeader?: boolean;
	autofit?: boolean;
	raw?: boolean;
}
export interface XlsxTidySheetResult {
	name: string;
	rows: number;
	columns: number;
	dropped: boolean;
	reason?: string;
}
export interface XlsxTidyResult {
	file: string;
	outFile: string;
	beforeSize: number;
	afterSize: number;
	beforeSheets: number;
	afterSheets: number;
	droppedSheets: number;
	sheets: XlsxTidySheetResult[];
}

let excelizePromise: Promise<ExcelizeApi> | undefined;

/** Resolve the installed package resource; bundlers must preserve this external asset. */
export function resolveExcelizeWasm(): string {
	return require.resolve('excelize-wasm/excelize.wasm.gz');
}

export async function loadExcelize(): Promise<ExcelizeApi> {
	excelizePromise ??= import('excelize-wasm').then((mod) => mod.init(resolveExcelizeWasm())).catch((error) => {
		excelizePromise = undefined;
		throw error;
	});
	return excelizePromise;
}

export function assertOk<T extends { error?: string | null }>(result: T, message: string): T {
	if (result.error) throw new Error(`${message}: ${result.error}`);
	return result;
}

export async function openXlsx(file: string, opts: Pick<XlsxReadOptions, 'raw' | 'signal'> = {}): Promise<{ excelize: ExcelizeApi; workbook: ExcelizeFile }> {
	opts.signal?.throwIfAborted();
	const excelize = await loadExcelize();
	opts.signal?.throwIfAborted();
	const workbook = excelize.OpenReader(fs.readFileSync(file), { RawCellValue: opts.raw } satisfies Options);
	assertOk(workbook, 'failed to open xlsx');
	return { excelize, workbook };
}

export function resolveSheet(workbook: ExcelizeFile, sheet?: string): { name: string; index: number } {
	const sheets = workbook.GetSheetList().list ?? [];
	if (!sheets.length) throw new Error('workbook has no sheets');
	if (!sheet) return { name: sheets[0], index: 0 };
	const index = Number(sheet);
	if (Number.isInteger(index) && index >= 0 && index < sheets.length) return { name: sheets[index], index };
	const found = sheets.findIndex((item) => item === sheet);
	if (found >= 0) return { name: sheets[found], index: found };
	throw new Error(`sheet not found: ${sheet}; available: ${sheets.join(', ')}`);
}

export function listSheets(workbook: ExcelizeFile): Array<{ name: string; index: number }> {
	const sheets = workbook.GetSheetList().list ?? [];
	if (!sheets.length) throw new Error('workbook has no sheets');
	return sheets.map((name, index) => ({ name, index }));
}

export function normalizeRows(rows: string[][]): string[][] {
	const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
	return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''));
}

export function columnNameToNumber(name: string): number {
	let out = 0;
	for (const char of name.toUpperCase()) {
		const code = char.charCodeAt(0);
		if (code < 65 || code > 90) continue;
		out = out * 26 + code - 64;
	}
	return out;
}

export function cellName(col: number, row: number): string {
	let current = col;
	let name = '';
	while (current > 0) {
		const mod = (current - 1) % 26;
		name = String.fromCharCode(65 + mod) + name;
		current = Math.floor((current - mod) / 26);
	}
	return `${name}${row}`;
}

export function parseCellRef(cell: string): { col: number; row: number } {
	const match = cell.trim().match(/^\$?([A-Z]+)\$?(\d+)$/i);
	if (!match) throw new Error(`invalid cell reference: ${cell}`);
	const col = columnNameToNumber(match[1]);
	const row = Number(match[2]);
	if (col < 1 || row < 1) throw new Error(`invalid cell reference: ${cell}`);
	return { col, row };
}

export function parseRangeRef(range: string): { start: { col: number; row: number }; end: { col: number; row: number } } {
	const [start, end = start] = range.split(':');
	const a = parseCellRef(start);
	const b = parseCellRef(end);
	return {
		start: { col: Math.min(a.col, b.col), row: Math.min(a.row, b.row) },
		end: { col: Math.max(a.col, b.col), row: Math.max(a.row, b.row) },
	};
}

export function parseColumnRangeRef(range: string): { startCol: string; endCol: string } | undefined {
	const match = range.trim().match(/^\$?([A-Z]+)(?::\$?([A-Z]+))?$/i);
	if (!match) return undefined;
	const start = match[1].toUpperCase();
	const end = (match[2] ?? match[1]).toUpperCase();
	return columnNameToNumber(start) <= columnNameToNumber(end) ? { startCol: start, endCol: end } : { startCol: end, endCol: start };
}

export function computeUsedRange(rows: string[][]): { dimension: string; rows: number; columns: number; nonEmptyRows: number } {
	let minRow = Number.POSITIVE_INFINITY;
	let minCol = Number.POSITIVE_INFINITY;
	let maxRow = 0;
	let maxCol = 0;
	let nonEmptyRows = 0;
	rows.forEach((row, rowIndex) => {
		let rowHasValue = false;
		row.forEach((cell, colIndex) => {
			if (cell === '') return;
			rowHasValue = true;
			minRow = Math.min(minRow, rowIndex + 1);
			minCol = Math.min(minCol, colIndex + 1);
			maxRow = Math.max(maxRow, rowIndex + 1);
			maxCol = Math.max(maxCol, colIndex + 1);
		});
		if (rowHasValue) nonEmptyRows++;
	});
	if (!maxRow || !maxCol) return { dimension: 'A1', rows: 0, columns: 0, nonEmptyRows };
	return { dimension: `${cellName(minCol, minRow)}:${cellName(maxCol, maxRow)}`, rows: maxRow, columns: maxCol, nonEmptyRows };
}
