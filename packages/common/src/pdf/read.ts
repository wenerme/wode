import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePdfPageSelection } from './inspect.js';
import { loadPdfJs, pdfJsDocumentOptions } from './runtime.js';

export interface PdfReadOptions {
	pages?: string;
	pageLimit?: number;
	password?: string;
	verbosity?: 'errors' | 'warnings' | 'infos';
	includePageHeadings?: boolean;
	includeFrontmatter?: boolean;
	preserveEmptyPages?: boolean;
	lineGap?: number;
}
export interface PdfReadTextItem {
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	fontName?: string;
	dir?: string;
	hasEol?: boolean;
}
export interface PdfReadPage {
	number: number;
	label?: string;
	widthPt: number;
	heightPt: number;
	lines: string[];
	text: string;
	items: PdfReadTextItem[];
}
export interface PdfReadResult {
	kind: 'pdf.read';
	file: { path: string; name: string; sizeBytes: number; sha256: string };
	document: { pages: number; pdfVersion?: string; fingerprints?: Array<string | null>; pdfjsVersion?: string };
	pages: { selected: number[]; sampled: number; total: number; items: PdfReadPage[] };
	markdown: string;
	text: string;
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function textItem(value: unknown): PdfReadTextItem | undefined {
	if (!isRecord(value) || typeof value.str !== 'string') return undefined;
	const transform = Array.isArray(value.transform) ? value.transform : [];
	return {
		text: value.str,
		x: Number(transform[4] ?? 0),
		y: Number(transform[5] ?? 0),
		width: typeof value.width === 'number' ? value.width : 0,
		height: typeof value.height === 'number' ? value.height : Math.abs(Number(transform[3] ?? 0)),
		fontName: typeof value.fontName === 'string' ? value.fontName : undefined,
		dir: typeof value.dir === 'string' ? value.dir : undefined,
		hasEol: typeof value.hasEOL === 'boolean' ? value.hasEOL : undefined,
	};
}
function shouldInsertSpace(left: PdfReadTextItem, right: PdfReadTextItem): boolean {
	if (!left.text || !right.text || /\s$/u.test(left.text) || /^\s/u.test(right.text)) return false;
	if (
		/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(left.text) &&
		/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(right.text)
	)
		return false;
	return right.x - (left.x + left.width) > Math.max(1.5, Math.min(left.height || right.height || 8, 12) * 0.2);
}
function groupLines(items: PdfReadTextItem[], lineGap: number): string[] {
	const rows: PdfReadTextItem[][] = [];
	for (const item of items.filter((entry) => entry.text.trim()).sort((a, b) => b.y - a.y || a.x - b.x)) {
		let row = rows.find((candidate) => Math.abs((candidate[0]?.y ?? 0) - item.y) <= lineGap);
		if (!row) {
			row = [];
			rows.push(row);
		}
		row.push(item);
	}
	return rows
		.sort((a, b) => (b[0]?.y ?? 0) - (a[0]?.y ?? 0))
		.map((row) => row.sort((a, b) => a.x - b.x))
		.map((row) =>
			row
				.reduce(
					(out, item, index) => `${out}${index > 0 && shouldInsertSpace(row[index - 1]!, item) ? ' ' : ''}${item.text}`,
					'',
				)
				.trim(),
		)
		.filter(Boolean);
}
function renderMarkdown(result: Omit<PdfReadResult, 'markdown' | 'text'>, options: PdfReadOptions): string {
	const lines: string[] = [];
	if (options.includeFrontmatter)
		lines.push(
			'---',
			`title: ${JSON.stringify(result.file.name)}`,
			`pages: ${result.document.pages}`,
			`selectedPages: ${JSON.stringify(result.pages.selected)}`,
			`source: ${JSON.stringify(result.file.path)}`,
			'---',
			'',
		);
	lines.push(`# ${result.file.name.replace(/[\r\n]+/g, ' ').trim()}`, '');
	for (const page of result.pages.items) {
		if (options.includePageHeadings !== false) lines.push(`## Page ${page.label ?? page.number}`, '');
		if (page.lines.length) lines.push(...page.lines, '');
		else if (options.preserveEmptyPages) lines.push('_(empty page)_', '');
	}
	return lines
		.join('\n')
		.replace(/\n{4,}/g, '\n\n\n')
		.trimEnd();
}
export async function readPdfText(filePath: string, options: PdfReadOptions = {}): Promise<PdfReadResult> {
	const absolute = path.resolve(filePath);
	const bytes = await readFile(absolute);
	const pdfjs = await loadPdfJs();
	const verbosity =
		options.verbosity === 'infos'
			? pdfjs.VerbosityLevel.INFOS
			: options.verbosity === 'warnings'
				? pdfjs.VerbosityLevel.WARNINGS
				: pdfjs.VerbosityLevel.ERRORS;
	const task = pdfjs.getDocument({
		...pdfJsDocumentOptions(),
		data: new Uint8Array(bytes),
		password: options.password,
		verbosity,
	});
	try {
		const pdf = await task.promise;
		const [metadata, labels] = await Promise.all([
			pdf.getMetadata().catch(() => undefined),
			pdf.getPageLabels().catch(() => null),
		]);
		const info = metadata?.info && isRecord(metadata.info) ? metadata.info : {};
		const selected = options.pages
			? parsePdfPageSelection(options.pages, pdf.numPages)
			: Array.from({ length: Math.min(options.pageLimit ?? pdf.numPages, pdf.numPages) }, (_, i) => i + 1);
		const pages: PdfReadPage[] = [];
		for (const number of selected) {
			const page = await pdf.getPage(number);
			const content = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
			const items = content.items.flatMap((item) => {
				const parsed = textItem(item);
				return parsed ? [parsed] : [];
			});
			const lines = groupLines(items, options.lineGap ?? 3);
			pages.push({
				number,
				label: labels?.[number - 1],
				widthPt: Math.abs((page.view[2] ?? 0) - (page.view[0] ?? 0)),
				heightPt: Math.abs((page.view[3] ?? 0) - (page.view[1] ?? 0)),
				items,
				lines,
				text: lines.join('\n'),
			});
		}
		const base = {
			kind: 'pdf.read' as const,
			file: {
				path: absolute,
				name: path.basename(absolute),
				sizeBytes: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
			},
			document: {
				pages: pdf.numPages,
				pdfVersion: typeof info.PDFFormatVersion === 'string' ? info.PDFFormatVersion : undefined,
				fingerprints: pdf.fingerprints,
				pdfjsVersion: pdfjs.version,
			},
			pages: { selected, sampled: pages.length, total: pdf.numPages, items: pages },
		};
		return {
			...base,
			markdown: renderMarkdown(base, options),
			text: pages
				.map((page) => page.text)
				.filter(Boolean)
				.join('\n\n'),
		};
	} finally {
		await task.destroy();
	}
}
