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

export interface ChineseInvoiceParseResult {
	documentType: 'invoice';
	invoiceType?: string;
	invoiceNumber?: string;
	invoiceDate?: string;
	buyer?: { name?: string; taxId?: string };
	seller?: { name?: string; taxId?: string };
	amountWithoutTax?: number;
	taxAmount?: number;
	totalAmount?: number;
	totalAmountText?: string;
	issuer?: string;
	items: Array<{
		name?: string;
		specification?: string;
		unit?: string;
		quantity?: number;
		unitPrice?: number;
		amount?: number;
		taxRate?: string;
		taxAmount?: number;
	}>;
	raw: { matchedLines: string[] };
}
function hasInvoiceSignals(text: string): string[] {
	const checks: Array<[string, RegExp]> = [
		['invoice title', /发票/u],
		['invoice number', /发票号码/u],
		['invoice date', /开票日期/u],
		['buyer/seller', /购.*?方|买.*?方|销.*?方|售.*?方/u],
		['total with tax', /价税合计|合计\s*[¥￥]/u],
	];
	return checks.flatMap(([reason, pattern]) => (pattern.test(text) ? [reason] : []));
}
function normalizeInvoiceDate(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/u);
	return match ? `${match[1]}-${match[2]!.padStart(2, '0')}-${match[3]!.padStart(2, '0')}` : value.trim();
}
function allTaxIds(text: string): string[] {
	return Array.from(text.matchAll(/统一社会信用代码\/?纳税人识别号[:：]?\s*([0-9A-Z]{12,24})/gu)).flatMap((match) =>
		match[1] ? [match[1]] : [],
	);
}
function cleanPartyName(value: string | undefined): string | undefined {
	let text = value?.trim();
	if (!text) return undefined;
	for (const junk of [/^(买方|购方|销售方|销方)[:：]?/u, /(买售方方|购销方方|方方|信息息)$/u])
		text = text.replace(junk, '').trim();
	return text || undefined;
}
function parsePartyNames(text: string): { buyer?: string; seller?: string } {
	const pair = text
		.replace(/\s+/gu, '')
		.match(
			/[购购买]名称[:：]?(.+?)[销销售]名称[:：]?(.+?)(?:[买购销售信]统一社会信用代码|统一社会信用代码|项目名称|$)/u,
		);
	if (pair) return { buyer: cleanPartyName(pair[1]), seller: cleanPartyName(pair[2]) };
	return {
		buyer: cleanPartyName(firstMatch(text, /(?:购买方|买方|购)\s*名称[:：]?\s*([^\n]+)/u)),
		seller: cleanPartyName(firstMatch(text, /(?:销售方|卖方|销)\s*名称[:：]?\s*([^\n]+)/u)),
	};
}
function parseParty(text: string, type: 'buyer' | 'seller'): { name?: string; taxId?: string } {
	const names = parsePartyNames(text);
	return compactRecord({ name: names[type], taxId: allTaxIds(text)[type === 'buyer' ? 0 : 1] });
}
function parseItems(lines: string[]): ChineseInvoiceParseResult['items'] {
	return lines
		.filter((line) => /^\*/u.test(line) || /\s\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+%/u.test(line))
		.flatMap((line) => {
			const match = line.match(
				/^(.+?)\s+(?:(\S+)\s+)?(?:(\S+)\s+)?(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+%)\s+(\d+(?:\.\d+)?)/u,
			);
			return match
				? [
						{
							name: match[1]?.trim(),
							specification: match[2],
							unit: match[3],
							quantity: Number(match[4]),
							unitPrice: Number(match[5]),
							amount: Number(match[6]),
							taxRate: match[7],
							taxAmount: Number(match[8]),
						},
					]
				: [{ name: line }];
		});
}
export const chineseInvoiceTemplate: PdfParseTemplate = {
	name: 'invoice.zh.vat',
	aliases: ['fapiao', 'zh-invoice', 'vat-invoice'],
	title: 'Chinese VAT invoice / 发票',
	description: 'Heuristic parser for Chinese electronic VAT invoices extracted by pdfjs text content.',
	tags: ['invoice', 'zh', 'vat', 'fapiao'],
	detect(context: PdfTemplateContext): PdfTemplateMatch {
		const reasons = hasInvoiceSignals(context.text);
		return { name: this.name, title: this.title, confidence: Math.min(1, reasons.length / 5), reasons };
	},
	parse(context: PdfTemplateContext, match: PdfTemplateMatch): PdfTemplateResult {
		const text = context.text;
		const data: ChineseInvoiceParseResult = {
			documentType: 'invoice',
			invoiceType: firstMatch(text, /([^\n]*发票[^\n]*)/u)
				?.replace(/\s*发票号码[:：]?.*$/u, '')
				.trim(),
			invoiceNumber: firstMatch(text, /发票号码[:：]?\s*([0-9]{8,32})/u),
			invoiceDate: normalizeInvoiceDate(firstMatch(text, /开票日期[:：]?\s*(\d{4}年\d{1,2}月\d{1,2}日)/u)),
			buyer: parseParty(text, 'buyer'),
			seller: parseParty(text, 'seller'),
			amountWithoutTax: moneyNumber(firstMatch(text, /合计\s*[¥￥]([0-9,.]+)\s*[¥￥][0-9,.]+/u)),
			taxAmount: moneyNumber(firstMatch(text, /合计\s*[¥￥][0-9,.]+\s*[¥￥]([0-9,.]+)/u)),
			totalAmount: moneyNumber(firstMatch(text, /（小写）\s*[¥￥]?([0-9,.]+)/u)),
			totalAmountText: firstMatch(text, /价税合计（大写）\s*([^\n（]+?)(?:\s*（小写）|$)/u),
			issuer: firstMatch(text, /开票人[:：]?\s*([^\n]+)/u),
			items: parseItems(context.lines),
			raw: {
				matchedLines: context.lines.filter((line) => /发票|合计|开票|名称|识别号|税率|金额/u.test(line)).slice(0, 80),
			},
		};
		return {
			template: this.name,
			title: this.title,
			confidence: match.confidence,
			data,
			warnings:
				match.confidence < 0.6
					? ['Low confidence: invoice signals are incomplete; use --debug --output json to inspect extracted text.']
					: [],
			markdown: [
				markdownPairs(
					'Invoice',
					compactRecord({
						invoiceType: data.invoiceType,
						invoiceNumber: data.invoiceNumber,
						invoiceDate: data.invoiceDate,
						buyer: data.buyer?.name,
						buyerTaxId: data.buyer?.taxId,
						seller: data.seller?.name,
						sellerTaxId: data.seller?.taxId,
						amountWithoutTax: data.amountWithoutTax,
						taxAmount: data.taxAmount,
						totalAmount: data.totalAmount,
						totalAmountText: data.totalAmountText,
						issuer: data.issuer,
					}),
				),
				data.items.length
					? [
							'',
							'## Items',
							'| Name | Quantity | Unit Price | Amount | Tax Rate | Tax |',
							'| --- | ---: | ---: | ---: | --- | ---: |',
							...data.items.map(
								(item) =>
									`| ${item.name ?? ''} | ${item.quantity ?? ''} | ${item.unitPrice ?? ''} | ${item.amount ?? ''} | ${item.taxRate ?? ''} | ${item.taxAmount ?? ''} |`,
							),
						].join('\n')
					: '',
			]
				.filter(Boolean)
				.join('\n\n'),
		};
	},
};
