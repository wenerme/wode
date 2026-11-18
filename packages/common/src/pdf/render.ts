import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CanvasKit } from 'canvaskit-wasm';
import { parsePdfPageSelection } from './inspect.js';
import { resolvePdfAsset } from './runtime.js';

const DefaultPdfRenderDpi = 150;
export interface PdfRenderOptions {
	pages?: string;
	pageLimit?: number;
	password?: string;
	dpi?: number;
	scale?: number;
	width?: number;
	height?: number;
	transparent?: boolean;
	renderFormFields?: boolean;
}
export interface PdfRenderedPage {
	number: number;
	widthPt: number;
	heightPt: number;
	widthPx: number;
	heightPx: number;
	dpi: number;
	scale: number;
	mediaType: 'image/png';
	data: Uint8Array;
}
export interface PdfRenderResult {
	kind: 'pdf.render';
	file: { path: string; name: string; sizeBytes: number; sha256: string };
	document: { pages: number };
	pages: { selected: number[]; sampled: number; total: number; items: PdfRenderedPage[] };
}
type PdfiumModule = typeof import('@hyzyla/pdfium');
type PdfiumLibraryInstance = Awaited<ReturnType<PdfiumModule['PDFiumLibrary']['init']>>;
type PdfiumDocument = Awaited<ReturnType<PdfiumLibraryInstance['loadDocument']>>;
type PdfiumPage = ReturnType<PdfiumDocument['getPage']>;
type PdfiumRenderOptions = { data: Uint8Array; width: number; height: number };
let pdfiumLibraryPromise: Promise<PdfiumLibraryInstance> | undefined;
let canvasKitPromise: Promise<CanvasKit> | undefined;
let pngCrcTable: Uint32Array | undefined;

async function loadPdfiumLibrary(): Promise<PdfiumLibraryInstance> {
	pdfiumLibraryPromise ??= (async () => {
		const [{ PDFiumLibrary }, wasm] = await Promise.all([
			import('@hyzyla/pdfium'),
			readFile(resolvePdfAsset('@hyzyla/pdfium/pdfium.wasm')),
		]);
		return PDFiumLibrary.init({
			wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer,
		});
	})();
	return pdfiumLibraryPromise;
}
async function loadCanvasKit(): Promise<CanvasKit> {
	canvasKitPromise ??= (async () => {
		const CanvasKitInit = (await import('canvaskit-wasm')).default;
		const wasmPath = resolvePdfAsset('canvaskit-wasm/bin/canvaskit.wasm');
		return CanvasKitInit({ locateFile: (file) => (file === 'canvaskit.wasm' ? wasmPath : file) });
	})();
	return canvasKitPromise;
}
async function encodeRgbaToPng({ data, width, height }: PdfiumRenderOptions): Promise<Uint8Array> {
	const kit = await loadCanvasKit();
	const image = kit.MakeImage(
		{
			width,
			height,
			colorType: kit.ColorType.RGBA_8888,
			alphaType: kit.AlphaType.Unpremul,
			colorSpace: kit.ColorSpace.SRGB,
		},
		data,
		width * 4,
	);
	if (!image) throw new Error(`CanvasKit failed to create image ${width}x${height}`);
	try {
		const encoded = image.encodeToBytes(kit.ImageFormat.PNG, 100);
		if (!encoded) throw new Error(`CanvasKit failed to encode PNG ${width}x${height}`);
		return encoded;
	} finally {
		image.delete();
	}
}
function pngCrc32(data: Uint8Array): number {
	let table = pngCrcTable;
	if (!table) {
		table = new Uint32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			table[n] = c >>> 0;
		}
		pngCrcTable = table;
	}
	let crc = 0xffffffff;
	for (const byte of data) crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Uint8Array): Buffer {
	const typeBuffer = Buffer.from(type, 'ascii');
	const chunk = Buffer.alloc(12 + data.length);
	chunk.writeUInt32BE(data.length, 0);
	typeBuffer.copy(chunk, 4);
	Buffer.from(data).copy(chunk, 8);
	chunk.writeUInt32BE(pngCrc32(Buffer.concat([typeBuffer, Buffer.from(data)])), 8 + data.length);
	return chunk;
}
export function setPdfRenderPngDpi(png: Uint8Array, dpi: number = DefaultPdfRenderDpi): Uint8Array {
	const buffer = Buffer.from(png);
	if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return png;
	const ppm = Math.max(1, Math.round(dpi / 0.0254));
	const data = Buffer.alloc(9);
	data.writeUInt32BE(ppm, 0);
	data.writeUInt32BE(ppm, 4);
	data[8] = 1;
	const phys = pngChunk('pHYs', data);
	const parts: Buffer[] = [buffer.subarray(0, 8)];
	let offset = 8;
	let inserted = false;
	while (offset + 8 <= buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
		const end = offset + 12 + length;
		if (end > buffer.length) break;
		if (type === 'pHYs') {
			if (!inserted) parts.push(phys);
			inserted = true;
		} else {
			parts.push(buffer.subarray(offset, end));
			if (type === 'IHDR' && !inserted) {
				parts.push(phys);
				inserted = true;
			}
		}
		offset = end;
	}
	return Buffer.concat(parts);
}
function positiveNumber(value: number | undefined, fallback: number): number {
	return Number.isFinite(value) && value !== undefined && value > 0 ? value : fallback;
}
function renderScale(page: PdfiumPage, options: PdfRenderOptions, dpi: number): number {
	const { originalWidth, originalHeight } = page.getOriginalSize();
	const width = options.width ? options.width / originalWidth : undefined;
	const height = options.height ? options.height / originalHeight : undefined;
	if (width && height) return Math.min(width, height);
	return positiveNumber(width ?? height ?? options.scale, dpi / 72);
}
export async function renderPdfPages(filePath: string, options: PdfRenderOptions = {}): Promise<PdfRenderResult> {
	const absolute = path.resolve(filePath);
	const bytes = await readFile(absolute);
	const library = await loadPdfiumLibrary();
	const pdf = await library.loadDocument(new Uint8Array(bytes), options.password);
	try {
		const total = pdf.getPageCount();
		const selected = options.pages
			? parsePdfPageSelection(options.pages, total)
			: Array.from({ length: Math.min(options.pageLimit ?? 1, total) }, (_, i) => i + 1);
		const dpi = positiveNumber(options.dpi, DefaultPdfRenderDpi);
		const items: PdfRenderedPage[] = [];
		for (const number of selected) {
			const page = pdf.getPage(number - 1);
			const scale = renderScale(page, options, dpi);
			const image = await page.render({
				scale,
				render: encodeRgbaToPng,
				colorSpace: 'BGRA',
				transparent: options.transparent,
				renderFormFields: options.renderFormFields,
			});
			items.push({
				number,
				widthPt: image.originalWidth,
				heightPt: image.originalHeight,
				widthPx: image.width,
				heightPx: image.height,
				dpi,
				scale,
				mediaType: 'image/png',
				data: setPdfRenderPngDpi(image.data, dpi),
			});
		}
		return {
			kind: 'pdf.render',
			file: {
				path: absolute,
				name: path.basename(absolute),
				sizeBytes: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
			},
			document: { pages: total },
			pages: { selected, sampled: items.length, total, items },
		};
	} finally {
		pdf.destroy();
	}
}
