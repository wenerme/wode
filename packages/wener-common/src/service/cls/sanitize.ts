const secretKey =
	/^(?:authorization|proxy-authorization|cookies?|set-cookie|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|password|passwd|secret|client[_-]?secret|clientsecret|credentials?)$/iu;

/** CLI output copy; avoids echoing authentication fields verbatim in case CLS ever returns them. */
export function sanitizeClsOutput<T>(value: T): T {
	let remaining = 20_000;
	const seen = new WeakSet<object>();
	function walk(input: unknown, depth: number): unknown {
		if (--remaining < 0 || depth > 32) return '<truncated>';
		if (typeof input === 'string') {
			return input
				.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/giu, '$1 <redacted>')
				.replace(/\bTC3-HMAC-SHA256\s+[A-Za-z0-9._~+/=,:; -]+/giu, 'TC3-HMAC-SHA256 <redacted>')
				.replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/giu, '$1<redacted>@');
		}
		if (input === null || typeof input !== 'object') return input;
		if (seen.has(input)) return '<circular>';
		seen.add(input);
		if (Array.isArray(input)) return input.map((entry) => walk(entry, depth + 1));
		return Object.fromEntries(
			Object.entries(input).map(([key, entry]) => [key, secretKey.test(key) ? '<redacted>' : walk(entry, depth + 1)]),
		);
	}
	return walk(value, 0) as T;
}
