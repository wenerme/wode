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

export interface BankStatementParseResult {
	documentType: 'bank_statement';
	accountName?: string;
	accountNumber?: string;
	statementPeriod?: string;
	openingBalance?: number;
	closingBalance?: number;
	currency?: string;
	transactions: Array<{ date?: string; description?: string; debit?: number; credit?: number; balance?: number }>;
	raw: { matchedLines: string[] };
}
function detectReasons(text: string): string[] {
	const checks: Array<[string, RegExp]> = [
		['statement title', /bank\s+statement|account\s+statement|交易流水|银行流水|对账单/iu],
		['account number', /account\s*(?:no\.?|number)|账号|账户/iu],
		['period', /statement\s+period|period\s*:|起止日期|期间/iu],
		[
			'transaction columns',
			/date\s+description\s+(?:debit|withdrawal).*?(?:credit|deposit)|交易日期.*?(?:收入|支出|借方|贷方)/iu,
		],
		['balance', /opening\s+balance|closing\s+balance|余额/iu],
	];
	return checks.flatMap(([reason, pattern]) => (pattern.test(text) ? [reason] : []));
}
function parseMoneyWithCurrency(value: string | undefined): { currency?: string; amount?: number } {
	if (!value) return {};
	const match = value.match(/([A-Z]{3}|[$€£¥￥])?\s*([-+]?[0-9][0-9,.]*)/u);
	return { currency: match?.[1], amount: moneyNumber(match?.[2]) };
}
function parseTransactions(lines: string[]): BankStatementParseResult['transactions'] {
	return lines.flatMap((line) => {
		const en = line.match(
			/^(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(.+?)\s+(-?[0-9][0-9,.]*)?\s+(-?[0-9][0-9,.]*)?\s+(-?[0-9][0-9,.]*)$/u,
		);
		if (en && !/opening|closing|balance|total/i.test(en[2] ?? ''))
			return [
				{
					date: en[1],
					description: en[2]?.trim(),
					debit: moneyNumber(en[3]),
					credit: moneyNumber(en[4]),
					balance: moneyNumber(en[5]),
				},
			];
		const zh = line.match(
			/^(\d{4}[-年/]\d{1,2}[-月/]\d{1,2}日?)\s+(.+?)\s+([-+]?[0-9][0-9,.]*)\s+([-+]?[0-9][0-9,.]*)$/u,
		);
		if (zh && !/余额|合计|小计/u.test(zh[2] ?? '')) {
			const amount = moneyNumber(zh[3]);
			return [
				{
					date: zh[1],
					description: zh[2]?.trim(),
					debit: amount && amount < 0 ? Math.abs(amount) : undefined,
					credit: amount && amount > 0 ? amount : undefined,
					balance: moneyNumber(zh[4]),
				},
			];
		}
		return [];
	});
}
export const bankStatementTemplate: PdfParseTemplate = {
	name: 'bank.statement.generic',
	aliases: ['bank-statement', 'statement', 'transactions'],
	title: 'Generic bank statement',
	description: 'Heuristic parser for text-based bank statements and transaction lists.',
	tags: ['bank', 'statement', 'transactions', 'generic'],
	detect(context: PdfTemplateContext): PdfTemplateMatch {
		const reasons = detectReasons(context.text);
		return { name: this.name, title: this.title, confidence: Math.min(1, reasons.length / 5), reasons };
	},
	parse(context: PdfTemplateContext, match: PdfTemplateMatch): PdfTemplateResult {
		const text = context.text;
		const opening = parseMoneyWithCurrency(
			firstMatch(text, /(?:opening\s+balance|期初余额)\s*[:：]?\s*([$€£¥￥A-Z]{0,3}\s*[-+]?[0-9][0-9,.]*)/iu),
		);
		const closing = parseMoneyWithCurrency(
			firstMatch(text, /(?:closing\s+balance|期末余额|余额)\s*[:：]?\s*([$€£¥￥A-Z]{0,3}\s*[-+]?[0-9][0-9,.]*)/iu),
		);
		const data: BankStatementParseResult = {
			documentType: 'bank_statement',
			accountName: firstMatch(text, /(?:account\s+name|户名|账户名称)\s*[:：]\s*([^\n]+)/iu),
			accountNumber: firstMatch(
				text,
				/(?:account\s*(?:no\.?|number)|账号|账户)\s*[:：]\s*([A-Z0-9* -]{4,})/iu,
			)?.replace(/\s+/g, ' '),
			statementPeriod: firstMatch(text, /(?:statement\s+period|period|起止日期|期间)\s*[:：]\s*([^\n]+)/iu),
			openingBalance: opening.amount,
			closingBalance: closing.amount,
			currency: opening.currency ?? closing.currency,
			transactions: parseTransactions(context.lines).slice(0, 500),
			raw: {
				matchedLines: context.lines
					.filter((line) =>
						/statement|account|period|balance|date|description|debit|credit|银行|流水|对账|账号|账户|余额|交易/u.test(
							line,
						),
					)
					.slice(0, 120),
			},
		};
		return {
			template: this.name,
			title: this.title,
			confidence: match.confidence,
			data,
			warnings: match.confidence < 0.6 ? ['Low confidence: bank statement signals are incomplete.'] : [],
			markdown: [
				markdownPairs(
					'Bank Statement',
					compactRecord({
						accountName: data.accountName,
						accountNumber: data.accountNumber,
						statementPeriod: data.statementPeriod,
						openingBalance: data.openingBalance,
						closingBalance: data.closingBalance,
						currency: data.currency,
					}),
				),
				data.transactions.length
					? [
							'',
							'## Transactions',
							'| Date | Description | Debit | Credit | Balance |',
							'| --- | --- | ---: | ---: | ---: |',
							...data.transactions.map(
								(item) =>
									`| ${item.date ?? ''} | ${item.description ?? ''} | ${item.debit ?? ''} | ${item.credit ?? ''} | ${item.balance ?? ''} |`,
							),
						].join('\n')
					: '',
			]
				.filter(Boolean)
				.join('\n\n'),
		};
	},
};
