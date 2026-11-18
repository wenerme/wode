import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { formatPdfDate, inspectPdf, parsePdfPageSelection, readPdfInfo, readPdfText, renderPdfPages } from './index.js';
import { renderPdfInfoMarkdown, renderPdfInspectMarkdown, renderPdfParseMarkdown } from './markdown/index.js';
import { listPdfParseTemplates, parsePdfReadResultWithTemplate, parsePdfWithTemplate } from './parser/index.js';
import { pdfJsDocumentOptions, resolvePdfAsset } from './runtime.js';
import { createMinimalOnePagePdf, createMultiPagePdf, createTextPdf } from './document.fixture.js';

const dirs: string[] = [];
async function pdf(content: string) {
	const dir = await mkdtemp(path.join(os.tmpdir(), 'common-pdf-'));
	dirs.push(dir);
	const file = path.join(dir, 'sample.pdf');
	await writeFile(file, content);
	return file;
}
afterEach(async () => {
	await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('common/pdf', () => {
	it('resolves worker and WASM from standard installed packages', async () => {
		for (const name of [
			'pdfjs-dist/legacy/build/pdf.worker.mjs',
			'@hyzyla/pdfium/pdfium.wasm',
			'canvaskit-wasm/bin/canvaskit.wasm',
		])
			expect((await readFile(resolvePdfAsset(name))).length).toBeGreaterThan(1000);
		const resources = pdfJsDocumentOptions();
		for (const dir of [resources.cMapUrl, resources.standardFontDataUrl, resources.wasmUrl])
			expect(path.isAbsolute(dir)).toBe(true);
	});
	it('reads metadata, page sizes, hashes and date fields', async () => {
		expect(formatPdfDate('D:20260602123456')).toBe('2026-06-02 12:34:56');
		const file = await pdf(createMinimalOnePagePdf('/Title (Example PDF) /CreationDate (D:20260602123456)'));
		const info = await readPdfInfo(file);
		expect(info.document.pages).toBe(1);
		expect(info.metadata).toMatchObject({ title: 'Example PDF', creationDate: '2026-06-02 12:34:56' });
		expect(info.file.sha256).toMatch(/^[a-f0-9]{64}$/);
		expect(info.pages.items[0]).toMatchObject({ widthPt: 612, heightPt: 792, orientation: 'portrait' });
		expect(renderPdfInfoMarkdown(info)).toContain('# PDF Info');
	});
	it('selects page ranges, reverse ranges, deduplicates and rejects invalid selections', () => {
		expect(parsePdfPageSelection('3-1,last,odd,even', 4)).toEqual([3, 2, 1, 4]);
		expect(parsePdfPageSelection('-2,last', 4)).toEqual([1, 2, 4]);
		expect(parsePdfPageSelection('all', 4)).toEqual([1, 2, 3, 4]);
		for (const selector of ['0', '5', '1-8', '', 'garbage']) expect(() => parsePdfPageSelection(selector, 4)).toThrow();
	});
	it('extracts text with frontmatter and heading options', async () => {
		const file = await pdf(createTextPdf(['Hello PDF', 'Invoice No: INV-1']));
		const read = await readPdfText(file);
		expect(read.pages.items[0]?.lines).toEqual(['Hello PDF', 'Invoice No: INV-1']);
		expect(read.markdown).toContain('## Page 1');
		const noHeadings = await readPdfText(file, { includePageHeadings: false, includeFrontmatter: true });
		expect(noHeadings.markdown).toMatch(/^---\ntitle:/);
		expect(noHeadings.markdown).not.toContain('## Page');
	});
	it('inspects detailed page and catalog sections with bounded text', async () => {
		const result = await inspectPdf(await pdf(createTextPdf(['Hello inspected PDF'])), {
			detail: 'debug',
			includeText: true,
			textLimit: 5,
		});
		expect(result.pages?.items[0]?.text).toMatchObject({ sample: 'Hello', truncated: true });
		expect(result.pages?.items[0]?.operators).toHaveProperty('fnCount');
		expect(result.catalog).toBeDefined();
		expect(result.timings).toHaveProperty('totalMs');
		expect(result.errors).toEqual([]);
		expect(renderPdfInspectMarkdown(result)).toContain('# PDF Inspect');
	});
	it('samples pages and preserves explicit order across read/inspect/render', async () => {
		const file = await pdf(createMultiPagePdf());
		expect((await readPdfInfo(file, { pageLimit: 1 })).pages.truncated).toBe(true);
		expect((await readPdfInfo(file, { allPages: true })).pages.sampled).toBe(3);
		const read = await readPdfText(file, { pages: 'last,first', preserveEmptyPages: true });
		expect(read.pages.selected).toEqual([3, 1]);
		expect(read.markdown).toContain('_(empty page)_');
		expect((await inspectPdf(file, { pages: 'last,first' })).pages?.selected).toEqual([3, 1]);
		const rendered = await renderPdfPages(file, { pages: 'last,first', width: 36, height: 36, dpi: 72 });
		expect(rendered.pages.selected).toEqual([3, 1]);
		expect(rendered.pages.items[0]).toMatchObject({ widthPx: 18, heightPx: 36 });
	});
	it('renders real PNG pixels and resolution metadata with PDFium and CanvasKit', async () => {
		const result = await renderPdfPages(await pdf(createTextPdf(['Rendered PDF'])), { dpi: 72 });
		const page = result.pages.items[0]!;
		expect(page).toMatchObject({ widthPx: 612, heightPx: 792, mediaType: 'image/png' });
		const png = Buffer.from(page.data);
		expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
		const phys = png.indexOf('pHYs');
		expect(png.readUInt32BE(phys + 4)).toBe(Math.round(72 / 0.0254));
		expect(png.readUInt32BE(16)).toBe(612);
	});
	it('parses generic invoice, receipt and statement fixtures and auto-ranks them', async () => {
		const cases = [
			{
				template: 'invoice.generic',
				lines: [
					'INVOICE',
					'Invoice No: INV-1001',
					'Date: 2026-06-02',
					'From: Example Seller',
					'Bill To: Example Buyer',
					'Service 2 50.00 100.00',
					'Subtotal: USD 100.00',
					'Tax: USD 6.00',
					'Total: USD 106.00',
				],
				expected: { invoiceNumber: 'INV-1001', totalAmount: 106 },
			},
			{
				template: 'receipt.generic',
				lines: [
					'RECEIPT',
					'Receipt No: R-1001',
					'Date: 2026-06-02',
					'Merchant: Example Store',
					'Payment Method: Card',
					'Coffee 2 18.00',
					'Tax: USD 1.08',
					'Total: USD 19.08',
				],
				expected: { receiptNumber: 'R-1001', totalAmount: 19.08 },
			},
			{
				template: 'bank.statement.generic',
				lines: [
					'BANK STATEMENT',
					'Account Number: 0000 0000',
					'Statement Period: 2026-01-01 to 2026-01-31',
					'Opening Balance: USD 100.00',
					'Date Description Debit Credit Balance',
					'2026-01-02 Deposit  200.00 300.00',
					'Closing Balance: USD 300.00',
				],
				expected: { accountNumber: '0000 0000', closingBalance: 300 },
			},
		];
		for (const sample of cases) {
			const file = await pdf(createTextPdf(sample.lines));
			const selected = await parsePdfWithTemplate(file, { template: sample.template, debug: true });
			expect(selected.result.data).toMatchObject(sample.expected);
			expect(selected.read?.text).toContain(sample.lines[0]);
			expect((await parsePdfWithTemplate(file)).selectedTemplate.name).toBe(sample.template);
			expect(renderPdfParseMarkdown(selected)).toContain('# PDF Parse');
		}
	});
	it('retains VAT template fields with synthetic data, aliases and confidence gates', () => {
		const text = [
			'电子发票（增值税专用发票） 发票号码：00000000000000000001',
			'开票日期：2026年01月02日',
			'购名称：示例购买方销名称：示例销售方',
			'信统一社会信用代码/纳税人识别号：000000000000000001 信统一社会信用代码/纳税人识别号：000000000000000002',
			'购买方 销售方',
			'*服务*测试 1 100.00 100.00 6% 6.00',
			'合计 ¥100.00 ¥6.00',
			'价税合计（大写） 壹佰零陆圆整 （小写）¥106.00',
			'开票人：示例',
		].join('\n');
		const read = {
			kind: 'pdf.read' as const,
			file: { path: 'invoice.pdf', name: 'invoice.pdf', sizeBytes: 0, sha256: '' },
			document: { pages: 1 },
			pages: { selected: [1], sampled: 1, total: 1, items: [] },
			markdown: text,
			text,
		};
		const result = parsePdfReadResultWithTemplate(read, { template: 'invoice' });
		expect(result.selectedTemplate.name).toBe('invoice.zh.vat');
		expect(result.result.data).toMatchObject({
			invoiceDate: '2026-01-02',
			invoiceNumber: '00000000000000000001',
			buyer: { name: '示例购买方', taxId: '000000000000000001' },
			seller: { name: '示例销售方', taxId: '000000000000000002' },
			totalAmount: 106,
		});
		expect(listPdfParseTemplates()).toHaveLength(4);
		expect(() => parsePdfReadResultWithTemplate({ ...read, text: 'empty' })).toThrow('confidence too low');
		expect(() => parsePdfReadResultWithTemplate(read, { template: 'missing' })).toThrow('unknown PDF parse template');
	});
});
