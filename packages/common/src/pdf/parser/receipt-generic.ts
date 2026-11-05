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

export interface GenericReceiptParseResult {
	documentType: 'receipt';
	receiptNumber?: string;
	date?: string;
	merchant?: string;
	paymentMethod?: string;
	subtotal?: number;
	taxAmount?: number;
	totalAmount?: number;
	currency?: string;
	items: Array<{ description?: string; quantity?: number; amount?: number }>;
	raw: { matchedLines: string[] };
}
function detectReasons(text: string): string[] {
	const checks: Array<[string, RegExp]> = [
		['receipt title', /\breceipt\b|收据|小票/iu],
		['receipt number', /\b(?:receipt|order|transaction)\s*(?:no\.?|number|#)?\s*[:#]|收据编号|交易号/iu],
		['date', /\bdate\s*:|日期[:：]/iu],
		['payment', /\b(?:paid|payment|card|cash)\b|支付|付款|现金|银行卡/iu],
		['total', /\btotal\s*[:$]|合计|总计|实付/iu],
	];
	return checks.flatMap(([reason, pattern]) => (pattern.test(text) ? [reason] : []));
}
function parseMoneyWithCurrency(value: string | undefined): { currency?: string; amount?: number } {
	if (!value) return {};
	const match = value.match(/([A-Z]{3}|[$€£¥￥])?\s*([0-9][0-9,.]*)/u);
	return { currency: match?.[1], amount: moneyNumber(match?.[2]) };
}
function parseItems(lines: string[]): GenericReceiptParseResult['items'] {
	return lines.flatMap((line) => {
		if (/receipt|order|transaction|date|subtotal|tax|total|paid|payment|收据|编号|日期|合计|总计|实付|税/i.test(line))
			return [];
		const match = line.match(/^(.+?)\s+(?:(\d+(?:\.\d+)?)\s+)?(?:[$€£¥￥])?([0-9][0-9,.]*)$/u);
		return match
			? [
					{
						description: match[1]?.trim(),
						quantity: match[2] ? Number(match[2]) : undefined,
						amount: moneyNumber(match[3]),
					},
				]
			: [];
	});
}
export const genericReceiptTemplate: PdfParseTemplate = {
	name: 'receipt.generic',
	aliases: ['receipt', 'generic-receipt'],
	title: 'Generic receipt',
	description: 'Simple heuristic parser for receipts and payment slips.',
	tags: ['receipt', 'payment', 'generic'],
	detect(context: PdfTemplateContext): PdfTemplateMatch {
		const reasons = detectReasons(context.text);
		return { name: this.name, title: this.title, confidence: Math.min(1, reasons.length / 5), reasons };
	},
	parse(context: PdfTemplateContext, match: PdfTemplateMatch): PdfTemplateResult {
		const text = context.text;
		const total = parseMoneyWithCurrency(
			firstMatch(text, /(?:\btotal|合计|总计|实付)\s*[:：]?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/iu),
		);
		const subtotal = parseMoneyWithCurrency(
			firstMatch(text, /(?:\bsubtotal|小计)\s*[:：]?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/iu),
		);
		const tax = parseMoneyWithCurrency(
			firstMatch(text, /(?:\btax|税额?)\s*[:：]?\s*([$€£¥￥A-Z]{0,3}\s*[0-9][0-9,.]*)/iu),
		);
		const data: GenericReceiptParseResult = {
			documentType: 'receipt',
			receiptNumber: firstMatch(
				text,
				/(?:\b(?:receipt|order|transaction)\s*(?:no\.?|number|#)?|收据编号|交易号)\s*[:#：]\s*([A-Z0-9-]+)/iu,
			),
			date: firstMatch(text, /(?:\bdate|日期)\s*[:：]\s*([^\n]+)/iu),
			merchant: firstMatch(text, /(?:\bmerchant|store|from|商户|门店)\s*[:：]\s*([^\n]+)/iu),
			paymentMethod: firstMatch(text, /(?:\bpayment\s*method|paid\s*by|支付方式|付款方式)\s*[:：]\s*([^\n]+)/iu),
			subtotal: subtotal.amount,
			taxAmount: tax.amount,
			totalAmount: total.amount,
			currency: total.currency ?? subtotal.currency ?? tax.currency,
			items: parseItems(context.lines),
			raw: {
				matchedLines: context.lines
					.filter((line) =>
						/receipt|order|transaction|date|merchant|store|payment|subtotal|tax|total|收据|交易|日期|商户|门店|支付|合计|总计|实付/u.test(
							line,
						),
					)
					.slice(0, 80),
			},
		};
		return {
			template: this.name,
			title: this.title,
			confidence: match.confidence,
			data,
			warnings: match.confidence < 0.6 ? ['Low confidence: receipt signals are incomplete.'] : [],
			markdown: [
				markdownPairs(
					'Receipt',
					compactRecord({
						receiptNumber: data.receiptNumber,
						date: data.date,
						merchant: data.merchant,
						paymentMethod: data.paymentMethod,
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
							'| Description | Quantity | Amount |',
							'| --- | ---: | ---: |',
							...data.items.map(
								(item) => `| ${item.description ?? ''} | ${item.quantity ?? ''} | ${item.amount ?? ''} |`,
							),
						].join('\n')
					: '',
			]
				.filter(Boolean)
				.join('\n\n'),
		};
	},
};
