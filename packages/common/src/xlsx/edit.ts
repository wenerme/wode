import fs from 'node:fs';
import path from 'node:path';
import type { Style } from 'excelize-wasm';
import {
	assertOk, cellName, computeUsedRange, type ExcelizeApi, type ExcelizeFile,
	listSheets, loadExcelize, openXlsx, parseCellRef, parseColumnRangeRef, parseRangeRef,
	type XlsxCellValue, type XlsxEditOptions, type XlsxEditResult,
	type XlsxStylePreset, type XlsxTidyOptions, type XlsxTidyResult, type XlsxTidySheetResult,
} from './shared.js';

function ensureSheet(workbook: ExcelizeFile, sheet: string): void {
	if ((workbook.GetSheetList().list ?? []).includes(sheet)) return;
	assertOk(workbook.NewSheet(sheet), `failed to create sheet ${sheet}`);
}

function openOrCreateWorkbook(excelize: ExcelizeApi, file: string | undefined, opts: Pick<XlsxEditOptions, 'create' | 'raw'>): { workbook: ExcelizeFile; created: boolean } {
	if (!file || opts.create || !fs.existsSync(file)) {
		const workbook = assertOk(excelize.NewFile({ RawCellValue: opts.raw }), 'failed to create xlsx');
		return { workbook, created: true };
	}
	const workbook = assertOk(excelize.OpenReader(fs.readFileSync(file), { RawCellValue: opts.raw }), 'failed to open xlsx');
	return { workbook, created: false };
}

function stylePresetToStyle(preset: XlsxStylePreset): Style {
	switch (preset) {
		case 'header': return { Font: { Bold: true, Color: 'FFFFFF' }, Fill: { Type: 'pattern', Pattern: 1, Color: ['4F81BD'] }, Alignment: { Horizontal: 'center', Vertical: 'center', WrapText: true } };
		case 'bold': return { Font: { Bold: true } };
		case 'wrap': return { Alignment: { WrapText: true, Vertical: 'top' } };
		case 'money': return { CustomNumFmt: '$#,##0.00;[Red]-$#,##0.00' };
		case 'number': return { CustomNumFmt: '#,##0.00' };
		case 'percent': return { CustomNumFmt: '0.00%' };
		case 'date': return { CustomNumFmt: 'yyyy-mm-dd' };
		case 'align-center': return { Alignment: { Horizontal: 'center', Vertical: 'center' } };
		case 'align-left': return { Alignment: { Horizontal: 'left' } };
		case 'align-right': return { Alignment: { Horizontal: 'right' } };
		default: throw new Error(`unknown style preset: ${preset}`);
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeStyle(base: Style, patch: Style): Style {
	const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
	for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
		const existing = out[key];
		out[key] = isPlainObject(existing) && isPlainObject(value) ? { ...existing, ...value } : value;
	}
	return out as Style;
}

function applyStyle(workbook: ExcelizeFile, sheet: string, range: string, style: XlsxStylePreset | Style, mode: 'merge' | 'replace' = 'merge'): void {
	const styleDef = typeof style === 'string' ? stylePresetToStyle(style) : style;
	const columnRange = parseColumnRangeRef(range);
	if (columnRange) {
		const created = assertOk(workbook.NewStyle(styleDef), `failed to create style for ${range}`);
		assertOk(workbook.SetColStyle(sheet, `${columnRange.startCol}:${columnRange.endCol}`, created.style), `failed to apply style ${range}`);
		return;
	}
	const parsed = parseRangeRef(range);
	for (let row = parsed.start.row; row <= parsed.end.row; row++) {
		for (let col = parsed.start.col; col <= parsed.end.col; col++) {
			const cell = cellName(col, row);
			let nextStyle = styleDef;
			if (mode === 'merge') {
				const currentId = workbook.GetCellStyle(sheet, cell);
				if (!currentId.error && currentId.style > 0) {
					const currentStyle = workbook.GetStyle(currentId.style);
					if (!currentStyle.error) nextStyle = mergeStyle(currentStyle.style ?? {}, styleDef);
				}
			}
			const created = assertOk(workbook.NewStyle(nextStyle), `failed to create style for ${range}`);
			assertOk(workbook.SetCellStyle(sheet, cell, cell, created.style), `failed to apply style ${range}`);
		}
	}
}

function inferColumnsWidth(rows: XlsxCellValue[][]): number[] {
	const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
	return Array.from({ length: width }, (_, index) => {
		const longest = rows.reduce((max, row) => Math.max(max, String(row[index] ?? '').length), 8);
		return Math.min(80, longest + 2);
	});
}

function replaceSheet(workbook: ExcelizeFile, sheet: string): void {
	const sheets = workbook.GetSheetList().list ?? [];
	if (!sheets.includes(sheet)) {
		ensureSheet(workbook, sheet);
		return;
	}
	let tempSheet: string | undefined;
	if (sheets.length === 1) {
		tempSheet = `__xlsx_tmp_${Date.now()}__`;
		assertOk(workbook.NewSheet(tempSheet), 'failed to create temporary sheet');
	}
	assertOk(workbook.DeleteSheet(sheet), `failed to replace sheet ${sheet}`);
	assertOk(workbook.NewSheet(sheet), `failed to recreate sheet ${sheet}`);
	if (tempSheet) assertOk(workbook.DeleteSheet(tempSheet), 'failed to remove temporary sheet');
}

function writeWorkbook(workbook: ExcelizeFile, outFile: string): void {
	const written = assertOk(workbook.WriteToBuffer(), 'failed to write xlsx');
	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	fs.writeFileSync(outFile, Buffer.from(written.buffer as Uint8Array));
}

function writeRowsToSheet(workbook: ExcelizeFile, sheet: string, rows: XlsxCellValue[][], start: { col: number; row: number }, opts: Pick<XlsxEditOptions, 'headerStyle' | 'freezeHeader' | 'autofit' | 'styleMode'> = {}): number {
	for (let i = 0; i < rows.length; i++)
		assertOk(workbook.SetSheetRow(sheet, cellName(start.col, start.row + i), rows[i]), `failed to write row ${i + 1}`);
	let stylesApplied = 0;
	if (opts.headerStyle && rows[0]?.length) {
		applyStyle(workbook, sheet, `${cellName(start.col, start.row)}:${cellName(start.col + rows[0].length - 1, start.row)}`, 'header', opts.styleMode ?? 'merge');
		stylesApplied++;
	}
	if (opts.freezeHeader && rows.length)
		assertOk(workbook.SetPanes(sheet, { Freeze: true, YSplit: start.row, TopLeftCell: cellName(start.col, start.row + 1), ActivePane: 'bottomLeft' }), 'failed to freeze header');
	if (opts.autofit) {
		const widths = inferColumnsWidth(rows);
		for (let i = 0; i < widths.length; i++) {
			const col = cellName(start.col + i, 1).replace(/\d+$/, '');
			assertOk(workbook.SetColWidth(sheet, col, col, widths[i]), `failed to set width for ${col}`);
		}
	}
	return stylesApplied;
}

export async function tidyXlsx(opts: XlsxTidyOptions): Promise<XlsxTidyResult> {
	opts.signal?.throwIfAborted();
	const excelize = await loadExcelize();
	const source = await openXlsx(opts.file, opts);
	const sourceSheets = listSheets(source.workbook);
	const beforeSize = fs.statSync(opts.file).size;
	const workbook = assertOk(excelize.NewFile({ RawCellValue: opts.raw }), 'failed to create xlsx');
	const defaultSheet = (workbook.GetSheetList().list ?? [])[0];
	let defaultSheetUsed = false;
	const createCleanSheet = (name: string) => {
		if (!defaultSheetUsed && defaultSheet) {
			if (defaultSheet !== name) assertOk(workbook.SetSheetName(defaultSheet, name), `failed to rename default sheet to ${name}`);
			defaultSheetUsed = true;
			return;
		}
		assertOk(workbook.NewSheet(name), `failed to create sheet ${name}`);
	};
	const sheets: XlsxTidySheetResult[] = [];
	for (const sheet of sourceSheets) {
		const rowsResult = source.workbook.GetRows(sheet.name, { RawCellValue: opts.raw });
		const rows = rowsResult.error ? [] : (rowsResult.result ?? []);
		const computed = computeUsedRange(rows);
		if (!computed.nonEmptyRows && !opts.keepEmptySheets) {
			sheets.push({ name: sheet.name, rows: 0, columns: 0, dropped: true, reason: 'empty' });
			continue;
		}
		createCleanSheet(sheet.name);
		if (rows.length) writeRowsToSheet(workbook, sheet.name, rows, { col: 1, row: 1 }, opts);
		if (computed.nonEmptyRows) assertOk(workbook.SetSheetDimension(sheet.name, computed.dimension), `failed to set sheet dimension for ${sheet.name}`);
		sheets.push({ name: sheet.name, rows: computed.rows, columns: computed.columns, dropped: false });
	}
	opts.signal?.throwIfAborted();
	writeWorkbook(workbook, opts.outFile);
	return {
		file: opts.file, outFile: opts.outFile, beforeSize, afterSize: fs.statSync(opts.outFile).size,
		beforeSheets: sourceSheets.length, afterSheets: workbook.GetSheetList().list?.length ?? 1,
		droppedSheets: sheets.filter((sheet) => sheet.dropped).length, sheets,
	};
}

export async function editXlsx(opts: XlsxEditOptions): Promise<XlsxEditResult> {
	opts.signal?.throwIfAborted();
	const excelize = await loadExcelize();
	opts.signal?.throwIfAborted();
	const sheet = opts.sheet || 'Sheet1';
	const outFile = opts.outFile || opts.file;
	if (!outFile) throw new Error('editXlsx requires outFile when file is not provided');
	const { workbook, created } = openOrCreateWorkbook(excelize, opts.file, opts);
	if (opts.replaceSheet) replaceSheet(workbook, sheet);
	else ensureSheet(workbook, sheet);
	let cellsWritten = 0;
	let stylesApplied = 0;
	const start = parseCellRef(opts.startCell || 'A1');
	let writeStart = start;
	if (opts.append) {
		const rowsResult = workbook.GetRows(sheet, { RawCellValue: opts.raw });
		const existingRows = rowsResult.error ? [] : (rowsResult.result ?? []);
		writeStart = { col: start.col, row: Math.max(start.row, existingRows.length + 1) };
	}
	const rows = opts.rows ?? [];
	if (rows.length) {
		stylesApplied += writeRowsToSheet(workbook, sheet, rows, writeStart, opts);
		cellsWritten += rows.reduce((sum, row) => sum + row.length, 0);
	}
	for (const cell of opts.cells ?? []) {
		assertOk(workbook.SetCellValue(sheet, cell.cell, cell.value ?? ''), `failed to set ${cell.cell}`);
		cellsWritten++;
	}
	for (const style of opts.styles ?? []) {
		applyStyle(workbook, sheet, style.range, style.style, opts.styleMode ?? 'merge');
		stylesApplied++;
	}
	opts.signal?.throwIfAborted();
	writeWorkbook(workbook, outFile);
	return { file: opts.file, outFile, sheet, created, rowsWritten: rows.length, cellsWritten, stylesApplied };
}
