import type { BufferEncoding, ByteString } from 'just-bash';

type WriteOptions = { encoding?: BufferEncoding } | BufferEncoding | undefined;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const latin1ChunkSize = 0x8000;
const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function resolveEncoding(options: WriteOptions): BufferEncoding {
	return (typeof options === 'string' ? options : options?.encoding) ?? 'utf8';
}

export function encodedFileContentByteLength(content: string | Uint8Array, options?: WriteOptions): number {
	if (content instanceof Uint8Array) return content.byteLength;
	const encoding = resolveEncoding(options).toLowerCase() as BufferEncoding;
	switch (encoding) {
		case 'binary':
		case 'latin1':
		case 'ascii':
			return content.length;
		case 'hex': {
			let start = 0;
			let end = content.length;
			while (start < end && /\s/u.test(content[start]!)) start++;
			while (end > start && /\s/u.test(content[end - 1]!)) end--;
			return Math.ceil((end - start) / 2);
		}
		case 'base64': {
			let characters = 0;
			let padding = 0;
			for (const character of content) {
				if (/\s/u.test(character)) continue;
				characters++;
				if (character === '=') padding++;
			}
			return Math.max(0, Math.floor((characters * 6) / 8) - Math.min(padding, 2));
		}
		case 'utf-8':
		case 'utf8':
			return utf8ByteLength(content);
	}
}

export function encodeFileContent(content: string | Uint8Array, options?: WriteOptions): Uint8Array {
	if (content instanceof Uint8Array) return content.slice();
	const encoding = resolveEncoding(options).toLowerCase() as BufferEncoding;
	switch (encoding) {
		case 'binary':
		case 'latin1':
			return bytesFromCodeUnits(content, 0xff);
		case 'ascii':
			return bytesFromCodeUnits(content, 0x7f);
		case 'base64':
			return decodeBase64(content);
		case 'hex':
			return decodeHex(content);
		case 'utf-8':
		case 'utf8':
			return textEncoder.encode(content);
	}
}

export function decodeFileContent(bytes: Uint8Array, encoding: BufferEncoding = 'utf8'): string {
	switch (encoding.toLowerCase() as BufferEncoding) {
		case 'binary':
		case 'latin1':
			return latin1FromUint8Array(bytes);
		case 'ascii':
			return asciiFromUint8Array(bytes);
		case 'base64':
			return encodeBase64(bytes);
		case 'hex':
			return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
		case 'utf-8':
		case 'utf8':
			return textDecoder.decode(bytes);
	}
}

export function byteStringFromUint8Array(bytes: Uint8Array): ByteString {
	return latin1FromUint8Array(bytes) as unknown as ByteString;
}

export function concatBytes(...chunks: readonly Uint8Array[]): Uint8Array {
	const output = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.byteLength, 0));
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return output;
}

export function utf8ByteLength(value: string): number {
	let bytes = 0;
	for (const character of value) {
		const codePoint = character.codePointAt(0)!;
		bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
	}
	return bytes;
}

export function truncateUtf8(
	value: string,
	maxBytes: number,
): { value: string; byteLength: number; truncated: boolean } {
	const bytes = textEncoder.encode(value);
	if (bytes.byteLength <= maxBytes) return { value, byteLength: bytes.byteLength, truncated: false };
	let end = Math.max(0, maxBytes);
	const decoder = new TextDecoder('utf-8', { fatal: true });
	while (end > 0) {
		try {
			const truncated = decoder.decode(bytes.subarray(0, end));
			return { value: truncated, byteLength: end, truncated: true };
		} catch {
			end--;
		}
	}
	return { value: '', byteLength: 0, truncated: true };
}

function latin1FromUint8Array(bytes: Uint8Array): string {
	let output = '';
	for (let offset = 0; offset < bytes.byteLength; offset += latin1ChunkSize) {
		output += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.byteLength, offset + latin1ChunkSize)));
	}
	return output;
}

function asciiFromUint8Array(bytes: Uint8Array): string {
	let output = '';
	for (let offset = 0; offset < bytes.byteLength; offset += latin1ChunkSize) {
		output += String.fromCharCode(
			...Array.from(
				bytes.subarray(offset, Math.min(bytes.byteLength, offset + latin1ChunkSize)),
				(byte) => byte & 0x7f,
			),
		);
	}
	return output;
}

function bytesFromCodeUnits(value: string, mask: number): Uint8Array {
	const bytes = new Uint8Array(value.length);
	for (let index = 0; index < value.length; index++) bytes[index] = value.charCodeAt(index) & mask;
	return bytes;
}

function decodeHex(value: string): Uint8Array {
	const normalized = value.trim();
	if (normalized.length % 2 !== 0 || !/^[0-9a-f]*$/iu.test(normalized)) {
		throw new Error('Invalid hex file content');
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let index = 0; index < bytes.length; index++)
		bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
	return bytes;
}

function decodeBase64(value: string): Uint8Array {
	const normalized = value.replace(/\s+/gu, '');
	if (normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(normalized)) {
		throw new Error('Invalid base64 file content');
	}
	const unpadded = normalized.replace(/=+$/u, '');
	const bytes: number[] = [];
	let accumulator = 0;
	let bits = 0;
	for (const character of unpadded) {
		const value = base64Alphabet.indexOf(character);
		if (value < 0) throw new Error('Invalid base64 file content');
		accumulator = (accumulator << 6) | value;
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			bytes.push((accumulator >> bits) & 0xff);
		}
	}
	return Uint8Array.from(bytes);
}

function encodeBase64(bytes: Uint8Array): string {
	let output = '';
	for (let index = 0; index < bytes.byteLength; index += 3) {
		const first = bytes[index] ?? 0;
		const second = bytes[index + 1] ?? 0;
		const third = bytes[index + 2] ?? 0;
		const chunk = (first << 16) | (second << 8) | third;
		output += base64Alphabet[(chunk >> 18) & 0x3f];
		output += base64Alphabet[(chunk >> 12) & 0x3f];
		output += index + 1 < bytes.byteLength ? base64Alphabet[(chunk >> 6) & 0x3f] : '=';
		output += index + 2 < bytes.byteLength ? base64Alphabet[chunk & 0x3f] : '=';
	}
	return output;
}
