// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are rejected deliberately
const CONTROL = /[\x00-\x1f\x7f]/u;

/** A DNS name usable as a path segment: not empty, `..`, `/`, `\` or control characters. `.` is the root. */
export function isValidDnsName(value: string): boolean {
	const text = value.trim();
	return text.length > 0 && text.length <= 1024 && text !== '..' && !text.includes('/') && !text.includes('\\') && !CONTROL.test(text) && !text.includes('..');
}

/** Canonical absolute name with a trailing dot; `.` stays the root. */
export function normalizeDnsName(value: string): string {
	const text = value.trim();
	if (!isValidDnsName(text)) throw new TypeError('Invalid DNS name');
	return text.endsWith('.') ? text : `${text}.`;
}

/** `@` is the apex; relative names resolve below the zone; names already inside the zone become absolute. */
export function normalizeDnsRecordName(name: string, zone: string): string {
	const value = name.trim();
	const zoneName = normalizeDnsName(zone);
	if (value === '@') return zoneName;
	if (!isValidDnsName(value)) throw new TypeError('Invalid DNS name');
	if (value.endsWith('.')) return value;
	if (zoneName === '.') return `${value}.`;
	const bare = zoneName.slice(0, -1).toLowerCase();
	const lower = value.toLowerCase();
	if (lower === bare || lower.endsWith(`.${bare}`)) return `${value}.`;
	return `${value}.${zoneName}`;
}

/** DNS names compare case-insensitively. */
export function sameDnsName(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}
