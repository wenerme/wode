const secretKey = /^(?:authorization|proxy-authorization|cookies?|set-cookie|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|password|passwd|secret|credentials?|bot[_-]?token)$/iu;

/**
 * Telegram never requires the bot token to appear in a response body, but this sanitizer
 * still defensively strips any `bot<digits>:<token>` substring that might leak into a URL or
 * error description echoed back by a misbehaving upstream, mirroring the Grafana
 * Bearer/Basic-token redaction pattern.
 */
const botTokenInUrl = /\bbot\d+:[A-Za-z0-9_-]+/giu;

export function sanitizeTelegramOutput<T>(value: T): T {
	let remaining = 20_000;
	const seen = new WeakSet<object>();
	function walk(input: unknown, depth: number): unknown {
		if (--remaining < 0 || depth > 32) return '<truncated>';
		if (typeof input === 'string') {
			return input
				.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/giu, '$1 <redacted>')
				.replace(botTokenInUrl, 'bot<redacted>')
				.replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/giu, '$1<redacted>@');
		}
		if (input === null || typeof input !== 'object') return input;
		if (seen.has(input)) return '<circular>';
		seen.add(input);
		if (Array.isArray(input)) return input.map((entry) => walk(entry, depth + 1));
		return Object.fromEntries(Object.entries(input).map(([key, entry]) => [key, secretKey.test(key) ? '<redacted>' : walk(entry, depth + 1)]));
	}
	return walk(value, 0) as T;
}
