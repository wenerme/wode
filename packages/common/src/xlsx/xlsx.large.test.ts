import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editXlsx } from './edit';
import { exportXlsxCsv } from './export';
import { inspectXlsx, readXlsxSheet } from './read';
import { renderMarkdown, renderTable } from './render/table';
import { renderXlsxReadResult } from './render/xlsx';
import { type ExcelizeApi, type ExcelizeFile, loadExcelize, normalizeRows, openXlsx } from './shared';

// Exercise the JavaScript paths with 200,000 rows without constructing a huge WASM workbook.
vi.mock('./shared', async (importOriginal) => ({
	...await importOriginal<typeof import('./shared')>(),
	loadExcelize: vi.fn(),
	openXlsx: vi.fn(),
}));

let dir: string;
let file: string;
const rowCount = 200_000;
beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-large-'));
	file = path.join(dir, 'fixture.xlsx');
	fs.writeFileSync(file, '');
});
afterEach(() => {
	vi.clearAllMocks();
	fs.rmSync(dir, { recursive: true, force: true });
});

function rows(): string[][] {
	return Array.from({ length: rowCount }, (_, index) => index === rowCount - 1 ? ['last', 'longer-column'] : ['x']);
}

function useRows(data: string[][]) {
	const workbook = {
		GetSheetList: () => ({ list: ['Data'] }),
		GetRows: () => ({ result: data, error: null }),
		GetSheetDimension: () => ({ dimension: '', error: null }),
		GetSheetVisible: () => ({ visible: true, error: null }),
		GetMergeCells: () => ({ mergeCells: [], error: null }),
	} as unknown as ExcelizeFile;
	vi.mocked(openXlsx).mockResolvedValue({ workbook, excelize: {} as ExcelizeApi });
}

describe('XLSX large row counts without argument spreading', () => {
	it('normalizes 200,000 uneven rows without exceeding the argument limit', () => {
		const result = normalizeRows(rows());
		expect(result).toHaveLength(rowCount);
		expect(result[0]).toEqual(['x', '']);
		expect(result.at(-1)).toEqual(['last', 'longer-column']);
	});

	it('reads limit 1 and inspects metadata from 200,000 input rows', async () => {
		useRows(rows());
		const result = await readXlsxSheet(file, { sheet: 'Data', limit: 1 });
		expect(result).toMatchObject({ rows: [['x', '']], columns: 2, totalRows: rowCount, truncated: true });
		const inspected = await inspectXlsx(file, { limit: 1 });
		expect(inspected.sheets[0]).toMatchObject({ rows: rowCount, columns: 2, nonEmptyRows: rowCount, sample: [['x', '']] });
	});

	it('renders raw CSV, generated CSV headers, Markdown, and tables for 200,000 rows', () => {
		const data = rows();
		const result = { file, sheet: 'Data', sheetIndex: 0, rows: data, totalRows: rowCount, columns: 2, truncated: false };
		const raw = renderXlsxReadResult(result, 'csv', { rawRows: true });
		expect(raw.startsWith('x,\n')).toBe(true);
		expect(raw.endsWith('last,longer-column\n')).toBe(true);
		const csv = renderXlsxReadResult(result, 'csv');
		expect(csv.startsWith('c1,c2\n')).toBe(true);
		expect(csv.endsWith('last,longer-column')).toBe(true);
		const table = { columns: ['value'], rows: Array.from({ length: rowCount }, () => ({ value: 'longest' })) };
		expect(renderTable(table).split('\n')).toHaveLength(rowCount + 2);
		expect(renderMarkdown(table).split('\n')).toHaveLength(rowCount + 2);
	});

	it('exports 200,000 rows without exceeding the argument limit', async () => {
		useRows(rows());
		const outDir = path.join(dir, 'csv');
		const result = await exportXlsxCsv(file, outDir, { manifest: false });
		expect(result[0]).toMatchObject({ sheet: 'Data', rows: rowCount, columns: 2 });
		const csv = fs.readFileSync(path.join(outDir, 'Data.csv'), 'utf8');
		expect(csv.split('\n')).toHaveLength(rowCount + 1);
		expect(csv.endsWith('last,longer-column\n')).toBe(true);
	});

	it('computes autofit widths across 200,000 rows without constructing a WASM workbook', async () => {
		const setColWidth = vi.fn(() => ({ error: null }));
		const workbook = {
			error: null,
			GetSheetList: () => ({ list: ['Data'] }),
			SetSheetRow: () => ({ error: null }),
			SetColWidth: setColWidth,
			WriteToBuffer: () => ({ buffer: new Uint8Array(), error: null }),
		} as unknown as ExcelizeFile;
		vi.mocked(loadExcelize).mockResolvedValue({ NewFile: () => workbook } as unknown as ExcelizeApi);
		const result = await editXlsx({ create: true, outFile: path.join(dir, 'out.xlsx'), sheet: 'Data', rows: rows(), autofit: true });
		expect(result.rowsWritten).toBe(rowCount);
		expect(setColWidth.mock.calls).toEqual([
			['Data', 'A', 'A', 10],
			['Data', 'B', 'B', 15],
		]);
	});
});
