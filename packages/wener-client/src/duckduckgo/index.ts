import { type FetchLike, getGlobalThis } from '@wener/utils';

export const DefaultDuckDuckGoInstantAnswerBaseUrl = 'https://api.duckduckgo.com';
export const DefaultDuckDuckGoHtmlBaseUrl = 'https://html.duckduckgo.com/html/';
export const DefaultDuckDuckGoUserAgent = 'Mozilla/5.0 (compatible; wcli/0.1; +https://wener.me)';

export interface DuckDuckGoSearchRequest {
	query: string;
	count?: number;
	offset?: number;
	range?: '' | 'd' | 'w' | 'm' | 'y' | (string & {});
}

export interface DuckDuckGoSearchResult {
	title: string;
	url: string;
	snippet?: string;
	source?: 'instant-answer' | 'html';
	raw?: unknown;
}

export interface DuckDuckGoSearchResponse {
	query: string;
	results: DuckDuckGoSearchResult[];
	source: 'instant-answer' | 'html';
	raw?: unknown;
}

export interface DuckDuckGoClientOptions {
	fetch: FetchLike;
	instantAnswerBaseUrl: string;
	htmlBaseUrl: string;
	headers: Record<string, string>;
	userAgent: string;
	timeout?: number;
}

export interface DuckDuckGoClientInit extends Partial<DuckDuckGoClientOptions> {}

export class DuckDuckGoClientError extends Error {
	readonly status?: number;
	readonly statusText?: string;
	readonly data?: unknown;
	readonly response?: Response;

	constructor(
		message: string,
		options: { status?: number; statusText?: string; data?: unknown; response?: Response } = {},
	) {
		super(message);
		this.name = 'DuckDuckGoClientError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.data = options.data;
		this.response = options.response;
	}
}

interface DuckDuckGoInstantAnswerResponse {
	Abstract?: string;
	AbstractText?: string;
	AbstractURL?: string;
	Answer?: string;
	AnswerType?: string;
	Definition?: string;
	DefinitionURL?: string;
	Heading?: string;
	Results?: DuckDuckGoInstantAnswerTopic[];
	RelatedTopics?: Array<DuckDuckGoInstantAnswerTopic | { Name?: string; Topics?: DuckDuckGoInstantAnswerTopic[] }>;
	[key: string]: unknown;
}

interface DuckDuckGoInstantAnswerTopic {
	FirstURL?: string;
	Result?: string;
	Text?: string;
	Icon?: unknown;
	[key: string]: unknown;
}

function resolveUrl(baseUrl: string, path = ''): URL {
	return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
}

function mapDuckDuckGoDateFilter(range: string | undefined): string {
	switch (range) {
		case 'd':
			return 'd';
		case 'w':
			return 'w';
		case 'm':
			return 'm';
		case 'y':
			return 't';
		default:
			return '';
	}
}

function stripHtml(value: string): string {
	return value
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function decodeHtmlEntity(entity: string): string {
	const lower = entity.toLowerCase();
	const named: Record<string, string> = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: "'",
		nbsp: ' ',
	};
	if (lower in named) return named[lower] ?? entity;
	if (lower.startsWith('#x')) {
		const code = Number.parseInt(lower.slice(2), 16);
		return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
	}
	if (lower.startsWith('#')) {
		const code = Number.parseInt(lower.slice(1), 10);
		return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
	}
	return entity;
}

function decodeHtml(value: string): string {
	return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_all, entity: string) => decodeHtmlEntity(entity));
}

function cleanText(value: string | undefined): string {
	return decodeHtml(stripHtml(value ?? ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function topicToResult(topic: DuckDuckGoInstantAnswerTopic): DuckDuckGoSearchResult | undefined {
	const url = typeof topic.FirstURL === 'string' ? topic.FirstURL : undefined;
	const text = cleanText(topic.Text);
	const title =
		cleanText(typeof topic.Result === 'string' ? topic.Result : text)
			.split(' - ')[0]
			?.trim() || text.split(' - ')[0]?.trim();
	if (!url || !title) return undefined;
	return { title, url, snippet: text, source: 'instant-answer', raw: topic };
}

function collectInstantAnswerTopics(value: DuckDuckGoInstantAnswerResponse, results: DuckDuckGoSearchResult[]): void {
	for (const topic of value.Results ?? []) {
		const row = topicToResult(topic);
		if (row) results.push(row);
	}
	for (const item of value.RelatedTopics ?? []) {
		if ('Topics' in item && Array.isArray(item.Topics)) {
			for (const topic of item.Topics) {
				const row = topicToResult(topic);
				if (row) results.push(row);
			}
			continue;
		}
		const row = topicToResult(item as DuckDuckGoInstantAnswerTopic);
		if (row) results.push(row);
	}
}

function instantAnswerToResults(
	query: string,
	data: DuckDuckGoInstantAnswerResponse,
	count: number,
): DuckDuckGoSearchResult[] {
	const results: DuckDuckGoSearchResult[] = [];
	const abstractUrl = typeof data.AbstractURL === 'string' ? data.AbstractURL : undefined;
	const heading = cleanText(data.Heading);
	const abstract = cleanText(data.AbstractText || data.Abstract || data.Answer || data.Definition);
	if (abstractUrl && (heading || abstract)) {
		results.push({ title: heading || query, url: abstractUrl, snippet: abstract, source: 'instant-answer', raw: data });
	}
	const definitionUrl = typeof data.DefinitionURL === 'string' ? data.DefinitionURL : undefined;
	const definition = cleanText(data.Definition);
	if (definitionUrl && definition && !results.some((item) => item.url === definitionUrl)) {
		results.push({
			title: heading || query,
			url: definitionUrl,
			snippet: definition,
			source: 'instant-answer',
			raw: data,
		});
	}
	collectInstantAnswerTopics(data, results);
	const seen = new Set<string>();
	return results
		.filter((item) => {
			if (seen.has(item.url)) return false;
			seen.add(item.url);
			return true;
		})
		.slice(0, count);
}

function decodeDuckDuckGoRedirect(value: string): string {
	const decoded = decodeHtml(value);
	try {
		const url = new URL(decoded, 'https://duckduckgo.com');
		const target = url.searchParams.get('uddg');
		if (target) return target;
		return url.toString();
	} catch {
		const match = decoded.match(/[?&]uddg=([^&]+)/);
		return match ? decodeURIComponent(match[1] ?? '') : decoded;
	}
}

function uniqueResults(results: DuckDuckGoSearchResult[], count: number): DuckDuckGoSearchResult[] {
	const seen = new Set<string>();
	const out: DuckDuckGoSearchResult[] = [];
	for (const result of results) {
		const key = result.url.replace(/[#?].*$/, '').replace(/\/$/, '') || result.url;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(result);
		if (out.length >= count) break;
	}
	return out;
}

function extractHtmlResults(html: string, _query: string, count: number): DuckDuckGoSearchResult[] {
	if (/anomaly-modal|challenge-form|challenge-submit/i.test(html)) return [];
	const results: DuckDuckGoSearchResult[] = [];
	const blockPattern = /<div[^>]+class="[^"]*result[^"]*"[\s\S]*?(?=<div[^>]+class="[^"]*result[^"]*"|<\/body>|$)/gi;
	const blocks = html.match(blockPattern) ?? [];
	const titlePatterns = [
		/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
		/<a[^>]+class="[^"]*result-link[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
	];
	for (const block of blocks) {
		let href = '';
		let title = '';
		for (const pattern of titlePatterns) {
			const match = block.match(pattern);
			if (match) {
				href = match[1] ?? '';
				title = cleanText(match[2]);
				break;
			}
		}
		if (!href || !title) continue;
		const snippet = cleanText(
			block.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ??
				block.match(/<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1],
		);
		results.push({ title, url: decodeDuckDuckGoRedirect(href), snippet, source: 'html' });
	}
	if (results.length > 0) return uniqueResults(results, count);
	const linkPattern = /<a[^>]+class="[^"]*(?:result__a|result-link)[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
	let match: RegExpExecArray | null;
	while ((match = linkPattern.exec(html))) {
		const title = cleanText(match[2]);
		const href = match[1] ?? '';
		if (title && href) results.push({ title, url: decodeDuckDuckGoRedirect(href), source: 'html' });
	}
	return uniqueResults(results, count);
}

async function parseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return undefined;
	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('json') || contentType.includes('javascript')) {
		try {
			return JSON.parse(text) as unknown;
		} catch {
			return text;
		}
	}
	return text;
}

function combineSignals(left: AbortSignal | undefined, right: AbortSignal | undefined): AbortSignal | undefined {
	if (!left) return right;
	if (!right) return left;
	const controller = new AbortController();
	const abort = () => controller.abort();
	left.addEventListener('abort', abort, { once: true });
	right.addEventListener('abort', abort, { once: true });
	return controller.signal;
}

export class DuckDuckGoClient {
	readonly options: DuckDuckGoClientOptions;

	constructor({
		fetch = getGlobalThis().fetch,
		instantAnswerBaseUrl = DefaultDuckDuckGoInstantAnswerBaseUrl,
		htmlBaseUrl = DefaultDuckDuckGoHtmlBaseUrl,
		headers = {},
		userAgent = DefaultDuckDuckGoUserAgent,
		timeout,
	}: DuckDuckGoClientInit = {}) {
		this.options = { fetch, instantAnswerBaseUrl, htmlBaseUrl, headers, userAgent, timeout };
	}

	async search(query: string, options?: Omit<DuckDuckGoSearchRequest, 'query'>): Promise<DuckDuckGoSearchResponse>;
	async search(request: DuckDuckGoSearchRequest): Promise<DuckDuckGoSearchResponse>;
	async search(
		input: string | DuckDuckGoSearchRequest,
		options: Omit<DuckDuckGoSearchRequest, 'query'> = {},
	): Promise<DuckDuckGoSearchResponse> {
		const request = typeof input === 'string' ? { ...options, query: input } : input;
		const count = request.count && request.count > 0 ? request.count : 10;
		const offset = request.offset && request.offset > 0 ? request.offset : 0;
		if (offset > 0) return this.htmlSearch(request.query, count, request.range, offset);
		const instant = await this.instantAnswer(request.query, count);
		if (instant.results.length > 0) return instant;
		return this.htmlSearch(request.query, count, request.range);
	}

	async instantAnswer(query: string, count = 10): Promise<DuckDuckGoSearchResponse> {
		const url = resolveUrl(this.options.instantAnswerBaseUrl);
		url.searchParams.set('q', query);
		url.searchParams.set('format', 'json');
		url.searchParams.set('no_html', '1');
		url.searchParams.set('skip_disambig', '1');
		const data = await this.request<unknown>(url.toString());
		if (!isRecord(data)) return { query, results: [], source: 'instant-answer', raw: data };
		return {
			query,
			results: instantAnswerToResults(query, data as DuckDuckGoInstantAnswerResponse, count),
			source: 'instant-answer',
			raw: data,
		};
	}

	async htmlSearch(query: string, count = 10, range?: string, offset = 0): Promise<DuckDuckGoSearchResponse> {
		const url = resolveUrl(this.options.htmlBaseUrl);
		url.searchParams.set('q', query);
		const dateFilter = mapDuckDuckGoDateFilter(range);
		if (dateFilter) url.searchParams.set('df', dateFilter);
		if (offset > 0) url.searchParams.set('s', String(offset));
		const data = await this.request<unknown>(url.toString());
		const html = typeof data === 'string' ? data : '';
		return { query, results: extractHtmlResults(html, query, count), source: 'html', raw: html };
	}

	async request<T>(url: string, init: RequestInit = {}): Promise<T> {
		const timeoutMs = this.options.timeout;
		const timeoutController = timeoutMs ? new AbortController() : undefined;
		const timer = timeoutMs ? setTimeout(() => timeoutController?.abort(), timeoutMs) : undefined;
		const headers = new Headers({
			...this.options.headers,
			...(init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
		});
		if (!headers.has('user-agent')) headers.set('user-agent', this.options.userAgent);
		try {
			const initSignal = init.signal ?? undefined;
			const response = await this.options.fetch(url, {
				...init,
				headers,
				signal: combineSignals(initSignal, timeoutController?.signal),
			});
			const data = await parseBody(response);
			if (!response.ok) {
				throw new DuckDuckGoClientError(`DuckDuckGo request failed: ${response.status} ${response.statusText}`, {
					status: response.status,
					statusText: response.statusText,
					data,
					response,
				});
			}
			return data as T;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}
}
