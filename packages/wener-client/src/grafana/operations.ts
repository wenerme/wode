import { GrafanaClientError } from './errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Rejects path traversal and protocol-relative paths before any network access. */
export function isSafeGrafanaPath(path: string): boolean {
	if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('#'))
		return false;
	const pathname = path.split('?', 1)[0] ?? '';
	for (const rawSegment of pathname.split('/').slice(1)) {
		let segment = rawSegment;
		let stable = false;
		try {
			for (let depth = 0; depth < 16; depth++) {
				const decoded = decodeURIComponent(segment);
				if (decoded === segment) {
					stable = true;
					break;
				}
				segment = decoded;
			}
		} catch {
			return false;
		}
		if (!stable || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\')) return false;
	}
	return true;
}

export interface GrafanaRequestInput {
	path: string;
	method?: string;
	params?: Record<string, string | string[] | undefined>;
	body?: unknown;
}
export interface GrafanaRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}

export function validateRequestInput(input: GrafanaRequestInput): { path: string; method: string; params: Record<string, string | string[] | undefined>; body: unknown } {
	if (input === null || typeof input !== 'object') throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana request');
	if (!isSafeGrafanaPath(input.path)) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana request path');
	const method = (input.method ?? (input.body === undefined ? 'GET' : 'POST')).trim().toUpperCase();
	if (!SAFE_METHODS.has(method)) throw new GrafanaClientError('INVALID_REQUEST', 'Invalid Grafana request method');
	if (['GET', 'HEAD'].includes(method) && input.body !== undefined)
		throw new GrafanaClientError('INVALID_REQUEST', 'Grafana GET/HEAD requests cannot include a body');
	return { path: input.path, method, params: input.params ?? {}, body: input.body };
}

export function isGrafanaWriteMethod(method: string): boolean {
	return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
