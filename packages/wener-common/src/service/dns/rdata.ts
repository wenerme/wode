/**
 * RFC 1035 presentation-format helpers shared by DNS providers whose APIs use a different
 * per-record model (Cloudflare, Alidns, ...). Pure string functions; browser-safe.
 */

export interface RdataToken {
	/** Raw token text; escapes are kept, surrounding quotes are removed. */
	text: string;
	quoted: boolean;
}

/** Splits presentation RDATA into whitespace-separated tokens, honoring quotes and `\` escapes. */
export function tokenizeRdata(value: string): RdataToken[] {
	const tokens: RdataToken[] = [];
	const input = value.trim();
	let i = 0;
	while (i < input.length) {
		const ch = input[i]!;
		if (ch === ' ' || ch === '\t') {
			i++;
			continue;
		}
		const quoted = ch === '"';
		let j = quoted ? i + 1 : i;
		let raw = '';
		while (j < input.length) {
			const c = input[j]!;
			if (c === '\\' && j + 1 < input.length) {
				raw += input.slice(j, j + 2);
				j += 2;
				continue;
			}
			if (quoted ? c === '"' : c === ' ' || c === '\t') break;
			raw += c;
			j++;
		}
		if (quoted) {
			if (j >= input.length) throw new TypeError('Unterminated quoted string in DNS value');
			j++;
		}
		tokens.push({ text: raw, quoted });
		i = j;
	}
	return tokens;
}

/** Resolves `\X` and `\DDD` (decimal byte) escapes; the bytes are decoded as UTF-8. */
export function unescapeCharacterString(raw: string): string {
	const encoder = new TextEncoder();
	const bytes: number[] = [];
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i]!;
		if (ch === '\\' && i + 1 < raw.length) {
			const ddd = /^\d{3}/u.exec(raw.slice(i + 1, i + 4));
			if (ddd) {
				const byte = Number(ddd[0]);
				if (byte > 255) throw new TypeError('Invalid escape in DNS value');
				bytes.push(byte);
				i += 3;
				continue;
			}
			i++;
		}
		const code = raw.codePointAt(i)!;
		const char = String.fromCodePoint(code);
		if (char.length === 2) i++;
		bytes.push(...encoder.encode(char));
	}
	return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Quotes one character-string: escapes `"` and `\`, control bytes become `\DDD`. */
export function quoteCharacterString(value: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are escaped deliberately
	return `"${value.replace(/[\\"]|[\x00-\x1f\x7f]/gu, (ch) => (ch === '\\' || ch === '"' ? `\\${ch}` : `\\${String(ch.charCodeAt(0)).padStart(3, '0')}`))}"`;
}

/** `"a" "b"` -> `['a', 'b']`; unquoted words are accepted as separate strings. */
export function parseTxtValue(value: string): string[] {
	const tokens = tokenizeRdata(value);
	if (!tokens.length) return [''];
	return tokens.map((token) => unescapeCharacterString(token.text));
}

/** `['a', 'b']` -> `"a" "b"`. */
export function formatTxtValue(strings: string[]): string {
	return (strings.length ? strings : ['']).map(quoteCharacterString).join(' ');
}

/**
 * Normalizes TXT presentation text without decoding short quoted strings: quoted tokens keep
 * their escapes verbatim (`"p=MIIB\059x"` stays as is), bare words are quoted, and any
 * character-string longer than 255 bytes is split so the result is valid RFC 1035 RDATA.
 */
export function normalizeTxtValue(value: string): string {
	const tokens = tokenizeRdata(value);
	if (!tokens.length) return '""';
	const encoder = new TextEncoder();
	return tokens
		.flatMap((token) => {
			const decoded = unescapeCharacterString(token.text);
			if (encoder.encode(decoded).byteLength > 255) return splitCharacterStrings(decoded).map(quoteCharacterString);
			return [token.quoted ? `"${token.text}"` : quoteCharacterString(decoded)];
		})
		.join(' ');
}

/** Raw (unquoted) TXT text -> presentation form, split into RFC 1035 character-strings. */
export function formatRawTxt(text: string): string {
	return formatTxtValue(splitCharacterStrings(text));
}

/** True when the text is a non-empty sequence of quoted character-strings. */
export function isQuotedTxt(value: string): boolean {
	const text = value.trim();
	if (!text.startsWith('"')) return false;
	try {
		return tokenizeRdata(text).every((token) => token.quoted);
	} catch {
		return false;
	}
}

/** Splits text into character-strings of at most 255 UTF-8 bytes, on code point boundaries. */
export function splitCharacterStrings(text: string, maxBytes = 255): string[] {
	const encoder = new TextEncoder();
	const parts: string[] = [];
	let current = '';
	let size = 0;
	for (const char of text) {
		const length = encoder.encode(char).byteLength;
		if (size + length > maxBytes && current) {
			parts.push(current);
			current = '';
			size = 0;
		}
		current += char;
		size += length;
	}
	parts.push(current);
	return parts;
}

/** Absolute target with exactly one trailing dot (`.` stays the root). */
export function absoluteTarget(value: string): string {
	const text = value.trim();
	if (text === '' || text === '.') return '.';
	return text.endsWith('.') ? text : `${text}.`;
}

/** Strips the trailing dot of an absolute target for APIs that store bare names; the root stays `.`. */
export function bareTarget(value: string): string {
	const text = value.trim();
	if (text === '.' || text === '') return '.';
	return text.endsWith('.') ? text.slice(0, -1) : text;
}

function integer(token: string | undefined, label: string, max = 65_535): number {
	if (token === undefined || !/^\d{1,10}$/u.test(token)) throw new TypeError(`Invalid ${label} in DNS value`);
	const value = Number(token);
	if (value > max) throw new TypeError(`Invalid ${label} in DNS value`);
	return value;
}
function plain(tokens: RdataToken[], label: string): void {
	if (tokens.some((token) => token.quoted)) throw new TypeError(`Invalid ${label} value`);
}

export interface MxRdata { priority: number; target: string }
export interface SrvRdata { priority: number; weight: number; port: number; target: string }
export interface CaaRdata { flags: number; tag: string; value: string }

/** `10 mx.example.com.` */
export function parseMx(value: string): MxRdata {
	const tokens = tokenizeRdata(value);
	if (tokens.length !== 2) throw new TypeError('MX value must be "<priority> <target>"');
	plain(tokens, 'MX');
	return { priority: integer(tokens[0]!.text, 'MX priority'), target: absoluteTarget(tokens[1]!.text) };
}
export function formatMx({ priority, target }: MxRdata): string {
	return `${priority} ${absoluteTarget(target)}`;
}

/** `10 5 5060 sip.example.com.` */
export function parseSrv(value: string): SrvRdata {
	const tokens = tokenizeRdata(value);
	if (tokens.length !== 4) throw new TypeError('SRV value must be "<priority> <weight> <port> <target>"');
	plain(tokens, 'SRV');
	return {
		priority: integer(tokens[0]!.text, 'SRV priority'),
		weight: integer(tokens[1]!.text, 'SRV weight'),
		port: integer(tokens[2]!.text, 'SRV port'),
		target: absoluteTarget(tokens[3]!.text),
	};
}
export function formatSrv({ priority, weight, port, target }: SrvRdata): string {
	return `${priority} ${weight} ${port} ${absoluteTarget(target)}`;
}

/** `0 issue "ca.example.net"`; the value may be quoted or a bare word. */
export function parseCaa(value: string): CaaRdata {
	const tokens = tokenizeRdata(value);
	if (tokens.length !== 3) throw new TypeError('CAA value must be "<flags> <tag> <value>"');
	plain(tokens.slice(0, 2), 'CAA');
	const tag = tokens[1]!.text;
	if (!/^[A-Za-z0-9]{1,15}$/u.test(tag)) throw new TypeError('Invalid CAA tag in DNS value');
	return { flags: integer(tokens[0]!.text, 'CAA flags', 255), tag, value: unescapeCharacterString(tokens[2]!.text) };
}
export function formatCaa({ flags, tag, value }: CaaRdata): string {
	return `${flags} ${tag} ${quoteCharacterString(value)}`;
}

/** Record types whose single RDATA field is a domain name. */
export const DnsTargetTypes: ReadonlySet<string> = new Set(['CNAME', 'NS', 'PTR', 'DNAME', 'ANAME', 'ALIAS']);

/**
 * Canonical presentation form used to compare values: TXT decoded and re-quoted, MX/SRV/CAA
 * re-formatted, targets absolute and lower-cased. Other types are whitespace-normalized only.
 */
export function canonicalRdata(type: string, value: string): string {
	const kind = type.toUpperCase();
	try {
		switch (kind) {
			case 'TXT':
			case 'SPF':
				// Over-long strings compare equal to their 255-byte split form.
				return formatTxtValue(parseTxtValue(value).flatMap((part) => splitCharacterStrings(part)));
			case 'MX': {
				const mx = parseMx(value);
				return formatMx({ ...mx, target: mx.target.toLowerCase() });
			}
			case 'SRV': {
				const srv = parseSrv(value);
				return formatSrv({ ...srv, target: srv.target.toLowerCase() });
			}
			case 'CAA': {
				const caa = parseCaa(value);
				return formatCaa({ ...caa, tag: caa.tag.toLowerCase() });
			}
			default:
				if (DnsTargetTypes.has(kind)) return absoluteTarget(value).toLowerCase();
				return value.trim().replace(/\s+/gu, ' ');
		}
	} catch {
		return value.trim();
	}
}
