const secretKey =
	/^(?:authorization|proxy-authorization|cookies?|set-cookie|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|password|passwd|secret|client[_-]?secret|credentials?|dsn|connection[_-]?string)$/iu;

/** CLI 输出边界的副本；协议 client 保留原始数据供 SDK 调用方处理。 */
export function sanitizeOpenObserveOutput<T>(value: T): T {
	let remaining = 20_000;
	const seen = new WeakSet<object>();
	function walk(item: unknown, depth: number): unknown {
		if (--remaining < 0 || depth > 32) return '<truncated>';
		if (typeof item === 'string') {
			if (item.length <= 1024 * 1024 && /^\s*[{[]/u.test(item)) {
				try { return JSON.stringify(walk(JSON.parse(item), depth + 1)); }
				catch { /* Text that resembles JSON still passes through the text redactor. */ }
			}
			return item
				.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/giu, '$1 <redacted>')
				.replace(
					/\b((?:password|passwd|(?:access[_-]?|refresh[_-]?|id[_-]?)?token|api[_-]?key|secret)["']?\s*[=:]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}&]+)/giu,
					(_match, prefix: string, value: string) => `${prefix}${/^["']/u.test(value) ? `${value[0]}<redacted>${value[0]}` : '<redacted>'}`,
				)
				.replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/giu, '$1<redacted>@');
		}
		if (item === null || typeof item !== 'object') return item;
		if (seen.has(item)) return '<circular>';
		seen.add(item);
		if (Array.isArray(item)) return item.map((entry) => walk(entry, depth + 1));
		return Object.fromEntries(
			Object.entries(item).map(([key, entry]) => [key, secretKey.test(key) ? '<redacted>' : walk(entry, depth + 1)]),
		);
	}
	return walk(value, 0) as T;
}
