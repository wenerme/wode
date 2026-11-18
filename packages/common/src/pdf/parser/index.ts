import type { PdfReadOptions, PdfReadResult } from '../read.js';
import { bankStatementTemplate } from './bank-statement.js';
import { chineseInvoiceTemplate } from './invoice.js';
import { genericInvoiceTemplate } from './invoice-generic.js';
import { genericReceiptTemplate } from './receipt-generic.js';
import {
	linesFromText,
	type PdfParseTemplate,
	type PdfTemplateContext,
	type PdfTemplateMatch,
	type PdfTemplateResult,
} from './types.js';

export interface PdfParseOptions extends PdfReadOptions {
	template?: string;
	minConfidence?: number;
	debug?: boolean;
}
export interface PdfParseResult {
	kind: 'pdf.parse';
	file: { path: string; name: string; sizeBytes: number; sha256: string };
	document: { pages: number; pdfVersion?: string; pdfjsVersion?: string };
	selectedTemplate: PdfTemplateMatch;
	candidates: PdfTemplateMatch[];
	result: PdfTemplateResult;
	read?: { markdown: string; text: string; lines: string[] };
}
export { bankStatementTemplate } from './bank-statement.js';
export { chineseInvoiceTemplate } from './invoice.js';
export { genericInvoiceTemplate } from './invoice-generic.js';
export { genericReceiptTemplate } from './receipt-generic.js';
export type { PdfParseTemplate, PdfTemplateContext, PdfTemplateMatch, PdfTemplateResult } from './types.js';
export { linesFromText } from './types.js';

const registeredTemplates = [
	chineseInvoiceTemplate,
	genericInvoiceTemplate,
	genericReceiptTemplate,
	bankStatementTemplate,
] satisfies PdfParseTemplate[];
export function getPdfParseTemplates(): PdfParseTemplate[] {
	return [...registeredTemplates];
}
export function listPdfParseTemplates(): Array<{
	name: string;
	aliases: string[];
	title: string;
	description: string;
	tags: string[];
}> {
	return registeredTemplates.map((template) => ({
		name: template.name,
		aliases: template.aliases ?? [],
		title: template.title,
		description: template.description,
		tags: template.tags,
	}));
}
export function findPdfParseTemplate(name: string): PdfParseTemplate | undefined {
	return registeredTemplates.find((template) => template.name === name || template.aliases?.includes(name));
}
function resolveTemplateFromRanked(
	name: string,
	ranked: Array<{ template: PdfParseTemplate; match: PdfTemplateMatch }>,
) {
	return name === 'invoice'
		? ranked.find((item) => item.template.tags.includes('invoice'))?.template
		: findPdfParseTemplate(name);
}
export function createPdfTemplateContext(read: PdfReadResult): PdfTemplateContext {
	return { read, text: read.text, lines: linesFromText(read.text) };
}
export function rankPdfParseTemplates(
	context: PdfTemplateContext,
): Array<{ template: PdfParseTemplate; match: PdfTemplateMatch }> {
	return registeredTemplates
		.map((template) => ({ template, match: template.detect(context) }))
		.sort((a, b) => b.match.confidence - a.match.confidence || a.template.name.localeCompare(b.template.name));
}
export function parsePdfReadResultWithTemplate(
	read: PdfReadResult,
	options: Pick<PdfParseOptions, 'template' | 'minConfidence' | 'debug'> = {},
): PdfParseResult {
	const context = createPdfTemplateContext(read);
	const ranked = rankPdfParseTemplates(context);
	const template =
		options.template && options.template !== 'auto'
			? resolveTemplateFromRanked(options.template, ranked)
			: ranked[0]?.template;
	if (!template)
		throw new Error(
			options.template ? `unknown PDF parse template: ${options.template}` : 'no PDF parse templates registered',
		);
	const selected = ranked.find((item) => item.template === template)?.match ?? template.detect(context);
	const minConfidence = options.minConfidence ?? 0.25;
	if (selected.confidence < minConfidence)
		throw new Error(
			`PDF parse template confidence too low: ${template.name} ${selected.confidence.toFixed(2)} < ${minConfidence}`,
		);
	return {
		kind: 'pdf.parse',
		file: read.file,
		document: {
			pages: read.document.pages,
			pdfVersion: read.document.pdfVersion,
			pdfjsVersion: read.document.pdfjsVersion,
		},
		selectedTemplate: selected,
		candidates: ranked.map((item) => item.match),
		result: template.parse(context, selected),
		read: options.debug ? { markdown: read.markdown, text: read.text, lines: context.lines } : undefined,
	};
}
export async function parsePdfWithTemplate(file: string, options: PdfParseOptions = {}): Promise<PdfParseResult> {
	const { readPdfText } = await import('../read.js');
	return parsePdfReadResultWithTemplate(
		await readPdfText(file, { ...options, includeFrontmatter: false, includePageHeadings: false }),
		options,
	);
}
