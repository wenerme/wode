export type FetchImplementation = typeof globalThis.fetch;

export type FetchHeaders = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return isRecord(value);
}

export function assertSupportedKeys(value: unknown, keys: readonly string[], message: string): Record<string, unknown> {
	if (!isRecord(value) || Object.keys(value).some((key) => !keys.includes(key))) throw new Error(message);
	return value;
}

export function normalizeHeaders(value: unknown): FetchHeaders | undefined {
	if (value === undefined) return undefined;
	try {
		const headers = new Headers(value as HeadersInit);
		return Object.fromEntries(headers.entries());
	} catch {
		throw new Error('Invalid fetch service configuration');
	}
}

export function validateHttpUrl(value: unknown, message = 'Invalid fetch URL'): string {
	if (typeof value !== 'string' || !value.trim()) throw new TypeError(message);
	try {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new TypeError(message);
	} catch (error) {
		if (error instanceof TypeError && error.message === message) throw error;
		throw new TypeError(message);
	}
	return value;
}

export function validatePositiveSafeInteger(value: unknown, name: string): number | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1)
		throw new TypeError(`${name} must be a positive safe integer`);
	return value;
}

export function parseFetchRequest(value: unknown): { url: string; maxCharacters?: number } {
	if (!isRecord(value) || Object.keys(value).some((key) => !['url', 'maxCharacters'].includes(key)))
		throw new TypeError('Invalid fetch request');
	const url = validateHttpUrl(value.url);
	const maxCharacters = validatePositiveSafeInteger(value.maxCharacters, 'maxCharacters');
	return maxCharacters === undefined ? { url } : { url, maxCharacters };
}

export function getCallSignal(value: unknown): AbortSignal | undefined {
	if (value === undefined) return undefined;
	if (!isRecord(value) || Object.keys(value).some((key) => key !== 'signal'))
		throw new TypeError('Unsupported fetch call option');
	if (value.signal === undefined) return undefined;
	const signal = value.signal;
	if (
		!isRecord(signal) ||
		typeof signal.aborted !== 'boolean' ||
		typeof signal.throwIfAborted !== 'function' ||
		typeof signal.addEventListener !== 'function'
	)
		throw new TypeError('Invalid fetch call signal');
	return signal as unknown as AbortSignal;
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
	signal?.throwIfAborted();
}

export function isAbortError(error: unknown): boolean {
	return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export function limitContent(content: string, maxCharacters: number | undefined): string {
	return maxCharacters === undefined ? content : content.slice(0, maxCharacters);
}

export function sanitizeFetchError(error: unknown, abortedMessage: string, failedMessage: string): never {
	if (isAbortError(error)) throw new DOMException(abortedMessage, error instanceof Error ? error.name : 'AbortError');
	throw new Error(failedMessage);
}
