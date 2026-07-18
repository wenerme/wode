import { type FetchLike, getGlobalThis } from '@wener/utils';

export const DefaultExaBaseUrl = 'https://api.exa.ai';

export const ExaSearchTypeValues = ['auto', 'fast', 'instant', 'deep-lite', 'deep', 'deep-reasoning'] as const;
export type ExaSearchType = (typeof ExaSearchTypeValues)[number];

export const ExaSearchCategoryValues = [
	'company',
	'people',
	'research paper',
	'news',
	'personal site',
	'financial report',
] as const;
export type ExaSearchCategory = (typeof ExaSearchCategoryValues)[number] | (string & {});

export interface ExaSearchTextOptions {
	maxCharacters?: number;
	includeHtmlTags?: boolean;
	verbosity?: 'compact' | 'standard' | 'full' | (string & {});
	includeSections?: string[];
	excludeSections?: string[];
}

export interface ExaSearchHighlightsOptions {
	query?: string;
	maxCharacters?: number;
}

export interface ExaSearchSummaryOptions {
	query?: string;
	schema?: Record<string, unknown>;
}

export interface ExaSearchContentExtrasOptions {
	links?: number;
	imageLinks?: number;
}

export interface ExaSearchContentsOptions {
	text?: boolean | ExaSearchTextOptions;
	highlights?: boolean | ExaSearchHighlightsOptions;
	summary?: boolean | ExaSearchSummaryOptions;
	livecrawlTimeout?: number;
	maxAgeHours?: number;
	subpages?: number;
	subpageTarget?: string | string[];
	extras?: ExaSearchContentExtrasOptions;
}

export interface ExaSearchRequest {
	query: string;
	type?: ExaSearchType | (string & {});
	stream?: false;
	numResults?: number;
	category?: ExaSearchCategory;
	userLocation?: string;
	includeDomains?: string[];
	excludeDomains?: string[];
	startCrawlDate?: string;
	endCrawlDate?: string;
	startPublishedDate?: string;
	endPublishedDate?: string;
	moderation?: boolean;
	additionalQueries?: string[];
	systemPrompt?: string;
	outputSchema?: Record<string, unknown>;
	compliance?: string;
	contents?: ExaSearchContentsOptions;
}

export interface ExaSearchResult {
	title?: string;
	url: string;
	id?: string;
	publishedDate?: string | null;
	author?: string | null;
	image?: string;
	favicon?: string;
	text?: string;
	highlights?: string[];
	highlightScores?: number[];
	summary?: string;
	subpages?: ExaSearchResult[];
	extras?: {
		links?: string[];
		imageLinks?: string[];
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface ExaSearchOutputGroundingCitation {
	url?: string;
	title?: string;
}

export interface ExaSearchOutputGrounding {
	field?: string;
	citations?: ExaSearchOutputGroundingCitation[];
	confidence?: 'low' | 'medium' | 'high' | (string & {});
}

export interface ExaSearchOutput {
	content?: string | Record<string, unknown> | unknown[];
	grounding?: ExaSearchOutputGrounding[];
	[key: string]: unknown;
}

export interface ExaSearchResponse {
	requestId?: string;
	searchType?: string;
	results: ExaSearchResult[];
	output?: ExaSearchOutput;
	costDollars?: {
		total?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface ExaContentsRequest {
	urls?: string[];
	ids?: string[];
	text?: boolean | ExaSearchTextOptions;
	highlights?: boolean | ExaSearchHighlightsOptions;
	summary?: boolean | ExaSearchSummaryOptions;
	extras?: ExaSearchContentExtrasOptions;
	context?: boolean | Record<string, unknown>;
	livecrawlTimeout?: number;
	maxAgeHours?: number;
	subpages?: number;
	subpageTarget?: string | string[];
	compliance?: string;
}

export interface ExaContentsStatus {
	id?: string;
	url?: string;
	status?: string;
	source?: string;
	[key: string]: unknown;
}

export interface ExaContentsResponse {
	requestId?: string;
	results: ExaSearchResult[];
	context?: string;
	statuses?: ExaContentsStatus[];
	costDollars?: {
		total?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface ExaClientOptions {
	apiKey?: string;
	baseUrl: string;
	fetch: FetchLike;
	headers: Record<string, string>;
	timeout?: number;
}

export interface ExaClientInit extends Partial<ExaClientOptions> {}

export interface ExaRequestOptions<TBody = unknown> {
	method?: string;
	path: string;
	body?: TBody;
	headers?: Record<string, string>;
	signal?: AbortSignal;
	timeout?: number;
}

export class ExaClientError extends Error {
	readonly status?: number;
	readonly statusText?: string;
	readonly data?: unknown;
	readonly response?: Response;

	constructor(
		message: string,
		options: { status?: number; statusText?: string; data?: unknown; response?: Response } = {},
	) {
		super(message);
		this.name = 'ExaClientError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.data = options.data;
		this.response = options.response;
	}
}

function resolveUrl(baseUrl: string, path: string): string {
	const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
	return new URL(path.replace(/^\/+/, ''), base).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function errorMessageFromData(data: unknown): string | undefined {
	if (typeof data === 'string') return data;
	if (!isRecord(data)) return undefined;
	const error = data.error;
	if (typeof error === 'string') return error;
	if (isRecord(error) && typeof error.message === 'string') return error.message;
	if (typeof data.message === 'string') return data.message;
	return undefined;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) return response.json();
	const text = await response.text();
	if (!text) return undefined;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
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

export class ExaClient {
	readonly options: ExaClientOptions;

	constructor({
		apiKey,
		baseUrl = DefaultExaBaseUrl,
		fetch = getGlobalThis().fetch,
		headers = {},
		timeout,
	}: ExaClientInit = {}) {
		this.options = { apiKey, baseUrl, fetch, headers, timeout };
	}

	async search(query: string, options?: Omit<ExaSearchRequest, 'query'>): Promise<ExaSearchResponse>;
	async search(request: ExaSearchRequest): Promise<ExaSearchResponse>;
	async search(
		input: string | ExaSearchRequest,
		options: Omit<ExaSearchRequest, 'query'> = {},
	): Promise<ExaSearchResponse> {
		const body: ExaSearchRequest = typeof input === 'string' ? { ...options, query: input } : input;
		return this.request<ExaSearchResponse, ExaSearchRequest>({ method: 'POST', path: 'search', body });
	}

	async contents(urls: string[], options?: Omit<ExaContentsRequest, 'urls'>): Promise<ExaContentsResponse>;
	async contents(request: ExaContentsRequest): Promise<ExaContentsResponse>;
	async contents(
		input: string[] | ExaContentsRequest,
		options: Omit<ExaContentsRequest, 'urls'> = {},
	): Promise<ExaContentsResponse> {
		const body: ExaContentsRequest = Array.isArray(input) ? { ...options, urls: input } : input;
		return this.request<ExaContentsResponse, ExaContentsRequest>({ method: 'POST', path: 'contents', body });
	}

	async request<TResponse, TBody = unknown>({
		method = 'GET',
		path,
		body,
		headers,
		signal,
		timeout,
	}: ExaRequestOptions<TBody>): Promise<TResponse> {
		const timeoutMs = timeout ?? this.options.timeout;
		const timeoutController = timeoutMs ? new AbortController() : undefined;
		const timer = timeoutMs ? setTimeout(() => timeoutController?.abort(), timeoutMs) : undefined;
		const requestHeaders = new Headers({ ...this.options.headers, ...(headers ?? {}) });
		if (this.options.apiKey && !requestHeaders.has('x-api-key')) requestHeaders.set('x-api-key', this.options.apiKey);
		if (body !== undefined && !requestHeaders.has('content-type'))
			requestHeaders.set('content-type', 'application/json');
		try {
			const response = await this.options.fetch(resolveUrl(this.options.baseUrl, path), {
				method,
				headers: requestHeaders,
				body: body === undefined ? undefined : JSON.stringify(body),
				signal: combineSignals(signal, timeoutController?.signal),
			});
			const data = await parseResponseBody(response);
			if (!response.ok) {
				const detail = errorMessageFromData(data);
				const suffix = detail ? `: ${detail}` : '';
				throw new ExaClientError(`Exa request failed: ${response.status} ${response.statusText}${suffix}`, {
					status: response.status,
					statusText: response.statusText,
					data,
					response,
				});
			}
			return data as TResponse;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}
}
