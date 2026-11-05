import fs from 'node:fs';
import path from 'node:path';
import { inspectXlsx, readXlsxSheet } from './read.js';
import type { XlsxExportResult } from './shared.js';

function safeSheetFileName(name: string): string {
	return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'Sheet';
}

function rowsToCsv(rows: string[][], bom = false): string {
	const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
	const csv = rows.map((row) => Array.from({ length: width }, (_, index) => {
		const text = String(row[index] ?? '');
		return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
	}).join(',')).join('\n');
	return `${bom ? '\uFEFF' : ''}${csv}${csv ? '\n' : ''}`;
}

export async function exportXlsxCsv(
	file: string,
	outDir?: string,
	opts: { sheets?: Array<{ name: string; index: number }>; raw?: boolean; bom?: boolean; manifest?: boolean; signal?: AbortSignal } = {},
): Promise<XlsxExportResult[]> {
	const inspect = await inspectXlsx(file, { limit: 0, raw: opts.raw, signal: opts.signal });
	const selectedSheets = opts.sheets ?? inspect.sheets.map((sheet) => ({ name: sheet.name, index: sheet.index }));
	const dir = outDir ?? path.join(path.dirname(file), path.basename(file, path.extname(file)));
	opts.signal?.throwIfAborted();
	fs.mkdirSync(dir, { recursive: true });
	const exports: XlsxExportResult[] = [];
	const usedNames = new Set<string>();
	for (const sheet of selectedSheets) {
		const result = await readXlsxSheet(file, { sheet: String(sheet.index), limit: 0, raw: opts.raw, signal: opts.signal });
		const base = safeSheetFileName(sheet.name);
		let name = base;
		let suffix = 1;
		while (usedNames.has(name.toLowerCase())) name = `${base}_${++suffix}`;
		usedNames.add(name.toLowerCase());
		const out = path.join(dir, `${name}.csv`);
		opts.signal?.throwIfAborted();
		fs.writeFileSync(out, rowsToCsv(result.rows, opts.bom), 'utf8');
		exports.push({ sheet: sheet.name, path: out, rows: result.totalRows, columns: result.columns });
	}
	opts.signal?.throwIfAborted();
	if (opts.manifest !== false) fs.writeFileSync(path.join(dir, 'xlsx.manifest.json'), JSON.stringify({ file, outDir: dir, format: 'csv', raw: Boolean(opts.raw), exports, sheets: inspect.sheets }, null, 2));
	return exports;
}
