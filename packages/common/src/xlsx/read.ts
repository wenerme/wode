import fs from 'node:fs';
import {
	assertOk, columnNameToNumber, computeUsedRange, type ExcelizeFile,
	listSheets, normalizeRows, openXlsx, parseRangeRef, resolveSheet,
	type XlsxCustomPropertiesResult, type XlsxInspectResult, type XlsxReadOptions,
	type XlsxSheetReadResult, type XlsxWorkbookReadResult,
} from './shared.js';

function filterRowsByRange(rows: string[][], range?: string): string[][] {
	if (!range) return rows;
	const parsed = parseRangeRef(range);
	const out: string[][] = [];
	for (let rowNo = parsed.start.row; rowNo <= parsed.end.row; rowNo++) {
		const row = rows[rowNo - 1] ?? [];
		out.push(Array.from({ length: parsed.end.col - parsed.start.col + 1 }, (_, index) => row[parsed.start.col - 1 + index] ?? ''));
	}
	return out;
}

function readSheetFromWorkbook(workbook: ExcelizeFile, file: string, sheet: { name: string; index: number }, opts: XlsxReadOptions = {}): XlsxSheetReadResult {
	const rowsResult = assertOk(workbook.GetRows(sheet.name, { RawCellValue: opts.raw }), `failed to read sheet ${sheet.name}`);
	const allRows = filterRowsByRange(rowsResult.result ?? [], opts.range);
	const columns = allRows.reduce((max, row) => Math.max(max, row.length), 0);
	const start = Math.max(0, opts.offset || 0);
	const size = Math.max(0, opts.limit ?? 50);
	const rows = allRows.slice(start, size > 0 ? start + size : undefined)
		.map((row) => Array.from({ length: columns }, (_, index) => row[index] ?? ''));
	return {
		file, sheet: sheet.name, sheetIndex: sheet.index, rows, totalRows: allRows.length,
		columns,
		truncated: rows.length < Math.max(0, allRows.length - start),
	};
}

export async function readXlsxSheet(file: string, opts: XlsxReadOptions = {}): Promise<XlsxSheetReadResult> {
	const { workbook } = await openXlsx(file, opts);
	return readSheetFromWorkbook(workbook, file, resolveSheet(workbook, opts.sheet), opts);
}

export async function readXlsxWorkbook(file: string, opts: XlsxReadOptions = {}): Promise<XlsxWorkbookReadResult> {
	const { workbook } = await openXlsx(file, opts);
	const selectedSheets = opts.sheet ? [resolveSheet(workbook, opts.sheet)] : listSheets(workbook);
	return { file, sheets: selectedSheets.map((sheet) => readSheetFromWorkbook(workbook, file, sheet, opts)) };
}

function parseDimension(value: string): { rows: number; columns: number } {
	const last = value.split(':').at(-1) ?? '';
	const match = last.match(/^([A-Z]+)(\d+)$/i);
	if (!match) return { rows: 0, columns: 0 };
	return { columns: columnNameToNumber(match[1]), rows: Number(match[2]) || 0 };
}

export async function readXlsxCustomProperties(file: string, opts: Pick<XlsxReadOptions, 'raw' | 'signal'> = {}): Promise<XlsxCustomPropertiesResult> {
	const { workbook } = await openXlsx(file, opts);
	const props = assertOk(workbook.GetCustomProps(), 'failed to read workbook custom properties');
	return { file, size: fs.statSync(file).size, properties: (props.props ?? []).map((property) => ({ name: property.Name, value: property.Value })) };
}

export async function inspectXlsx(file: string, opts: Pick<XlsxReadOptions, 'raw' | 'limit' | 'signal'> = {}): Promise<XlsxInspectResult> {
	const { workbook } = await openXlsx(file, opts);
	const sheets = workbook.GetSheetList().list ?? [];
	const sampleSize = Math.max(0, opts.limit ?? 5);
	return {
		file, size: fs.statSync(file).size,
		sheets: sheets.map((name, index) => {
			const dimensionResult = workbook.GetSheetDimension(name);
			const declaredDimension = dimensionResult.error ? '' : dimensionResult.dimension;
			const parsed = parseDimension(declaredDimension);
			const rowsResult = workbook.GetRows(name, { RawCellValue: opts.raw });
			const rows = normalizeRows(rowsResult.error ? [] : (rowsResult.result ?? []));
			const computed = computeUsedRange(rows);
			const visible = workbook.GetSheetVisible(name);
			const merges = workbook.GetMergeCells(name, true);
			return {
				index, name, dimension: computed.dimension, declaredDimension, computedDimension: computed.dimension,
				rows: computed.rows || parsed.rows || rows.length,
				columns: computed.columns || parsed.columns || rows.reduce((max, row) => Math.max(max, row.length), 0),
				nonEmptyRows: computed.nonEmptyRows, hidden: visible.error ? false : !visible.visible,
				mergeCells: merges.error ? 0 : (merges.mergeCells?.length ?? 0), sample: rows.slice(0, sampleSize),
			};
		}),
	};
}
