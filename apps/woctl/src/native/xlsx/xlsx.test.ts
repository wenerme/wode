import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMemoryCliConfigStore } from 'common/context';
import { editXlsx, openXlsx, readXlsxSheet } from 'common/xlsx';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCli, type CliHost } from '../../createCli';
import { renderNativeDocument } from '../render-document';
import { createXlsxCommand } from './index';

let dir: string;
let file: string;
beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-cli-'));
	file = path.join(dir, 'fixture.xlsx');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function harness(host: Partial<CliHost> = {}) {
	const stdout = vi.fn();
	const io = { stdout, signal: new AbortController().signal };
	const cli = createCli({ config: createMemoryCliConfigStore({}), commands: [createXlsxCommand()], ...host });
	return { cli, stdout, io, run: (argv: string[]) => cli.execute(argv, io), last: () => stdout.mock.calls.at(-1)?.[0] as string };
}

async function fixture() {
	await editXlsx({ create: true, outFile: file, rows: [['产品', '金额'], ['模型', 12.5], ['存储', 3]] });
}

describe('native XLSX commands via host.commands', () => {
	it('reads ranges, offsets, unlimited rows, raw CSV, and header JSONL in an empty service context', async () => {
		await fixture();
		const h = harness();
		await h.run(['xlsx', 'read', file, '--sheet', '0', '--range', 'A1:B2', '--header', '-o', 'jsonl']);
		expect(h.last().trim()).toBe(JSON.stringify({ 产品: '模型', 金额: '12.5' }));
		await h.run(['xlsx', 'read', file, '--offset', '1', '--limit', '0', '--raw', '--raw-rows', '-o', 'csv']);
		expect(h.last()).toBe('模型,12.5\n存储,3\n');
		await h.run(['xlsx', 'read', file]);
		expect(h.last()).toContain('| c1');
		await h.run(['xlsx', 'read', file, '-o', 'json']);
		expect(JSON.parse(h.last())).toMatchObject({ file, rows: [['产品', '金额'], ['模型', '12.5'], ['存储', '3']] });
	});

	it('lists worksheets with aliases and reads prefixed custom properties', async () => {
		await fixture();
		const { workbook } = await openXlsx(file);
		workbook.SetCustomProps({ Name: 'example.label', Value: 'Sample' });
		workbook.SetCustomProps({ Name: 'other', Value: 'Other' });
		fs.writeFileSync(file, workbook.WriteToBuffer().buffer as Uint8Array);
		const h = harness();
		await h.run(['xlsx', 'sheets', file]);
		expect(h.last().trim()).toBe('Sheet1');
		await h.run(['xlsx', 'list', file, '-o', 'yaml']);
		expect(h.last()).toContain('name: Sheet1');
		expect(h.last()).not.toContain('sample:');
		await h.run(['xlsx', 'properties', file, '--prefix', 'example.', '--strip-prefix', '-o', 'json']);
		expect(JSON.parse(h.last()).properties).toEqual([{ name: 'label', value: 'Sample' }]);
		await h.run(['xlsx', 'inspect', file, '--sample', '1', '-o', 'json']);
		expect(JSON.parse(h.last()).sheets[0]).toMatchObject({ computedDimension: 'A1:B3', sample: [['产品', '金额']] });
	});

	it('creates, appends, sets multiple cells, styles, and replaces with explicit in-place writes', async () => {
		const h = harness();
		await h.run(['xlsx', 'edit', '--create', '--out', file, '--csv', 'name,amount\nitem,12.5', '--header-style', '--freeze-header', '--autofit', '--set', 'D1=Status', 'D2=OK', '--style', 'D1=header', '--wrap', 'D:D', '--fill', 'D2=00FF00', '--align', 'A:B=center', '--font-size', 'A:B=14', '--numfmt', 'B2=money', '-o', 'json']);
		expect(JSON.parse(h.last())[0]).toMatchObject({ outFile: file, created: true, rowsWritten: 2, cellsWritten: 6 });
		await h.run(['xlsx', 'edit', file, '--in-place', '--append', '--csv', 'extra,3']);
		expect(h.last()).toContain('rowsWritten');
		expect((await readXlsxSheet(file, { limit: 0, raw: true })).rows[2]).toEqual(['extra', '3', '', '']);
		await h.run(['xlsx', 'edit', file, '--in-place', '--replace-sheet', '--json', '[{"name":"only","amount":1}]', '--style-mode', 'replace']);
		expect((await readXlsxSheet(file, { limit: 0 })).rows).toEqual([['name', 'amount'], ['only', '1']]);
	});

	it('routes CSV and JSON stdin/file inputs through the host with the signal and limits', async () => {
		const readText = vi.fn<NonNullable<CliHost['readText']>>(async (source) => source === '-' ? 'name,value\n"a,b",true' : '[{"key":"one","n":2},{"key":"two","other":false}]');
		const h = harness({ readText });
		await h.run(['xlsx', 'edit', '--create', '--out', file, '--csv-file', '-']);
		expect(readText).toHaveBeenLastCalledWith('-', { signal: h.io.signal, maxBytes: 16 * 1024 * 1024 });
		expect((await readXlsxSheet(file)).rows).toEqual([['name', 'value'], ['a,b', 'TRUE']]);
		const output = path.join(dir, 'json.xlsx');
		await h.run(['xlsx', 'edit', '--create', '--out', output, '--json-file', 'rows.json']);
		expect(readText).toHaveBeenLastCalledWith('@rows.json', { signal: h.io.signal, maxBytes: 16 * 1024 * 1024 });
		expect((await readXlsxSheet(output)).rows).toEqual([['key', 'n', 'other'], ['one', '2', ''], ['two', '', 'FALSE']]);
	});

	it('requires explicit in-place intent for input aliases and leaves rejected workbooks unchanged', async () => {
		await fixture();
		const before = fs.readFileSync(file);
		const alias = path.join(dir, 'alias.xlsx');
		fs.symlinkSync(file, alias);
		const hardlink = path.join(dir, 'hard.xlsx');
		fs.linkSync(file, hardlink);
		const h = harness();
		for (const target of [undefined, file, alias, hardlink]) {
			const args = ['xlsx', 'edit', file, '--set', 'A1=Changed'];
			if (target) args.push('--out', target);
			await expect(h.run(args)).rejects.toThrow('--in-place');
		}
		await expect(h.run(['xlsx', 'tidy', file, '--out', alias])).rejects.toThrow('--in-place');
		expect(fs.readFileSync(file)).toEqual(before);
		const copy = path.join(dir, 'copy.xlsx');
		await h.run(['xlsx', 'edit', file, '--out', copy, '--set', 'A1=Changed']);
		expect(fs.readFileSync(file)).toEqual(before);
		expect((await readXlsxSheet(copy)).rows[0][0]).toBe('Changed');
	});

	it('rejects invalid options and input before writes, without reading stdin for invalid styles', async () => {
		const readText = vi.fn(async () => 'hello');
		const h = harness({ readText });
		const base = ['xlsx', 'edit', '--create', '--out', file];
		await expect(h.run([...base, '--csv', '-', '--style-mode', 'overwrite'])).rejects.toThrow('--style-mode');
		await expect(h.run([...base, '--csv', '-', '--align', 'A:A=middle'])).rejects.toThrow('--align');
		await expect(h.run([...base, '--csv', '-', '--font-size', 'A:A=0'])).rejects.toThrow('positive');
		expect(readText).not.toHaveBeenCalled();
		await expect(h.run([...base, '--csv', 'a', '--json', '[]'])).rejects.toThrow('Use only one');
		await expect(h.run([...base, '--json', '[1]'])).rejects.toThrow('array of arrays');
		await expect(h.run([...base, '--json', '[[{}]]'])).rejects.toThrow('JSON cells');
		await expect(h.run([...base, '--csv', '"unterminated'])).rejects.toThrow('CSV quote');
		await expect(h.run(['xlsx', 'read', file, '--limit', 'bad'])).rejects.toThrow('--limit');
		await expect(h.run(['xlsx', 'export', file, '-o', 'pdf'])).rejects.toThrow('Only CSV');
		expect(fs.existsSync(file)).toBe(false);
	});

	it('tidies and exports selected sheets with BOM and without a manifest', async () => {
		await editXlsx({ create: true, outFile: file, sheet: 'Data', rows: [['name', 'value'], ['item', 4]] });
		const h = harness();
		const clean = path.join(dir, 'clean.xlsx');
		await h.run(['xlsx', 'tidy', file, '--out', clean, '--header-style', '--freeze-header', '--autofit', '-o', 'json']);
		expect(JSON.parse(h.last())).toMatchObject({ outFile: clean, beforeSheets: 2, afterSheets: 1, droppedSheets: 1 });
		const outDir = path.join(dir, 'csv');
		await h.run(['xlsx', 'export', file, '--sheet', '1', '--out-dir', outDir, '--bom', '--no-manifest']);
		expect(fs.readdirSync(outDir)).toEqual(['Data.csv']);
		expect(fs.readFileSync(path.join(outDir, 'Data.csv'), 'utf8')).toBe('\uFEFFname,value\nitem,4\n');
		expect(JSON.parse(h.last()).exports[0]).toMatchObject({ sheet: 'Data', rows: 2, columns: 2 });
		await h.run(['xlsx', 'tidy', clean, '--in-place']);
		expect((await readXlsxSheet(clean)).rows[1]).toEqual(['item', '4']);
	});

	it('exports a numeric worksheet name using the resolved index from CLI selection', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['name'], ['first']] });
		await editXlsx({ file, sheet: '0', rows: [['name'], ['numeric']] });
		const h = harness();
		const allDir = path.join(dir, 'all');
		await h.run(['xlsx', 'export', file, '--out-dir', allDir]);
		expect(fs.readFileSync(path.join(allDir, 'Sheet1.csv'), 'utf8')).toBe('name\nfirst\n');
		expect(fs.readFileSync(path.join(allDir, '0.csv'), 'utf8')).toBe('name\nnumeric\n');
		const selectedDir = path.join(dir, 'selected');
		await h.run(['xlsx', 'export', file, '--sheet', '1', '--out-dir', selectedDir, '--no-manifest']);
		expect(fs.readdirSync(selectedDir)).toEqual(['0.csv']);
		expect(fs.readFileSync(path.join(selectedDir, '0.csv'), 'utf8')).toBe('name\nnumeric\n');
	});

	it('renders real workbooks as clean CSV through the root render command and requires a single selected sheet', async () => {
		await editXlsx({ create: true, outFile: file, rows: [['name', 'value'], ['first', 1], ['second', 2]] });
		const h = harness({ renderDocument: renderNativeDocument });
		await h.run(['render', file, '--format', 'csv', '--limit', '2']);
		expect(h.last()).toBe('name,value\nfirst,1');
		await h.run(['render', file, '--format', 'csv', '--limit', '2', '--no-header']);
		expect(h.last()).toBe('name,value\nfirst,1\n');
		await editXlsx({ file, sheet: '0', rows: [['name', 'value'], ['numeric', 3]] });
		h.stdout.mockClear();
		await expect(h.run(['render', file, '--format', 'csv'])).rejects.toThrow('--sheet');
		expect(h.stdout).not.toHaveBeenCalled();
		await h.run(['render', file, '--format', 'csv', '--sheet', '1']);
		expect(h.last()).toBe('name,value\nnumeric,3');
	});

	it('propagates cancellation after host input and writes no workbook', async () => {
		const controller = new AbortController();
		const h = harness({ readText: async () => { controller.abort(new Error('Cancelled')); return 'name\nitem'; } });
		await expect(h.cli.execute(['xlsx', 'edit', '--create', '--out', file, '--csv', '-'], { ...h.io, signal: controller.signal })).rejects.toThrow('Cancelled');
		expect(fs.existsSync(file)).toBe(false);
		expect(h.stdout).not.toHaveBeenCalled();
	});
});
