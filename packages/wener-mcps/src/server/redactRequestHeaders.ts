export const REDACTED_HEADER_VALUE = '[REDACTED]';

const sensitiveHeaderNames = new Set([
	'authorization',
	'proxy-authorization',
	'cookie',
	'set-cookie',
	'x-db-url',
	'x-db-read-url',
	'x-db-write-url',
]);

const sensitiveHeaderSegments = new Set(['authorization', 'cookie', 'token', 'secret', 'password', 'credential']);

function containsUrlCredentials(value: string): boolean {
	try {
		const url = new URL(value);
		return Boolean(url.username || url.password);
	} catch {
		return false;
	}
}

export function isSensitiveRequestHeader(name: string, value: string): boolean {
	const normalizedName = name.toLowerCase();
	if (sensitiveHeaderNames.has(normalizedName)) return true;

	const segments = normalizedName.split('-');
	if (segments.some((segment) => sensitiveHeaderSegments.has(segment))) return true;
	if (normalizedName.includes('api-key') || normalizedName.includes('apikey')) return true;

	return normalizedName.endsWith('-url') && containsUrlCredentials(value);
}

export function redactRequestHeaders(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, key) => {
		record[key] = isSensitiveRequestHeader(key, value) ? REDACTED_HEADER_VALUE : value;
	});
	return record;
}
