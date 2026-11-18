import {
	compactRecord,
	firstMatch,
	markdownPairs,
	moneyNumber,
	type PdfParseTemplate,
	type PdfTemplateContext,
	type PdfTemplateMatch,
	type PdfTemplateResult,
} from './types.js';

export interface GenericInvoiceParseResult {
	documentType: 'invoice';
	invoiceNumber?: string;
	invoiceDate?: string;
	issuer?: string;
	buyer?: string;
	subtotal?: number;
	taxAmount?: number;
	totalAmount?: number;
	currency?: string;
	items: Array<{ description?: string; quantity?: number; unitPrice?: number; amount?: number }>;
	raw: { matchedLines: string[] };
}
function detectReasons(text: string): string[] {
	const checks: Array<[string, RegExp]> = [
		['invoice title', /\binvoice\b/i],
		['invoice number', /\binvoice\s*(?:no\.?|number|#)?\s*[:#]/i],
		['date', /\bdate\s*:/i],
		['total', /\btotal\s*[:$]/i],
		['bill to', /\bbill\s+to\b|\bbuyer\b/i],
	];
	return checks.flatMap(([reason, pattern]) => (pattern.test(text) ? [reason] : []));
}
function parseMoneyWithCurrency(value: string | undefined): { currency?: string; amount?: number } {
	if (!value) return {};
	const match = value.match(/([A-Z]{3}|[$€£¥￥])?\s*([0-9][0-9,.]*)/u);
	return { currency: match?.[1], amount: moneyNumber(match?.[2]) };
}
function parseItems(lines: string[]): GenericInvoiceParseResult['items'] {
	return lines.flatMap((line) => {
		const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([0-9][0-9,.]*)\s+([0-9][0-9,.]*)$/u);
		if (!match || /invoice|subtotal|tax|total|date|bill to/i.test(match[1] ?? '')) return [];
		return [
			{
				description: match[1]?.trim(),
				quantity: Number(match[2]),
				unitPrice: moneyNumber(match[3]),
				amount: moneyNumber(match[4]),
			},
		];
	});
}
export const genericInvoiceTemplate: PdfParseTemplate = {
	name: 'invoice.generic',
	aliases: ['invoice', 'generic-invoice'],
	title: 'Generic invoice',
	description: 'Simple heuristic parser for text-based English invoices.',
	tags: ['invoice', 'generic', 'en'],
	detect(context: PdfTemplateContext): PdfTemplateMatch {
		const reasons = detectReasons(context.text);
		return { name: this.name, title: this.title, confidence: Math.min(1, reasons.length / 5), reasons };
	},
	parse(context: PdfTemplateContext, match: PdfTemplateMatch): PdfTemplateResult {
		const text = context.text;
		const total = parseMoneyWithCurrency(firstMatch(text, /\btotal\s*:?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/i));
		const subtotal = parseMoneyWithCurrency(firstMatch(text, /\bsubtotal\s*:?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/i));
		const tax = parseMoneyWithCurrency(firstMatch(text, /\btax\s*:?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/i));
		const data: GenericInvoiceParseResult = {
			documentType: 'invoice',
			invoiceNumber: firstMatch(text, /\binvoice\s*(?:no\.?|number|#)?\s*[:#]\s*([A-Z0-9-]+)/i),
			invoiceDate: firstMatch(text, /\bdate\s*:\s*([^\n]+)/i),
			issuer: firstMatch(text, /\bfrom\s*:\s*([^\n]+)/i),
			buyer: firstMatch(text, /\bbill\s+to\s*:\s*([^\n]+)/i),
			subtotal: subtotal.amount,
			taxAmount: tax.amount,
			totalAmount: total.amount,
			currency: total.currency ?? subtotal.currency ?? tax.currency,
			items: parseItems(context.lines),
			raw: {
				matchedLines: context.lines
					.filter((line) => /invoice|date|from|bill to|subtotal|tax|total/i.test(line))
					.slice(0, 80),
			},
		};
		return {
			template: this.name,
			title: this.title,
			confidence: match.confidence,
			data,
			warnings: match.confidence < 0.6 ? ['Low confidence: invoice signals are incomplete.'] : [],
			markdown: [
				markdownPairs(
					'Invoice',
					compactRecord({
						invoiceNumber: data.invoiceNumber,
						invoiceDate: data.invoiceDate,
						issuer: data.issuer,
						buyer: data.buyer,
						subtotal: data.subtotal,
						taxAmount: data.taxAmount,
						totalAmount: data.totalAmount,
						currency: data.currency,
					}),
				),
				data.items.length
					? [
							'',
							'## Items',
							'| Description | Quantity | Unit Price | Amount |',
							'| --- | ---: | ---: | ---: |',
							...data.items.map(
								(item) =>
									`| ${item.description ?? ''} | ${item.quantity ?? ''} | ${item.unitPrice ?? ''} | ${item.amount ?? ''} |`,
							),
						].join('\n')
					: '',
			]
				.filter(Boolean)
				.join('\n\n'),
		};
	},
};
