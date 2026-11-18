// The GEC v2 checksum below is adapted from MsEdgeTTS (MIT), copyright
// (c) 2023 Migushthe2nd. See LICENSE.msedge-tts for the full license.
// Reference: MsEdgeTTS c8722b3b3412e2a4117cddfd5547ae2f687b555a/src/SecMsGec.ts.
export const EDGE_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
export const EDGE_BASE = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
export const EDGE_GEC_VERSION = '2-143.0.3650.75';
export const EDGE_CODEC = 'audio-24khz-48kbitrate-mono-mp3';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function edgeHeaders(): Record<string, string> {
	return {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
		Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
		Pragma: 'no-cache',
		'Cache-Control': 'no-cache',
		Cookie: `muid=${edgeId().toUpperCase()};`,
	};
}

export function edgeId(): string {
	return hex(crypto.getRandomValues(new Uint8Array(16))).toLowerCase();
}

function hex(bytes: Uint8Array): string {
	return Array.from(bytes, (v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Public Edge client constants and five-minute Windows FILETIME buckets; no user key. */
export async function edgeSignature(now = Date.now()): Promise<string> {
	const seconds = BigInt(Math.floor(now / 1000)) + 11644473600n;
	const ticks = (seconds / 300n) * 300n * 10000000n;
	const message = encoder.encode(`Copyright (C) Microsoft Corporation. All rights reserved.${ticks}${EDGE_TOKEN}`);
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', message));
	const view = new DataView(digest.buffer);
	const keyA = (view.getUint32(0, true) | 1) >>> 0;
	const keyB = (view.getUint32(4, true) | 1) >>> 0;
	const padded = new Uint8Array(Math.ceil(message.length / 8) * 8);
	padded.set(message);
	const words = new DataView(padded.buffer);
	let swapSum = 0;
	let lastSwap = 0;
	let mix = 0;
	let mixSum = 0;
	for (let i = 0; i < padded.length; i += 8) {
		const a = words.getUint32(i, true);
		const b = words.getUint32(i + 4, true);
		const firstSwap = swapTerm(a, keyA, [0xef0569fb, 0x76f50f34, 0xc3efea97]);
		lastSwap = swapTerm(b, keyB, [0xc31713db, 0x1881ce3c, 0x35bd1ec9]);
		swapSum = (swapSum + firstSwap + lastSwap) >>> 0;
		mix = multiply(Math.imul(mix + a, keyA), [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]);
		mixSum = (mixSum + mix) >>> 0;
		mix = multiply(Math.imul(mix + b, keyB), [0xa27416f5, 0xd38396ff, 0x7c932b89, 0xbfa49f69]);
		mixSum = (mixSum + mix) >>> 0;
	}
	const checksum = new Uint8Array(8);
	const checksumView = new DataView(checksum.buffer);
	checksumView.setUint32(0, lastSwap ^ mix, true);
	checksumView.setUint32(4, swapSum ^ mixSum, true);
	return `${hex(checksum)}-${hex(digest)}`;
}

function swap(v: number): number {
	return ((v << 16) | (v >>> 16)) >>> 0;
}

function swapTerm(word: number, key: number, [a, b, c]: number[]): number {
	const sum = Math.imul(word, key) + Math.imul(swap(word), a);
	const product = Math.imul(swap(sum), b) >>> 0;
	return (Math.imul(swap(product), c) + product) >>> 0;
}

function multiply(value: number, factors: number[]): number {
	for (const factor of factors) value = Math.imul(swap(value), factor) >>> 0;
	return value;
}

export function escapeXml(text: string): string {
	return text.replace(/[<>&"']/g, (s) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[s]!);
}

/** Split escaped UTF-8 at code point/entity boundaries, not JS code units. */
export function edgeTextChunks(text: string, limit = 4096): string[] {
	const chunks: string[] = [];
	let chunk = '';
	let size = 0;
	for (const character of text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/g, ' ')) {
		const escaped = escapeXml(character);
		const length = encoder.encode(escaped).length;
		if (size + length > limit) {
			chunks.push(chunk);
			chunk = '';
			size = 0;
		}
		chunk += escaped;
		size += length;
	}
	if (chunk) chunks.push(chunk);
	return chunks;
}

/** Binary header length excludes its own two bytes; audio starts at 2 + N. */
export function parseEdgeFrame(frame: string | Uint8Array): { path: string; headers: Record<string, string>; audio?: Uint8Array } {
	let text: string;
	let audio: Uint8Array | undefined;
	if (typeof frame === 'string') {
		const end = frame.indexOf('\r\n\r\n');
		if (end < 0 || end > 8192) throw new Error('Invalid frame');
		text = frame.slice(0, end);
	} else {
		if (frame.byteLength < 2) throw new Error('Invalid frame');
		const n = new DataView(frame.buffer, frame.byteOffset, frame.byteLength).getUint16(0, false);
		if (n === 0 || n > 8192 || n + 2 > frame.byteLength) throw new Error('Invalid frame');
		text = decoder.decode(frame.subarray(2, n + 2));
		if (!text.endsWith('\r\n')) throw new Error('Invalid frame');
		audio = frame.subarray(n + 2);
	}
	const headers: Record<string, string> = Object.create(null);
	for (const line of text.split('\r\n')) {
		if (!line) continue;
		const colon = line.indexOf(':');
		if (colon < 1) throw new Error('Invalid frame');
		const name = line.slice(0, colon).toLowerCase();
		if (!/^[a-z0-9-]+$/.test(name) || name in headers) throw new Error('Invalid frame');
		headers[name] = line.slice(colon + 1).trim();
	}
	const path = headers.path;
	if (!path || (audio !== undefined && path !== 'audio')) throw new Error('Invalid frame');
	if (audio !== undefined) {
		const type = headers['content-type'];
		if (type !== 'audio/mpeg' && !(type === undefined && audio.length === 0)) throw new Error('Invalid frame');
		if (type === 'audio/mpeg' && audio.length === 0) throw new Error('Invalid frame');
	}
	return { path, headers, audio };
}
