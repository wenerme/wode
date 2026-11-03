import type { ApolloHttpErrorInfo } from './errors';
import { redactApolloMessage } from './redactor';

const MaxDetailLength = 240;
const SignInLocationPattern = /signin|login/u;

/** Thrown by the HTTP adapter for non-2xx responses; carries only redacted, bounded diagnostics. */
export class ApolloHttpError extends Error implements ApolloHttpErrorInfo {
	readonly status: number;
	readonly method: string;
	readonly path: string;
	readonly exception?: string;
	readonly detail?: string;
	/** Spring Security redirected to sign-in before any controller ran, so nothing was applied. */
	readonly signInRedirect: boolean;

	constructor(info: ApolloHttpErrorInfo & { signInRedirect?: boolean }) {
		super(`Apollo HTTP ${info.status}`);
		this.name = 'ApolloHttpError';
		this.signInRedirect = info.signInRedirect === true;
		this.status = info.status;
		this.method = info.method;
		this.path = info.path;
		if (info.exception) this.exception = info.exception;
		if (info.detail) this.detail = info.detail;
	}

	toInfo(): ApolloHttpErrorInfo {
		return {
			status: this.status,
			method: this.method,
			path: this.path,
			...(this.exception ? { exception: this.exception } : {}),
			...(this.detail ? { detail: this.detail } : {}),
		};
	}
}

function sanitizeDetail(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	// Redact per line first (assignments run to end of line), then flatten to one bounded line.
	const text = Array.from(redactApolloMessage(value), (char) => (/\p{Cc}/u.test(char) ? ' ' : char))
		.join('')
		.replace(/\s+/gu, ' ')
		.trim();
	if (!text) return undefined;
	return text.length > MaxDetailLength ? `${text.slice(0, MaxDetailLength)}…` : text;
}

function simpleExceptionName(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const name = value.trim().split('.').pop();
	return name && /^[A-Za-z_$][\w$]*$/u.test(name) ? name : undefined;
}

/**
 * Builds a safe error from an Apollo response. Only the structured `exception` class name and `message`
 * fields are surfaced (redacted and length-capped); arbitrary body fields are never echoed.
 */
export async function createApolloHttpError(response: Response, method: string, url: URL): Promise<ApolloHttpError> {
	let exception: string | undefined;
	let detail: string | undefined;
	let signInRedirect = false;
	if (response.status >= 300 && response.status < 400) {
		signInRedirect = SignInLocationPattern.test(response.headers.get('location') ?? '');
		detail = signInRedirect
			? 'redirected to sign-in; portal login failed or session is not authorized'
			: 'unexpected redirect';
	} else {
		try {
			const body = JSON.parse(await response.text()) as unknown;
			if (body && typeof body === 'object' && !Array.isArray(body)) {
				const record = body as Record<string, unknown>;
				exception = simpleExceptionName(record.exception);
				detail = sanitizeDetail(record.message);
			}
		} catch {
			// Non-JSON bodies (HTML error pages, proxies) are not echoed.
		}
	}
	return new ApolloHttpError({
		status: response.status,
		method,
		path: url.pathname,
		exception,
		detail,
		signInRedirect,
	});
}

/**
 * A definitive server rejection: the request was not applied, so the mutation outcome is known. Other redirects
 * may follow a committed write and therefore stay outcome-unknown for mutations.
 */
export function isApolloHttpRejection(error: ApolloHttpError): boolean {
	if (error.status >= 300 && error.status < 400) return error.signInRedirect;
	return error.status >= 400 && error.status < 500 && error.status !== 408;
}

export function isApolloAuthStatus(error: ApolloHttpError): 'unauthorized' | 'forbidden' | undefined {
	if (error.status === 403) return 'forbidden';
	if (error.status === 401 || error.signInRedirect) return 'unauthorized';
	return undefined;
}

export function describeApolloHttpError(error: ApolloHttpErrorInfo): string {
	const summary = [error.exception, error.detail].filter(Boolean).join(': ');
	return `HTTP ${error.status}${summary ? ` ${summary}` : ''} (${error.method} ${error.path})`;
}

/** Connection-level failures where the request never reached the server, so no mutation was applied. */
const NotSentCauseCodes = new Set([
	'UND_ERR_CONNECT_TIMEOUT',
	'ECONNREFUSED',
	'ENOTFOUND',
	'EAI_AGAIN',
	'EHOSTUNREACH',
	'ENETUNREACH',
]);

export interface ApolloTransportFailure {
	reason: string;
	/** The connection was never established; a mutation outcome is known to be "not applied". */
	notSent: boolean;
}

/** Safe one-line reason for transport failures that never produced an HTTP response. */
export function describeApolloTransportError(error: unknown): ApolloTransportFailure | undefined {
	if (!(error instanceof Error)) return undefined;
	if (error.name === 'TimeoutError' || error.name === 'AbortError')
		return { reason: 'request timed out', notSent: false };
	if (error.name !== 'TypeError' || !/fetch failed/u.test(error.message)) return undefined;
	const cause = (error as Error & { cause?: { code?: unknown } }).cause?.code;
	const code = typeof cause === 'string' && /^[A-Z][A-Z0-9_]{1,40}$/u.test(cause) ? cause : undefined;
	return {
		reason: code ? `network error (${code})` : 'network error',
		notSent: Boolean(code && NotSentCauseCodes.has(code)),
	};
}
