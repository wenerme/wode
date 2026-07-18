import { type FetchLike, getGlobalThis } from '@wener/utils';

export const DefaultJinaReaderBaseUrl = 'https://r.jina.ai';

export interface JinaReaderData {
	title?: string;
	description?: string;
	url?: string;
	content?: string;
	publishedTime?: string;
	warning?: string;
	metadata?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface JinaReaderResponse {
	code?: number;
	status?: number;
	data?: JinaReaderData;
	[key: string]: unknown;
}

export interface JinaReaderClientInit {
	baseUrl?: string;
	fetch?: FetchLike;
	headers?: Record<string, string>;
	timeout?: number;
}

export class JinaReaderClientError extends Error {
	readonly status?: number;
	readonly statusText?: string;
	readonly data?: unknown;
	readonly response?: Response;

	constructor(
		message: string,
		options: { status?: number; statusText?: string; data?: unknown; response?: Response } = {},
	) {
		super(message);
		this.name = 'JinaReaderClientError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.data = options.data;
		this.response = options.response;
	}
}

function readerUrl(baseUrl: string, targetUrl: string): string {
	const target = targetUrl.startsWith('http://') ? targetUrl.slice('http://'.length) : targetUrl;
	return `${baseUrl.replace(/\/+$/, '')}/http://${target}`;
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

export class JinaReaderClient {
	readonly baseUrl: string;
	readonly fetch: FetchLike;
	readonly headers: Record<string, string>;
	readonly timeout?: number;

	constructor({
		baseUrl = DefaultJinaReaderBaseUrl,
		fetch = getGlobalThis().fetch,
		headers = {},
		timeout,
	}: JinaReaderClientInit = {}) {
		this.baseUrl = baseUrl;
		this.fetch = fetch;
		this.headers = headers;
		this.timeout = timeout;
	}

	async read(url: string, options: { signal?: AbortSignal; timeout?: number } = {}): Promise<JinaReaderResponse> {
		const timeoutMs = options.timeout ?? this.timeout;
		const timeoutController = timeoutMs ? new AbortController() : undefined;
		const timer = timeoutMs ? setTimeout(() => timeoutController?.abort(), timeoutMs) : undefined;
		try {
			const response = await this.fetch(readerUrl(this.baseUrl, url), {
				headers: { accept: 'application/json', ...this.headers },
				signal: combineSignals(options.signal, timeoutController?.signal),
			});
			const text = await response.text();
			let data: unknown = { data: { content: text } };
			try {
				data = JSON.parse(text) as unknown;
			} catch {
				// plain markdown/text fallback
			}
			if (!response.ok)
				throw new JinaReaderClientError(`Jina reader request failed: ${response.status} ${response.statusText}`, {
					status: response.status,
					statusText: response.statusText,
					data,
					response,
				});
			return data as JinaReaderResponse;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}
}
