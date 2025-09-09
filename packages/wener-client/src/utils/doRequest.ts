import {
	dumpRequest,
	dumpResponse,
	isPlainObject,
	type FetchLike,
	type MaybeArray,
	type MaybePromise,
} from '@wener/utils';

export interface RequestError extends Error {
	response?: Response;
	status?: number;
	statusText?: string;
	data?: any;
}

export interface RetryOptions {
	attempts?: number;
	delay?: number | ((attempt: number) => number);
	shouldRetry?: (error: RequestError, context: { attemptNumber: number; retriesLeft: number }) => boolean;
	onFailedAttempt?: (context: {
		error: RequestError;
		attemptNumber: number;
		retriesLeft: number;
	}) => void | Promise<void>;
	factor?: number; // exponential backoff factor
	maxDelay?: number; // maximum delay between retries
	randomize?: boolean; // add jitter to delays
}

export interface DoRequestContext<T = any> {
	url: string;
	req: RequestInit;
	res: Response;
	data?: T;
	error?: RequestError;
}

export type DoRequestInit = Omit<RequestInit, 'method' | 'headers'> & {
	method: string;
	headers: Headers;
};

export type DoRequestOptions<OUT = any, IN = OUT> = {
	url: string;
	baseUrl?: string;
	body?: any;
	params?: Record<string, MaybeArray<string | number | boolean | null | undefined>>;
	transform?: (ctx: DoRequestContext<IN>) => MaybePromise<OUT>;
	onRequest?: (ctx: { url: string; req: DoRequestInit }) => MaybePromise<void>;
	onSuccess?: (ctx: DoRequestContext<OUT>) => MaybePromise<void>;
	onError?: (ctx: DoRequestContext) => MaybePromise<void>;
	onResponse?: (ctx: DoRequestContext<OUT>) => MaybePromise<void>;
	parseResponse?: (res: Response, ctx: DoRequestContext) => MaybePromise<IN>;
	headers?: Record<string, any>;
	fetch?: FetchLike;
	debug?: boolean;
	timeout?: number;
	retry?: RetryOptions;
} & Omit<RequestInit, 'body' | 'headers'>;

export async function doRequest<OUT = any, IN = OUT>(opts: DoRequestOptions<OUT, IN>): Promise<OUT> {
	const {
		debug,
		fetch = globalThis.fetch,
		onSuccess,
		onResponse,
		onError,
		parseResponse = _parseResponse,
		transform,
		onRequest,
		timeout,
		retry,
		...init
	} = opts;

	// Default: no retry unless explicitly configured
	const retryConfig = {
		attempts: retry?.attempts ?? 0,
		delay: retry?.delay ?? 1000,
		shouldRetry: retry?.shouldRetry ?? defaultShouldRetry,
		onFailedAttempt: retry?.onFailedAttempt,
		factor: retry?.factor ?? 2,
		maxDelay: retry?.maxDelay ?? 30000,
		randomize: retry?.randomize ?? false,
	};

	return executeWithRetry(async () => {
		const { req, url } = resolveRequest({ ...init, timeout });

		if (onRequest) {
			await onRequest({ url, req });
		}

		if (debug) {
			await dumpRequest({ url, req });
		}

		const res = await fetch(url, req);

		if (debug) {
			await dumpResponse({ url, req, res: res.clone() });
		}

		let input: IN;
		let output: OUT;
		const ctx: DoRequestContext = { res, req, url };

		try {
			input = await parseResponse(res, ctx);
			ctx.data = input;

			if (transform) {
				output = await transform(ctx as DoRequestContext<IN>);
			} else {
				output = input as any;
			}
			ctx.data = output;

			if (onSuccess) {
				await onSuccess(ctx as DoRequestContext<OUT>);
			}
			if (onResponse) {
				await onResponse(ctx as DoRequestContext<OUT>);
			}

			return output;
		} catch (e) {
			const error = e instanceof Error ? (e as RequestError) : (new Error(String(e)) as RequestError);
			if (!error.response && res) {
				error.response = res;
				error.status = res.status;
				error.statusText = res.statusText;
			}
			ctx.error = error;

			if (onError) {
				await onError(ctx);
			}
			if (onResponse) {
				await onResponse(ctx as DoRequestContext<OUT>);
			}
			throw error;
		}
	}, retryConfig);
}

function resolveRequest({
	body,
	method = body ? 'POST' : 'GET',
	url,
	baseUrl,
	params,
	signal,
	cache,
	credentials,
	timeout,
	...init
}: DoRequestOptions & { timeout?: number }): { req: DoRequestInit; url: string } {
	let timeoutController: AbortController | undefined;
	let combinedSignal = signal;

	if (timeout) {
		timeoutController = new AbortController();
		setTimeout(() => timeoutController!.abort(), timeout);

		if (signal) {
			const controller = new AbortController();
			const abortHandler = () => controller.abort();
			signal.addEventListener('abort', abortHandler);
			timeoutController.signal.addEventListener('abort', abortHandler);
			combinedSignal = controller.signal;
		} else {
			combinedSignal = timeoutController.signal;
		}
	}

	const headers = new Headers(init.headers);
	if (method !== 'GET' && body) {
		if (typeof body === 'string') {
			// ok
		} else if (body instanceof URLSearchParams) {
			headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			body = body.toString();
		} else if (isPlainObject(body)) {
			headers.set('Content-Type', 'application/json; charset=utf-8');
			body = JSON.stringify(body);
		} else {
			throw new Error(`Invalid body type: ${typeof body}`);
		}
	}

	let u: URL;
	if (baseUrl) {
		u = new URL(url, baseUrl);
	} else {
		u = new URL(url);
	}

	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v === null || v === undefined) continue;
			if (Array.isArray(v)) {
				for (const vv of v) {
					u.searchParams.append(k, String(vv));
				}
				continue;
			}
			u.searchParams.set(k, String(v));
		}
	}
	u.searchParams.sort();
	url = u.toString();
	const req = { signal: combinedSignal, method, body, cache, credentials, headers } as DoRequestInit;

	return { req, url };
}

async function _parseResponse(res: Response): Promise<any> {
	if (!res.ok) {
		let data: any;
		try {
			const contentType = res.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				data = await res.json();
			} else {
				data = await res.text();
			}
		} catch {
			// ignore parse errors for error responses
		}

		const error = Object.assign(new Error(`Request failed: ${res.status} ${res.statusText}`), {
			response: res,
			status: res.status,
			statusText: res.statusText,
			data,
		} as RequestError);
		throw error;
	}

	const contentType = res.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return res.json();
	}
	if (contentType?.includes('text/')) {
		return res.text();
	}
	return res.blob();
}

function defaultShouldRetry(error: RequestError): boolean {
	// Retry on network errors or 5xx status codes
	if (!error.status) return true; // Network error
	return error.status >= 500 && error.status < 600;
}

function calculateDelay(
	attempt: number,
	config: {
		delay: number | ((attempt: number) => number);
		factor: number;
		maxDelay: number;
		randomize: boolean;
	},
): number {
	let delayMs: number;

	if (typeof config.delay === 'function') {
		delayMs = config.delay(attempt);
	} else {
		// Exponential backoff: delay * factor^attempt
		delayMs = config.delay * Math.pow(config.factor, attempt);
	}

	// Apply max delay limit
	delayMs = Math.min(delayMs, config.maxDelay);

	// Add jitter if enabled (randomize between 50%-150% of calculated delay)
	if (config.randomize) {
		const jitter = 0.5 + Math.random(); // 0.5 to 1.5
		delayMs *= jitter;
	}

	return Math.floor(delayMs);
}

async function executeWithRetry<T>(
	operation: () => Promise<T>,
	config: {
		attempts: number;
		delay: number | ((attempt: number) => number);
		shouldRetry: (error: RequestError, context: { attemptNumber: number; retriesLeft: number }) => boolean;
		onFailedAttempt?: (context: {
			error: RequestError;
			attemptNumber: number;
			retriesLeft: number;
		}) => void | Promise<void>;
		factor: number;
		maxDelay: number;
		randomize: boolean;
	},
): Promise<T> {
	let lastError: RequestError;

	for (let attempt = 0; attempt <= config.attempts; attempt++) {
		try {
			return await operation();
		} catch (e) {
			lastError = e instanceof Error ? (e as RequestError) : (new Error(String(e)) as RequestError);

			const retriesLeft = config.attempts - attempt;
			const context = {
				error: lastError,
				attemptNumber: attempt + 1,
				retriesLeft,
			};

			// Call onFailedAttempt callback if provided
			if (config.onFailedAttempt) {
				try {
					await config.onFailedAttempt(context);
				} catch (callbackError) {
					// If callback throws, abort all retries
					throw callbackError;
				}
			}

			// Check if we should retry
			if (attempt === config.attempts || !config.shouldRetry(lastError, context)) {
				throw lastError;
			}

			// Calculate and wait for delay
			const delayMs = calculateDelay(attempt, config);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	throw lastError!;
}
