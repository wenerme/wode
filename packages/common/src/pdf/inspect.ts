import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { formatPdfDate } from './info.js';
import { loadPdfJs, pdfJsDocumentOptions } from './runtime.js';

export const PdfInspectDetailValues = ['brief', 'normal', 'full', 'debug'] as const;
export type PdfInspectDetail = (typeof PdfInspectDetailValues)[number];
export interface PdfInspectOptions {
	detail?: PdfInspectDetail;
	pageLimit?: number;
	allPages?: boolean;
	pages?: string;
	password?: string;
	strict?: boolean;
	verbosity?: 'errors' | 'warnings' | 'infos';
	includePages?: boolean;
	includeMetadata?: boolean;
	includeViewer?: boolean;
	includeOutline?: boolean;
	includeAttachments?: boolean;
	includeAnnotations?: boolean;
	includeText?: boolean;
	includeOperators?: boolean;
	includeStructTree?: boolean;
	includeJs?: boolean;
	includeForms?: boolean;
	includeDestinations?: boolean;
	includeOptionalContent?: boolean;
	raw?: boolean;
	timings?: boolean;
	textLimit?: number;
	annotationLimit?: number;
	outlineLimit?: number;
	outlineDepth?: number;
	maxArray?: number;
	maxDepth?: number;
}
export interface PdfInspectResult {
	kind: 'pdf.inspect';
	file: { path: string; name: string; sizeBytes: number; size: string; sha256: string };
	options: Record<string, unknown>;
	document: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	viewer?: Record<string, unknown>;
	catalog?: Record<string, unknown>;
	pages?: { selected: number[]; sampled: number; total: number; truncated: boolean; items: Record<string, unknown>[] };
	outline?: { count: number; sampled: number; truncated: boolean; items: Record<string, unknown>[] };
	attachments?: { count: number; items: Record<string, unknown>[] };
	timings?: Record<string, number>;
	errors: Array<{ section: string; page?: number; name?: string; message: string }>;
}
type PdfJsModule = {
	getDocument: (params: { data: Uint8Array; password?: string; verbosity?: number; stopAtErrors?: boolean }) => {
		promise: Promise<PdfDocument>;
		destroy(): Promise<void>;
	};
	VerbosityLevel?: { ERRORS?: number; WARNINGS?: number; INFOS?: number };
	OPS?: Record<string, number>;
	version?: string;
};
type PdfDocument = {
	numPages: number;
	fingerprints?: Array<string | null>;
	isPureXfa?: boolean;
	allXfaHtml?: unknown;
	loadingParams?: unknown;
	getMetadata(): Promise<{ info?: object; metadata?: unknown }>;
	getPage(num: number): Promise<PdfPage>;
	getPageLabels(): Promise<string[] | null>;
	getPageLayout(): Promise<string | undefined>;
	getPageMode(): Promise<string | undefined>;
	getViewerPreferences(): Promise<unknown>;
	getOpenAction(): Promise<unknown>;
	getAttachments(): Promise<Record<string, unknown> | null>;
	getPermissions(): Promise<number[] | null>;
	getMarkInfo(): Promise<unknown>;
	getOutline(): Promise<PdfOutlineItem[] | null>;
	getDownloadInfo?(): Promise<{ length: number }>;
	getJSActions?(): Promise<unknown>;
	hasJSActions?(): Promise<boolean>;
	getFieldObjects?(): Promise<Record<string, unknown> | null>;
	getCalculationOrderIds?(): Promise<string[] | null>;
	getDestinations?(): Promise<Record<string, unknown>>;
	getOptionalContentConfig?(params?: { intent?: string }): Promise<unknown>;
};
type PdfPage = {
	view: number[];
	rotate?: number;
	userUnit?: number;
	ref?: unknown;
	getAnnotations(params?: { intent?: string }): Promise<unknown[]>;
	getTextContent(params?: {
		includeMarkedContent?: boolean;
		disableNormalization?: boolean;
	}): Promise<{ items: unknown[]; styles?: Record<string, unknown>; lang?: string | null }>;
	getOperatorList(): Promise<{ fnArray?: unknown[]; argsArray?: unknown[] }>;
	getStructTree(): Promise<unknown>;
	getJSActions?(): Promise<unknown>;
};
type PdfOutlineItem = {
	title?: string;
	bold?: boolean;
	italic?: boolean;
	dest?: unknown;
	url?: string | null;
	unsafeUrl?: string;
	count?: number;
	items?: PdfOutlineItem[];
};
type InspectResolvedOptions = Required<Omit<PdfInspectOptions, 'password' | 'pages' | 'verbosity'>> &
	Pick<PdfInspectOptions, 'password' | 'pages' | 'verbosity'> & { detail: PdfInspectDetail };

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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
function compact(value: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
	);
}
function metadataObject(metadata: unknown): Record<string, unknown> | undefined {
	if (!metadata || typeof metadata !== 'object') return undefined;
	const maybe = metadata as { getAll?: () => Record<string, unknown> };
	return typeof maybe.getAll === 'function' ? maybe.getAll() : isRecord(metadata) ? metadata : undefined;
}
function preview(
	value: unknown,
	opts: { maxDepth: number; maxArray: number; maxString: number },
	depth = 0,
	seen = new WeakSet<object>(),
): unknown {
	if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'string')
		return value.length > opts.maxString ? `${value.slice(0, opts.maxString)}…(${value.length} chars)` : value;
	if (typeof value === 'function' || typeof value === 'symbol') return `[${typeof value}]`;
	if (value instanceof Uint8Array)
		return {
			type: 'Uint8Array',
			length: value.length,
			sampleHex: Buffer.from(value.slice(0, Math.min(16, value.length))).toString('hex'),
		};
	if (ArrayBuffer.isView(value)) return { type: value.constructor.name, length: value.byteLength };
	if (value instanceof Date) return value.toISOString();
	if (typeof value !== 'object') return String(value);
	if (seen.has(value)) return '[Circular]';
	seen.add(value);
	if (depth >= opts.maxDepth) return `[${value.constructor?.name ?? 'Object'}]`;
	if (Array.isArray(value)) {
		const items = value.slice(0, opts.maxArray).map((item) => preview(item, opts, depth + 1, seen));
		if (value.length > opts.maxArray) items.push(`… ${value.length - opts.maxArray} more`);
		return items;
	}
	const entries = Object.entries(value).slice(0, opts.maxArray);
	const out: Record<string, unknown> = {};
	for (const [key, item] of entries)
		Object.defineProperty(out, key, {
			value: preview(item, opts, depth + 1, seen),
			enumerable: true,
			configurable: true,
			writable: true,
		});
	const total = Object.keys(value).length;
	if (total > opts.maxArray) out.__truncated = `${total - opts.maxArray} more keys`;
	return out;
}
function detailDefaults(
	detail: PdfInspectDetail,
): Omit<InspectResolvedOptions, 'detail' | 'password' | 'pages' | 'verbosity'> {
	return {
		pageLimit: detail === 'brief' ? 3 : detail === 'normal' ? 20 : 50,
		allPages: false,
		strict: false,
		includePages: true,
		includeMetadata: true,
		includeViewer: detail !== 'brief',
		includeOutline: detail !== 'brief',
		includeAttachments: detail !== 'brief',
		includeAnnotations: detail === 'debug',
		includeText: false,
		includeOperators: detail === 'debug',
		includeStructTree: detail === 'debug',
		includeJs: detail === 'full' || detail === 'debug',
		includeForms: detail === 'full' || detail === 'debug',
		includeDestinations: detail === 'debug',
		includeOptionalContent: detail === 'debug',
		raw: detail === 'debug',
		timings: detail === 'full' || detail === 'debug',
		textLimit: detail === 'brief' ? 240 : 1000,
		annotationLimit: detail === 'debug' ? 50 : 10,
		outlineLimit: detail === 'debug' ? 200 : 50,
		outlineDepth: detail === 'brief' ? 1 : detail === 'normal' ? 2 : 8,
		maxArray: detail === 'debug' ? 80 : 20,
		maxDepth: detail === 'debug' ? 6 : 4,
	};
}
function resolveOptions(options: PdfInspectOptions): InspectResolvedOptions {
	const detail = options.detail ?? 'normal';
	return {
		...detailDefaults(detail),
		...Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)),
		detail,
	} as InspectResolvedOptions;
}
function positivePageToken(token: string, total: number): number | undefined {
	if (token === 'first') return 1;
	if (token === 'last') return total;
	const number = Number(token);
	return Number.isInteger(number) && number >= 1 && number <= total ? number : undefined;
}
export function parsePdfPageSelection(input: string, total: number): number[] {
	const selected: number[] = [];
	const add = (page: number) => {
		if (!selected.includes(page)) selected.push(page);
	};
	for (const raw of input
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)) {
		const token = raw.toLowerCase();
		if (token === 'all') {
			for (let page = 1; page <= total; page++) add(page);
			continue;
		}
		if (token === 'odd' || token === 'even') {
			for (let page = token === 'odd' ? 1 : 2; page <= total; page += 2) add(page);
			continue;
		}
		const range = token.match(/^(first|last|\d*)-(first|last|\d*)$/);
		if (range) {
			const start = range[1] ? positivePageToken(range[1], total) : 1;
			const end = range[2] ? positivePageToken(range[2], total) : total;
			if (!start || !end) throw new Error(`invalid page range: ${raw}`);
			const step = start <= end ? 1 : -1;
			for (let page = start; step > 0 ? page <= end : page >= end; page += step) add(page);
			continue;
		}
		const page = positivePageToken(token, total);
		if (!page) throw new Error(`invalid page selector: ${raw}`);
		add(page);
	}
	if (!selected.length) throw new Error('no PDF pages selected');
	return selected;
}
function defaultPages(options: InspectResolvedOptions, total: number): number[] {
	if (!options.includePages) return [];
	if (options.pages) return parsePdfPageSelection(options.pages, total);
	return Array.from({ length: options.allPages ? total : Math.min(options.pageLimit, total) }, (_, i) => i + 1);
}
function pageSize(view: number[]) {
	const widthPt = Math.abs((view[2] ?? 0) - (view[0] ?? 0));
	const heightPt = Math.abs((view[3] ?? 0) - (view[1] ?? 0));
	return {
		widthPt,
		heightPt,
		widthIn: Number((widthPt / 72).toFixed(2)),
		heightIn: Number((heightPt / 72).toFixed(2)),
		orientation: Math.abs(widthPt - heightPt) < 0.01 ? 'square' : widthPt > heightPt ? 'landscape' : 'portrait',
	};
}
function normalizeMetadata(info: Record<string, unknown>, metadata: unknown, raw: boolean) {
	return compact({
		title: info.Title,
		author: info.Author,
		subject: info.Subject,
		keywords: info.Keywords,
		creator: info.Creator,
		producer: info.Producer,
		creationDate: formatPdfDate(info.CreationDate) ?? info.CreationDate,
		modDate: formatPdfDate(info.ModDate) ?? info.ModDate,
		language: info.Language,
		trapped: info.Trapped,
		rawInfo: raw ? info : undefined,
		xmp: raw ? metadataObject(metadata) : undefined,
	});
}
async function collect<T>(
	errors: PdfInspectResult['errors'],
	section: string,
	strict: boolean,
	fn: () => Promise<T>,
	page?: number,
): Promise<T | undefined> {
	try {
		return await fn();
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		errors.push({ section, page, name: err.name, message: err.message });
		if (strict) throw err;
		return undefined;
	}
}
function countOutline(items: PdfOutlineItem[] | null | undefined): number {
	return (items ?? []).reduce((sum, item) => sum + 1 + countOutline(item.items), 0);
}
function flattenOutline(
	items: PdfOutlineItem[] | null | undefined,
	opts: InspectResolvedOptions,
	depth = 1,
	out: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
	for (const item of items ?? []) {
		if (out.length >= opts.outlineLimit || depth > opts.outlineDepth) break;
		out.push(
			compact({
				level: depth,
				title: item.title ?? '',
				bold: item.bold,
				italic: item.italic,
				count: item.count,
				dest: opts.raw
					? preview(item.dest, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: undefined,
				url: item.url,
				unsafeUrl: item.unsafeUrl,
				children: item.items?.length ?? 0,
			}),
		);
		flattenOutline(item.items, opts, depth + 1, out);
	}
	return out;
}
function summarizeAttachment(name: string, value: unknown, opts: InspectResolvedOptions) {
	const rec = isRecord(value) ? value : {};
	return compact({
		name,
		filename: rec.filename,
		contentType: rec.contentType,
		sizeBytes: rec.content instanceof Uint8Array ? rec.content.length : undefined,
		raw: opts.raw ? preview(value, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 }) : undefined,
	});
}
function summarizeAnnotation(value: unknown, opts: InspectResolvedOptions) {
	const rec = isRecord(value) ? value : {};
	return compact({
		id: rec.id,
		subtype: rec.subtype,
		annotationType: rec.annotationType,
		fieldName: rec.fieldName,
		rect: rec.rect,
		url: rec.url,
		unsafeUrl: rec.unsafeUrl,
		title: rec.titleObj,
		contents: rec.contentsObj,
		raw: opts.raw ? preview(value, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 }) : undefined,
	});
}
function summarizeText(
	content: { items: unknown[]; styles?: Record<string, unknown>; lang?: string | null },
	opts: InspectResolvedOptions,
) {
	const strings = content.items.flatMap((item) => (isRecord(item) && typeof item.str === 'string' ? [item.str] : []));
	const text = strings.join(' ').replace(/\s+/g, ' ').trim();
	return compact({
		items: strings.length,
		chars: text.length,
		sample: text.slice(0, opts.textLimit),
		truncated: text.length > opts.textLimit,
		styles: content.styles ? Object.keys(content.styles).length : undefined,
		lang: content.lang,
	});
}
function operatorStats(list: { fnArray?: unknown[]; argsArray?: unknown[] }, pdfjs: PdfJsModule) {
	const names = new Map(Object.entries(pdfjs.OPS ?? {}).map(([name, value]) => [value, name]));
	const counts = new Map<string, number>();
	for (const fn of list.fnArray ?? []) {
		const key = typeof fn === 'number' ? (names.get(fn) ?? String(fn)) : String(fn);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return {
		fnCount: list.fnArray?.length ?? 0,
		argsCount: list.argsArray?.length ?? 0,
		unique: counts.size,
		top: [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 12)
			.map(([op, count]) => ({ op, count })),
	};
}
function verbosity(pdfjs: PdfJsModule, level: PdfInspectOptions['verbosity']) {
	return level === 'infos'
		? (pdfjs.VerbosityLevel?.INFOS ?? 5)
		: level === 'warnings'
			? (pdfjs.VerbosityLevel?.WARNINGS ?? 1)
			: (pdfjs.VerbosityLevel?.ERRORS ?? 0);
}
export async function inspectPdf(filePath: string, options: PdfInspectOptions = {}): Promise<PdfInspectResult> {
	const started = performance.now();
	const opts = resolveOptions(options);
	const errors: PdfInspectResult['errors'] = [];
	const absolute = path.resolve(filePath);
	const bytes = await readFile(absolute);
	const pdfjs = (await loadPdfJs()) as unknown as PdfJsModule;
	const loadStarted = performance.now();
	const task = pdfjs.getDocument({
		...pdfJsDocumentOptions(),
		data: new Uint8Array(bytes),
		password: opts.password,
		verbosity: verbosity(pdfjs, opts.verbosity),
		stopAtErrors: opts.strict,
	});
	try {
		const pdf = await task.promise;
		const timings: Record<string, number> = { loadMs: Number((performance.now() - loadStarted).toFixed(1)) };
		const metaStarted = performance.now();
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
			downloadInfo,
		] = await Promise.all([
			collect(errors, 'metadata', opts.strict, () => pdf.getMetadata()),
			collect(errors, 'pageLabels', opts.strict, () => pdf.getPageLabels()),
			opts.includeViewer ? collect(errors, 'pageLayout', opts.strict, () => pdf.getPageLayout()) : undefined,
			opts.includeViewer ? collect(errors, 'pageMode', opts.strict, () => pdf.getPageMode()) : undefined,
			opts.includeViewer
				? collect(errors, 'viewerPreferences', opts.strict, () => pdf.getViewerPreferences())
				: undefined,
			opts.includeViewer ? collect(errors, 'openAction', opts.strict, () => pdf.getOpenAction()) : undefined,
			opts.includeAttachments ? collect(errors, 'attachments', opts.strict, () => pdf.getAttachments()) : undefined,
			collect(errors, 'permissions', opts.strict, () => pdf.getPermissions()),
			opts.includeViewer ? collect(errors, 'markInfo', opts.strict, () => pdf.getMarkInfo()) : undefined,
			opts.includeOutline ? collect(errors, 'outline', opts.strict, () => pdf.getOutline()) : undefined,
			collect(errors, 'downloadInfo', opts.strict, () => pdf.getDownloadInfo?.() ?? Promise.resolve(undefined)),
		]);
		timings.metadataMs = Number((performance.now() - metaStarted).toFixed(1));
		const info = metadata?.info && isRecord(metadata.info) ? metadata.info : {};
		const selectedPages = defaultPages(opts, pdf.numPages);
		const result: PdfInspectResult = {
			kind: 'pdf.inspect',
			file: {
				path: absolute,
				name: path.basename(absolute),
				sizeBytes: bytes.length,
				size: humanBytes(bytes.length),
				sha256: createHash('sha256').update(bytes).digest('hex'),
			},
			options: compact({
				detail: opts.detail,
				pages: opts.pages,
				pageLimit: opts.pageLimit,
				allPages: opts.allPages,
				raw: opts.raw,
				text: opts.includeText,
				annotations: opts.includeAnnotations,
				operators: opts.includeOperators,
				strict: opts.strict,
			}),
			document: compact({
				pages: pdf.numPages,
				pdfjsVersion: pdfjs.version,
				pdfVersion: info.PDFFormatVersion,
				fingerprints: pdf.fingerprints,
				isLinearized: info.IsLinearized,
				isEncrypted: permissions == null ? false : true,
				isPureXfa: pdf.isPureXfa,
				hasXfaHtml: Boolean(pdf.allXfaHtml),
				downloadLength: downloadInfo?.length,
				dataLengthMatchesFile: downloadInfo?.length === undefined ? undefined : downloadInfo.length === bytes.length,
				loadingParams: opts.raw
					? preview(pdf.loadingParams, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: undefined,
			}),
			errors,
		};
		if (opts.includeMetadata) result.metadata = normalizeMetadata(info, metadata?.metadata, opts.raw);
		if (opts.includeViewer)
			result.viewer = compact({
				pageLayout,
				pageMode,
				viewerPreferences: opts.raw
					? preview(viewerPreferences, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: viewerPreferences,
				openAction: opts.raw
					? preview(openAction, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: openAction,
				permissions,
				markInfo,
			});
		if (opts.includeJs || opts.includeForms || opts.includeDestinations || opts.includeOptionalContent) {
			const [jsActions, hasJSActions, fieldObjects, calculationOrderIds, destinations, optionalContent] =
				await Promise.all([
					opts.includeJs
						? collect(errors, 'jsActions', opts.strict, () => pdf.getJSActions?.() ?? Promise.resolve(undefined))
						: undefined,
					opts.includeJs
						? collect(errors, 'hasJSActions', opts.strict, () => pdf.hasJSActions?.() ?? Promise.resolve(undefined))
						: undefined,
					opts.includeForms
						? collect(errors, 'fieldObjects', opts.strict, () => pdf.getFieldObjects?.() ?? Promise.resolve(undefined))
						: undefined,
					opts.includeForms
						? collect(
								errors,
								'calculationOrderIds',
								opts.strict,
								() => pdf.getCalculationOrderIds?.() ?? Promise.resolve(undefined),
							)
						: undefined,
					opts.includeDestinations
						? collect(errors, 'destinations', opts.strict, () => pdf.getDestinations?.() ?? Promise.resolve(undefined))
						: undefined,
					opts.includeOptionalContent
						? collect(
								errors,
								'optionalContent',
								opts.strict,
								() => pdf.getOptionalContentConfig?.({ intent: 'any' }) ?? Promise.resolve(undefined),
							)
						: undefined,
				]);
			result.catalog = compact({
				hasJSActions,
				jsActions: jsActions
					? preview(jsActions, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: undefined,
				fields:
					fieldObjects && isRecord(fieldObjects)
						? {
								count: Object.keys(fieldObjects).length,
								names: Object.keys(fieldObjects).slice(0, opts.maxArray),
								raw: opts.raw
									? preview(fieldObjects, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
									: undefined,
							}
						: undefined,
				calculationOrderIds,
				destinations:
					destinations && isRecord(destinations)
						? {
								count: Object.keys(destinations).length,
								names: Object.keys(destinations).slice(0, opts.maxArray),
								raw: opts.raw
									? preview(destinations, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
									: undefined,
							}
						: undefined,
				optionalContent: optionalContent
					? preview(optionalContent, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
					: undefined,
			});
		}
		if (opts.includeOutline) {
			const items = flattenOutline(outline, opts);
			result.outline = {
				count: countOutline(outline),
				sampled: items.length,
				truncated: items.length < countOutline(outline),
				items,
			};
		}
		if (opts.includeAttachments)
			result.attachments = {
				count: Object.keys(attachments ?? {}).length,
				items: Object.entries(attachments ?? {}).map(([name, item]) => summarizeAttachment(name, item, opts)),
			};
		if (opts.includePages) {
			const pageStarted = performance.now();
			const pages: Record<string, unknown>[] = [];
			for (const pageNumber of selectedPages) {
				const page = await collect(errors, 'page', opts.strict, () => pdf.getPage(pageNumber), pageNumber);
				if (!page) continue;
				const [annotations, textContent, opList, structTree, pageJsActions] = await Promise.all([
					opts.includeAnnotations
						? collect(
								errors,
								'page.annotations',
								opts.strict,
								() => page.getAnnotations({ intent: 'display' }),
								pageNumber,
							)
						: undefined,
					opts.includeText
						? collect(
								errors,
								'page.text',
								opts.strict,
								() => page.getTextContent({ includeMarkedContent: true }),
								pageNumber,
							)
						: undefined,
					opts.includeOperators
						? collect(errors, 'page.operators', opts.strict, () => page.getOperatorList(), pageNumber)
						: undefined,
					opts.includeStructTree
						? collect(errors, 'page.structTree', opts.strict, () => page.getStructTree(), pageNumber)
						: undefined,
					opts.includeJs
						? collect(
								errors,
								'page.jsActions',
								opts.strict,
								() => page.getJSActions?.() ?? Promise.resolve(undefined),
								pageNumber,
							)
						: undefined,
				]);
				pages.push(
					compact({
						number: pageNumber,
						label: labels?.[pageNumber - 1],
						ref: opts.raw
							? preview(page.ref, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
							: undefined,
						view: page.view,
						...pageSize(page.view),
						rotation: page.rotate ?? 0,
						userUnit: page.userUnit,
						annotations: annotations
							? {
									count: annotations.length,
									items: annotations.slice(0, opts.annotationLimit).map((item) => summarizeAnnotation(item, opts)),
									truncated: annotations.length > opts.annotationLimit,
								}
							: undefined,
						text: textContent ? summarizeText(textContent, opts) : undefined,
						operators: opList ? operatorStats(opList, pdfjs) : undefined,
						structTree:
							structTree === undefined
								? undefined
								: {
										present: Boolean(structTree),
										raw:
											structTree && opts.raw
												? preview(structTree, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
												: undefined,
									},
						jsActions: pageJsActions
							? preview(pageJsActions, { maxDepth: opts.maxDepth, maxArray: opts.maxArray, maxString: 500 })
							: undefined,
					}),
				);
			}
			timings.pagesMs = Number((performance.now() - pageStarted).toFixed(1));
			result.pages = {
				selected: selectedPages,
				sampled: pages.length,
				total: pdf.numPages,
				truncated: selectedPages.length < pdf.numPages,
				items: pages,
			};
		}
		timings.totalMs = Number((performance.now() - started).toFixed(1));
		if (opts.timings) result.timings = timings;
		return result;
	} finally {
		await task.destroy();
	}
}
