import type { PdfReadResult } from '../read.js';

export interface PdfTemplateContext {
	read: PdfReadResult;
	text: string;
	lines: string[];
}
export interface PdfTemplateMatch {
	name: string;
	title: string;
	confidence: number;
	reasons: string[];
}
export interface PdfTemplateResult {
	template: string;
	title: string;
	confidence: number;
	data: unknown;
	warnings: string[];
	markdown: string;
}
export interface PdfParseTemplate {
	name: string;
	aliases?: string[];
	title: string;
	description: string;
	tags: string[];
	detect(context: PdfTemplateContext): PdfTemplateMatch;
	parse(context: PdfTemplateContext, match: PdfTemplateMatch): PdfTemplateResult;
}
export function linesFromText(text: string): string[] {
	return text
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
}
export function firstMatch(text: string, pattern: RegExp): string | undefined {
	return text.match(pattern)?.[1]?.trim();
}
export function moneyNumber(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const number = Number(value.replace(/[¥￥,\s]/g, '').replace(/^CNY/i, ''));
	return Number.isFinite(number) ? number : undefined;
}
export function compactRecord(value: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
	);
}
export function markdownPairs(title: string, data: Record<string, unknown>): string {
	const rows = Object.entries(data).flatMap(([key, value]) =>
		value === undefined || value === null || value === ''
			? []
			: [`- **${key}:** ${Array.isArray(value) ? value.join(', ') : String(value)}`],
	);
	return [`## ${title}`, ...(rows.length ? rows : ['- _(none)_'])].join('\n');
}
