export interface ExtractMainMarkdownOptions {
	title?: string;
	url?: string;
	minChars?: number;
}

const GenericHeadingTexts = new Set(['menu', 'navigation', 'support', 'search', 'footer', 'links']);
const BoilerplateExactTexts = new Set([
	'skip to main content',
	'skip to content',
	'skip navigation',
	'global nav open menu',
	'global nav close menu',
	'open menu',
	'close menu',
	'menu',
	'search',
	'search support',
	'shopping bag',
	'bag',
	'cancel',
	'sign in',
	'sign out',
	'apple',
	'store',
	'mac',
	'ipad',
	'iphone',
	'watch',
	'vision',
	'airpods',
	'tv & home',
	'entertainment',
	'accessories',
	'support',
	'apple support',
	'apple footer',
	'united states',
	'privacy policy',
	'terms of use',
	'sales and refunds',
	'legal',
	'site map',
	'helpful?',
	'contact apple support',
]);
const FooterPatterns = [
	/^related (information|topics|articles)$/iu,
	/^start a discussion/iu,
	/^contact .+ support$/iu,
	/^contact support$/iu,
	/^get support$/iu,
	/^helpful\??$/iu,
	/^thanks for your feedback/iu,
	/^copyright\s*©/iu,
	/^more ways to shop/iu,
	/^apple footer$/iu,
	/^published date:/iu,
];

function markdownText(line: string): string {
	return line
		.replace(/!\[[^\]]*\]\([^)]+\)/gu, ' ')
		.replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
		.replace(/`([^`]+)`/gu, '$1')
		.replace(/^[\s#>*_~`\-•]+/u, '')
		.replace(/[\s*_~`\-•]+$/u, '')
		.replace(/\s+/gu, ' ')
		.trim();
}

function comparableText(value: string): string {
	return markdownText(value)
		.normalize('NFKC')
		.replace(/&amp;/giu, '&')
		.replace(/[\u2018\u2019]/gu, "'")
		.replace(/[\u201c\u201d]/gu, '"')
		.replace(/\s+[|\-–—]\s+(apple support|openai help center|help center|support)$/iu, '')
		.replace(/\s+/gu, ' ')
		.trim()
		.toLowerCase();
}

function titleCandidates(title: string | undefined): string[] {
	if (!title?.trim()) return [];
	const base = comparableText(title);
	const candidates = new Set<string>();
	for (const item of [
		base,
		base.split(/\s+[|\-–—]\s+/u)[0] ?? '',
		base.replace(/\s+apple support$/iu, ''),
		base.replace(/\s+openai help center$/iu, ''),
	]) {
		const text = item.trim();
		if (text.length >= 8) candidates.add(text);
	}
	return [...candidates].sort((left, right) => right.length - left.length);
}

function isTitleLine(line: string, candidates: string[]): boolean {
	if (!candidates.length) return false;
	const text = comparableText(line);
	return Boolean(
		text &&
			candidates.some(
				(candidate) =>
					text === candidate ||
					(text.includes(candidate) && text.length <= candidate.length + 40) ||
					(candidate.includes(text) && text.length >= 12),
			),
	);
}

function isHeading(line: string): boolean {
	return /^\s{0,3}#{1,3}\s+\S/u.test(line);
}

function isBoilerplateLine(line: string): boolean {
	const text = comparableText(line);
	if (!text) return false;
	if (BoilerplateExactTexts.has(text)) return true;
	if (/^\[?(store|mac|ipad|iphone|watch|vision|airpods|tv & home|entertainment|accessories|support)\]?$/iu.test(text))
		return true;
	return (
		/^(copyright|tm and copyright|all rights reserved)\b/iu.test(text) ||
		/^(share|print|download|open in app|choose another country or region)$/iu.test(text) ||
		/^\d+\.\d+\.\d+$/u.test(text)
	);
}

function findMainStart(lines: string[], candidates: string[]): number {
	const scanLimit = Math.min(lines.length, 240);
	for (let index = 0; index < scanLimit; index++) if (isTitleLine(lines[index] ?? '', candidates)) return index;
	for (let index = 0; index < scanLimit; index++) {
		const line = lines[index] ?? '';
		if (isHeading(line) && !GenericHeadingTexts.has(comparableText(line)) && !isBoilerplateLine(line)) return index;
	}
	return 0;
}

function compactLines(lines: string[]): string[] {
	const out: string[] = [];
	const seenShort = new Set<string>();
	let blank = true;
	for (const line of lines) {
		const text = comparableText(line);
		if (isBoilerplateLine(line)) continue;
		if (FooterPatterns.some((pattern) => pattern.test(text)) && out.length) break;
		if (text && text.length <= 80 && seenShort.has(text) && !isHeading(line)) continue;
		if (text && text.length <= 80) seenShort.add(text);
		if (!line.trim()) {
			if (!blank) out.push('');
			blank = true;
			continue;
		}
		out.push(line.trimEnd());
		blank = false;
	}
	while (out.length && !out.at(-1)?.trim()) out.pop();
	return out;
}

export function extractMainMarkdown(content: string, options: ExtractMainMarkdownOptions = {}): string {
	const original = content.replace(/\r\n?/gu, '\n').trim();
	if (!original) return '';
	const lines = original.split('\n');
	const result = compactLines(lines.slice(findMainStart(lines, titleCandidates(options.title))))
		.join('\n')
		.trim();
	if (!result) return original;
	const minChars = options.minChars ?? 120;
	if (original.replace(/\s+/gu, '').length >= 800 && result.replace(/\s+/gu, '').length < minChars) return original;
	return result;
}
