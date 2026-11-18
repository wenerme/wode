import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPdfJs, pdfJsDocumentOptions } from './runtime.js';

export interface PdfInfoOptions {
	pageLimit?: number;
	allPages?: boolean;
	password?: string;
}
export interface PdfPageInfo {
	number: number;
	label?: string;
	widthPt: number;
	heightPt: number;
	widthIn: number;
	heightIn: number;
	orientation: 'portrait' | 'landscape' | 'square';
	rotation: number;
	userUnit?: number;
	annotationCount?: number;
}
export interface PdfInfoResult {
	file: { path: string; name: string; sizeBytes: number; size: string; sha256: string };
	document: {
		pages: number;
		pdfVersion?: string;
		fingerprints?: Array<string | null>;
		isLinearized?: boolean;
		isEncrypted?: boolean;
		isPureXfa?: boolean;
	};
	metadata: Record<string, unknown>;
	viewer: {
		pageLayout?: string;
		pageMode?: string;
		viewerPreferences?: unknown;
		openAction?: unknown;
		permissions?: number[] | null;
		markInfo?: unknown;
	};
	pages: { sampled: number; total: number; truncated: boolean; items: PdfPageInfo[] };
	outline: { count: number; items: Array<{ title: string; children: number }> };
	attachments: { count: number; names: string[] };
}

export function formatPdfDate(value: unknown): string | undefined {
	if (typeof value !== 'string' || !value) return undefined;
	const match = value.match(/^D:?(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
	if (!match) return value;
	const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function compactObject(value: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
	);
}
function metadataObject(metadata: unknown): Record<string, unknown> | undefined {
	if (!metadata || typeof metadata !== 'object') return undefined;
	const maybe = metadata as { getAll?: () => Record<string, unknown> };
	return typeof maybe.getAll === 'function' ? maybe.getAll() : (metadata as Record<string, unknown>);
}
function normalizeMetadata(info: Record<string, unknown>, metadata: unknown): Record<string, unknown> {
	return compactObject({
		title: info.Title,
		author: info.Author,
		subject: info.Subject,
		keywords: info.Keywords,
		creator: info.Creator,
		producer: info.Producer,
		creationDate: formatPdfDate(info.CreationDate) ?? info.CreationDate,
		modDate: formatPdfDate(info.ModDate) ?? info.ModDate,
		trapped: info.Trapped,
		language: info.Language,
		rawInfo: info,
		xmp: metadataObject(metadata),
	});
}
function humanBytes(bytes: number): string {
	const units = ['B', 'KiB', 'MiB', 'GiB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
function countOutline(items: Array<{ items?: unknown[] }> | null | undefined): number {
	return (items ?? []).reduce(
		(sum, item) => sum + 1 + countOutline(item.items as Array<{ items?: unknown[] }> | undefined),
		0,
	);
}

export async function readPdfInfo(filePath: string, options: PdfInfoOptions = {}): Promise<PdfInfoResult> {
	const absolute = path.resolve(filePath);
	const bytes = await readFile(absolute);
	const pdfjs = await loadPdfJs();
	const task = pdfjs.getDocument({
		...pdfJsDocumentOptions(),
		data: new Uint8Array(bytes),
		password: options.password,
		verbosity: pdfjs.VerbosityLevel.ERRORS,
	});
	try {
		const pdf = await task.promise;
		const [
			metadata,
			labels,
			pageLayout,
			pageMode,
			viewerPreferences,
			openAction,
			attachments,
			permissions,
			markInfo,
			outline,
		] = await Promise.all([
			pdf.getMetadata(),
			pdf.getPageLabels().catch(() => null),
			pdf.getPageLayout().catch(() => undefined),
			pdf.getPageMode().catch(() => undefined),
			pdf.getViewerPreferences().catch(() => undefined),
			pdf.getOpenAction().catch(() => undefined),
			pdf.getAttachments().catch(() => null),
			pdf.getPermissions().catch(() => null),
			pdf.getMarkInfo().catch(() => undefined),
			pdf.getOutline().catch(() => null),
		]);
		const limit = options.allPages ? pdf.numPages : Math.min(options.pageLimit ?? 20, pdf.numPages);
		const pages: PdfPageInfo[] = [];
		for (let number = 1; number <= limit; number++) {
			const page = await pdf.getPage(number);
			const widthPt = Math.abs((page.view[2] ?? 0) - (page.view[0] ?? 0));
			const heightPt = Math.abs((page.view[3] ?? 0) - (page.view[1] ?? 0));
			const annotations = await page.getAnnotations().catch(() => undefined);
			pages.push({
				number,
				label: labels?.[number - 1],
				widthPt,
				heightPt,
				widthIn: Number((widthPt / 72).toFixed(2)),
				heightIn: Number((heightPt / 72).toFixed(2)),
				orientation: Math.abs(widthPt - heightPt) < 0.01 ? 'square' : widthPt > heightPt ? 'landscape' : 'portrait',
				rotation: page.rotate ?? 0,
				userUnit: page.userUnit,
				annotationCount: annotations?.length,
			});
		}
		const info = (metadata.info ?? {}) as Record<string, unknown>;
		const names = Object.keys(attachments ?? {});
		return {
			file: {
				path: absolute,
				name: path.basename(absolute),
				sizeBytes: bytes.length,
				size: humanBytes(bytes.length),
				sha256: createHash('sha256').update(bytes).digest('hex'),
			},
			document: {
				pages: pdf.numPages,
				pdfVersion: typeof info.PDFFormatVersion === 'string' ? info.PDFFormatVersion : undefined,
				fingerprints: pdf.fingerprints,
				isLinearized: typeof info.IsLinearized === 'boolean' ? info.IsLinearized : undefined,
				isEncrypted: permissions !== null,
				isPureXfa: pdf.isPureXfa,
			},
			metadata: normalizeMetadata(info, metadata.metadata),
			viewer: compactObject({ pageLayout, pageMode, viewerPreferences, openAction, permissions, markInfo }),
			pages: { sampled: pages.length, total: pdf.numPages, truncated: pages.length < pdf.numPages, items: pages },
			outline: {
				count: countOutline(outline),
				items: (outline ?? [])
					.slice(0, 20)
					.map((item) => ({ title: item.title ?? '', children: item.items?.length ?? 0 })),
			},
			attachments: { count: names.length, names },
		};
	} finally {
		await task.destroy();
	}
}
