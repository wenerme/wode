import type { FetchRequest } from './index';

export function decodeHtmlEntities(value: string): string {
	return value.replace(/&(nbsp|amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/giu, (match, entity: string) => {
		const named: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
		if (!entity.startsWith('#')) return named[entity.toLowerCase()] ?? match;
		const code = entity[1]?.toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1));
		return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
	});
}

export function extractHtmlTitle(html: string): string | undefined {
	const value = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html)?.[1];
	return value
		? decodeHtmlEntities(value.replace(/<[^>]+>/gu, ' '))
				.replace(/\s+/gu, ' ')
				.trim() || undefined
		: undefined;
}

function htmlContainerContents(html: string, tag: 'main' | 'article'): string | undefined {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	// Ignore comments and quoted attribute delimiters while matching same-kind nested tags.
	for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?(main|article)\b(?:[^>"']|"[^"]*"|'[^']*')*>/giu)) {
		if (match[1]?.toLowerCase() !== tag || /\/\s*>$/u.test(match[0])) continue;
		if (match[0].startsWith('</')) {
			if (depth > 0 && --depth === 0) parts.push(html.slice(start, match.index));
		} else if (depth++ === 0) {
			start = match.index + match[0].length;
		}
	}
	return parts.length ? parts.join('\n') : undefined;
}

export function htmlToReadableMarkdown(html: string, main = true): string {
	let source = html.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/giu, '\n');
	if (main) {
		source = htmlContainerContents(source, 'main') ?? htmlContainerContents(source, 'article') ?? source;
		source = source.replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/giu, '\n');
	}
	return decodeHtmlEntities(
		source
			.replace(/<head\b[^>]*>[\s\S]*?<\/head>/giu, '\n')
			.replace(
				/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu,
				(_match, level: string, content: string) => `\n${'#'.repeat(Number(level))} ${content}\n`,
			)
			.replace(/<li\b[^>]*>/giu, '\n- ')
			.replace(/<\/(p|div|section|article|header|footer|li|ul|ol|blockquote|pre|table|tr)>/giu, '\n')
			.replace(/<br\s*\/?\s*>/giu, '\n')
			.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu, '[$2]($1)')
			.replace(/<[^>]+>/gu, ' '),
	)
		.replace(/[ \t]+/gu, ' ')
		.replace(/\n[ \t]+/gu, '\n')
		.replace(/\n{3,}/gu, '\n\n')
		.trim();
}

/** Conservative Markdown extraction: keep fenced examples and fall back if too little remains. */
export function extractMainMarkdown(content: string, title?: string): string {
	const original = content.replace(/\r\n?/gu, '\n').trim();
	const lines = original.split('\n');
	let fence: { marker: string; length: number } | undefined;
	const outside = lines.map((line) => {
		const wasOutside = fence === undefined;
		const match = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
		if (!match) return wasOutside;
		const marker = match[1][0];
		if (fence) {
			if (marker === fence.marker && match[1].length >= fence.length && !match[2].trim()) fence = undefined;
		} else if (marker !== '`' || !match[2].includes('`')) {
			fence = { marker, length: match[1].length };
		}
		return wasOutside && fence === undefined;
	});
	// An unclosed input fence cannot be safely shortened while retaining its boundaries.
	if (fence) return original;
	const heading = lines.findIndex(
		(line, index) =>
			outside[index] && /^#{1,3}\s+\S/u.test(line) && !/^#{1,3}\s+(menu|navigation|footer|search)\s*$/iu.test(line),
	);
	let start = heading < 0 ? 0 : heading;
	if (title) {
		const match = lines.findIndex(
			(line, index) =>
				outside[index] &&
				line
					.replace(/^#+\s*/u, '')
					.trim()
					.toLowerCase() === title.toLowerCase(),
		);
		if (match >= 0) start = match;
	}
	const selected: string[] = [];
	for (let index = start; index < lines.length; index++) {
		const line = lines[index];
		if (
			outside[index] &&
			/^(?:#{1,6}\s+)?(?:copyright\s*©|all rights reserved|related (?:information|topics|articles)\s*$)/iu.test(
				line.trim(),
			)
		)
			break;
		selected.push(line);
	}
	const result = selected.join('\n').trim();
	return !result || (original.replace(/\s/gu, '').length >= 800 && result.replace(/\s/gu, '').length < 120)
		? original
		: result;
}

export function normalizeFetchContent(content: string, input: FetchRequest, title?: string): string {
	const normalized = input.main === false ? content : extractMainMarkdown(content, title);
	return input.maxCharacters === undefined ? normalized : normalized.slice(0, input.maxCharacters);
}

export function responseSecrets(headers: Record<string, string> = {}, apiKey?: string): string[] {
	return [
		apiKey ?? '',
		...Object.entries(headers)
			.filter(([key]) => /authorization|cookie|token|secret|(?:^|[-_])key(?:$|[-_])/iu.test(key))
			.flatMap(([, value]) => [value, value.replace(/^(?:Bearer|Basic)\s+/iu, '')]),
	].filter(Boolean);
}

/** Never return request authentication, including when a supplier echoes it in its response. */
export function sanitizeServiceResponse(value: unknown, secrets: readonly string[] = []): unknown {
	if (typeof value === 'string') {
		let result = value;
		for (const secret of secrets) if (secret) result = result.split(secret).join('[REDACTED]');
		return result;
	}
	if (Array.isArray(value)) return value.map((item) => sanitizeServiceResponse(item, secrets));
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value)
				.filter(
					([key]) =>
						!/^(?:authorization|proxy-authorization|cookie|set-cookie|headers|api[-_]?key|x-api-key|token|access_token|secret|password)$/iu.test(
							key,
						),
				)
				.map(([key, item]) => [key, sanitizeServiceResponse(item, secrets)]),
		);
	return value;
}
