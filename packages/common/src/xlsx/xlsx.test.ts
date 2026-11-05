import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	editXlsx, exportXlsxCsv, inspectXlsx, openXlsx, readXlsxCustomProperties, readXlsxSheet, readXlsxWorkbook,
	renderXlsxReadResult, renderXlsxWorkbookResult, resolveExcelizeWasm, tidyXlsx,
} from './index';

let dir: string;
let file: string;
beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-core-'));
	file = path.join(dir, 'fixture.xlsx');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

async function fixture() {
	await editXlsx({ create: true, outFile: file, rows: [['产品', '金额'], ['模型', 12.5], ['存储', 3]] });
	return file;
}

describe('XLSX real WASM file operations', () => {
	it('resolves the installed compressed WASM resource and reads bounded ranges', async () => {
		expect(fs.statSync(resolveExcelizeWasm()).size).toBeGreaterThan(0);
		await fixture();
		const result = await readXlsxSheet(file, { sheet: '0', range: 'A1:B3', offset: 1, limit: 1 });
		expect(result).toMatchObject({ sheet: 'Sheet1', sheetIndex: 0, totalRows: 3, columns: 2, truncated: true, rows: [['模型', '12.5']] });
		expect((await readXlsxSheet(file, { range: 'B2:B3', limit: 0, raw: true })).rows).toEqual([['12.5'], ['3']]);
		await expect(readXlsxSheet(file, { range: 'A0:B1' })).rejects.toThrow('invalid cell reference');
		await expect(readXlsxSheet(file, { sheet: 'missing' })).rejects.toThrow('sheet not found');
	});

	it('preserves per-cell style merging and supports replacement, full-column styles, freeze and autofit', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['Name', 'Amount'], ['Item', 0.25]], headerStyle: true, freezeHeader: true, autofit: true, styles: [
			{ range: 'B2', style: 'percent' }, { range: 'B2', style: 'bold' }, { range: 'C:C', style: { Font: { Size: 14 } } },
		] });
		let { workbook } = await openXlsx(file);
		const style = workbook.GetStyle(workbook.GetCellStyle('Sheet1', 'B2').style).style;
		expect(style.Font?.Bold).toBe(true);
		expect(style.CustomNumFmt).toBe('0.00%');
		expect(workbook.GetPanes('Sheet1').panes).toMatchObject({ Freeze: true, YSplit: 1, TopLeftCell: 'A2' });
		expect(workbook.GetColWidth('Sheet1', 'A').width).toBeGreaterThanOrEqual(8);
		expect((await readXlsxSheet(file)).rows[1][1]).toBe('25.00%');
		expect((await readXlsxSheet(file, { raw: true })).rows[1][1]).toBe('0.25');
		await editXlsx({ file, styleMode: 'replace', styles: [{ range: 'B2', style: 'wrap' }] });
		({ workbook } = await openXlsx(file));
		const replaced = workbook.GetStyle(workbook.GetCellStyle('Sheet1', 'B2').style).style;
		expect(replaced.Alignment?.WrapText).toBe(true);
		expect(replaced.Font?.Bold ?? false).toBe(false);
	});

	it('appends at the requested column and replaces the only worksheet', async () => {
		await fixture();
		await editXlsx({ file, append: true, startCell: 'B1', rows: [['extra', true]], cells: [{ cell: 'D1', value: 'Status' }] });
		expect((await readXlsxSheet(file, { limit: 0 })).rows[3]).toEqual(['', 'extra', 'TRUE', '']);
		await editXlsx({ file, replaceSheet: true, rows: [['only', 1]] });
		expect((await readXlsxSheet(file, { limit: 0 })).rows).toEqual([['only', '1']]);
		expect((await inspectXlsx(file)).sheets.map((sheet) => sheet.name)).toEqual(['Sheet1']);
	});

	it('reads custom properties and exposes workbook render API with duplicate headers', async () => {
		await fixture();
		const { workbook } = await openXlsx(file);
		expect(workbook.SetCustomProps({ Name: 'example.label', Value: 'Sample' }).error).toBeFalsy();
		const buffer = workbook.WriteToBuffer();
		expect(buffer.error).toBeFalsy();
		fs.writeFileSync(file, buffer.buffer as Uint8Array);
		expect((await readXlsxCustomProperties(file)).properties).toEqual([{ name: 'example.label', value: 'Sample' }]);
		await editXlsx({ file, sheet: 'Duplicates', rows: [['name', 'name', 'name_2'], ['a', 'b', 'c']] });
		const result = await readXlsxWorkbook(file, { limit: 0 });
		expect(result.sheets).toHaveLength(2);
		expect(renderXlsxWorkbookResult(result, 'md', { detectHeader: true })).toContain('# Duplicates');
		expect(JSON.parse(renderXlsxReadResult(result.sheets[1], 'jsonl', { detectHeader: true }))).toEqual({ name: 'a', name_2: 'b', name_2_2: 'c' });
	});

	it('tidies stale dimensions and empty sheets while retaining data and optional empty sheets', async () => {
		await editXlsx({ create: true, outFile: file, sheet: 'Data', rows: [['name', 'amount'], ['item', 12]] });
		const clean = path.join(dir, 'clean.xlsx');
		const result = await tidyXlsx({ file, outFile: clean, headerStyle: true, freezeHeader: true, autofit: true });
		expect(result).toMatchObject({ beforeSheets: 2, afterSheets: 1, droppedSheets: 1 });
		expect((await inspectXlsx(clean)).sheets[0]).toMatchObject({ name: 'Data', computedDimension: 'A1:B2', rows: 2, columns: 2, nonEmptyRows: 2 });
		expect((await readXlsxSheet(clean)).rows).toEqual([['name', 'amount'], ['item', '12']]);
		const kept = await tidyXlsx({ file, outFile: path.join(dir, 'kept.xlsx'), keepEmptySheets: true });
		expect(kept).toMatchObject({ afterSheets: 2, droppedSheets: 0 });
	});

	it('exports exact CSV rows with quoting, BOM, manifest, and distinct filenames after sanitization', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['name', 'note'], ['a,b', 'say "hi"\nnext']] });
		await editXlsx({ file, sheet: 'A B', rows: [['second']] });
		await editXlsx({ file, sheet: 'A_B', rows: [['third']] });
		const outDir = path.join(dir, 'csv');
		const result = await exportXlsxCsv(file, outDir, { bom: true });
		expect(result).toHaveLength(3);
		expect(new Set(result.map((entry) => entry.path)).size).toBe(3);
		expect(fs.readFileSync(result[0].path, 'utf8')).toBe('\uFEFFname,note\n"a,b","say ""hi""\nnext"\n');
		expect(JSON.parse(fs.readFileSync(path.join(outDir, 'xlsx.manifest.json'), 'utf8'))).toMatchObject({ file, format: 'csv', raw: false, exports: result });
		const selected = path.join(dir, 'selected');
		await exportXlsxCsv(file, selected, { sheets: [{ name: 'A B', index: 1 }], manifest: false });
		expect(fs.readdirSync(selected)).toEqual(['A_B.csv']);
	});

	it('exports numeric worksheet names by their resolved index and reads each workbook sheet exactly once', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['name', 'value'], ['first', 1]] });
		await editXlsx({ file, sheet: '0', rows: [['name', 'value'], ['numeric', 2]] });
		const result = await readXlsxWorkbook(file, { limit: 0 });
		expect(result.sheets.map(({ sheet, sheetIndex, rows }) => ({ sheet, sheetIndex, rows }))).toEqual([
			{ sheet: 'Sheet1', sheetIndex: 0, rows: [['name', 'value'], ['first', '1']] },
			{ sheet: '0', sheetIndex: 1, rows: [['name', 'value'], ['numeric', '2']] },
		]);
		const outDir = path.join(dir, 'numeric');
		await exportXlsxCsv(file, outDir);
		expect(fs.readFileSync(path.join(outDir, 'Sheet1.csv'), 'utf8')).toBe('name,value\nfirst,1\n');
		expect(fs.readFileSync(path.join(outDir, '0.csv'), 'utf8')).toBe('name,value\nnumeric,2\n');
		const selectedDir = path.join(dir, 'numeric-selected');
		await exportXlsxCsv(file, selectedDir, { sheets: [{ name: '0', index: 1 }], manifest: false });
		expect(fs.readdirSync(selectedDir)).toEqual(['0.csv']);
		expect(fs.readFileSync(path.join(selectedDir, '0.csv'), 'utf8')).toBe('name,value\nnumeric,2\n');
	});

	it('renders single-sheet CSV without workbook headings or truncation prose and rejects multiple sheets', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['name', 'value'], ['first', 1], ['second', 2]] });
		const single = await readXlsxWorkbook(file, { limit: 2 });
		expect(single.sheets[0].truncated).toBe(true);
		expect(renderXlsxWorkbookResult(single, 'csv', { detectHeader: true })).toBe('name,value\nfirst,1');
		expect(renderXlsxWorkbookResult(single, 'csv', { rawRows: true })).toBe('name,value\nfirst,1\n');
		await editXlsx({ file, sheet: 'Other', rows: [['name', 'value'], ['other', 3]] });
		const multi = await readXlsxWorkbook(file, { limit: 0 });
		expect(() => renderXlsxWorkbookResult(multi, 'csv')).toThrow('select one with --sheet');
		const selected = await readXlsxWorkbook(file, { sheet: 'Other', limit: 0 });
		expect(renderXlsxWorkbookResult(selected, 'csv', { detectHeader: true })).toBe('name,value\nother,3');
	});

	it('aborts before touching workbook or output files', async () => {
		const signal = AbortSignal.abort(new Error('Cancelled'));
		await expect(editXlsx({ create: true, outFile: file, rows: [['hello']], signal })).rejects.toThrow('Cancelled');
		await expect(readXlsxSheet(file, { signal })).rejects.toThrow('Cancelled');
		await expect(tidyXlsx({ file, outFile: path.join(dir, 'clean.xlsx'), signal })).rejects.toThrow('Cancelled');
		await expect(exportXlsxCsv(file, path.join(dir, 'csv'), { signal })).rejects.toThrow('Cancelled');
		expect(fs.readdirSync(dir)).toEqual([]);
	});
});
