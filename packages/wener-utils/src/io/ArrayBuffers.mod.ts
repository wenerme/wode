import { classOf } from '../langs/classOf';
import { getGlobalThis } from '../web/getGlobalThis';
import { decodeBase64ToUint8Array, encodeArrayBufferToBase64 } from './base64';
import { isBuffer } from './isBuffer';
import type { Bytes, TypedArray } from './types';

/**
 * Various utils to work with {@link ArrayBuffer}
 *
 * @see https://github.com/tc39/proposal-resizablearraybuffer
 */
/*
Uint8Array to/from base64 and hex
Stage 3
Uint8Array.fromBase64, Uint8Array.prototype.toBase64
Uint8Array.fromHex, Uint8Array.prototype.toHex
https://github.com/tc39/proposal-arraybuffer-base64

Unicode routines (UTF8, UTF16, UTF32) and Base64
used by Node.js, WebKit/Safari, Ladybird, Cloudflare Workers, Bun
https://github.com/simdutf/simdutf
 */

/*
In-Place Resizable and Growable ArrayBuffers
Stage 4
Chrome 111, Nodejs 20, Safari 16.4

SharedArrayBuffer & ArrayBuffer
constructor(byteLength, {maxByteLength})
prototype.resize(newByteLength)
prototype.slice(start, end)
prototype.{resizable,maxByteLength}
https://github.com/tc39/proposal-resizablearraybuffer
   */

export type BinaryStringEncoding =
	| 'ascii'
	| 'utf16le'
	// | 'utf-16le'
	| 'ucs2'
	| 'ucs-2'
	| 'base64'
	| 'base64url'
	| 'latin1'
	| 'binary'
	| 'utf8'
	| 'utf-8'
	| 'hex';

let nativeBufferAllowed: boolean = true;
let isBufferAvailable: undefined | boolean;
let textEncoder: TextEncoder;
let textDecoder: TextDecoder;

function decode(v: AllowSharedBufferSource): string {
	// need icu full data
	// if (encoding) return new TextDecoder(encoding).decode(v);
	return (textDecoder ||= new TextDecoder()).decode(v);
}

function encode(v: string): Bytes;
function encode<T>(v: string | T): T | Bytes;
function encode<T>(v: string | T): T | Bytes {
	if (typeof v === 'string') {
		return (textEncoder ||= new TextEncoder()).encode(v);
	}
	return v;
}

/**
 * isNativeBufferAvailable check if the native {@link Buffer} is available
 */
export function isNativeBufferAvailable(): boolean {
	// eslint-disable-next-line no-return-assign
	return (isBufferAvailable ??= !(getGlobalThis().Buffer as any)?.isPollyfill?.());
}

export function isNativeBufferAllowed(): boolean {
	return Boolean(nativeBufferAllowed && isBufferAvailable);
}

export function setNativeBufferAllowed(v: boolean): void {
	nativeBufferAllowed = v;
}

export function isArrayBuffer(v: unknown): v is ArrayBuffer {
	return v instanceof ArrayBuffer;
}

/**
 * slice the given view with the given offset and length, will handle the {@link Buffer} as well
 *
 * @see {@link https://nodejs.org/api/buffer.html#bufslicestart-end Buffer.slice}
 */
export function slice<T extends TypedArray>(o: T, start?: number, end?: number): T {
	// NodeJS Buffer slice is not the same as UInt8Array slice
	// https://nodejs.org/api/buffer.html#bufslicestart-end
	if (isBuffer(o)) {
		return Uint8Array.prototype.slice.call(o, start, end) as T;
	}
	return o.slice(start, end) as T;
}

/**
 * asView convert the given value to given {@link TypedArray} view
 *
 * TypedArray can be {@link Buffer}, will avoid copy
 */
export function asView<C extends ArrayBufferViewConstructor<unknown>>(
	TypedArray: C,
	v: BufferSource | TypedArray,
	byteOffset?: number,
	byteLength?: number,
): InstanceType<C> {
	if (v instanceof TypedArray && (byteOffset ?? 0) === 0 && byteLength === undefined) {
		return v as InstanceType<C>;
	}
	if (ArrayBuffer.isView(v) || isBuffer(v)) {
		if (isNativeBufferAllowed() && (TypedArray as any) === Buffer) {
			// new Buffer() is deprecated
			return Buffer.from(v.buffer, byteOffset, byteLength) as InstanceType<C>;
		}
		return new TypedArray(v.buffer, v.byteOffset + (byteOffset ?? 0), byteLength ?? v.byteLength) as InstanceType<C>;
	}
	return new TypedArray(v, byteOffset, byteLength) as InstanceType<C>;
}

/**
 * toString convert the given {@link BufferSource} to string
 */
export function toString(source: BufferSource | TypedArray | string, encoding: BinaryStringEncoding = 'utf8'): string {
	if (typeof source === 'string') {
		switch (encoding) {
			case 'base64':
				return btoa(source);
			case 'utf-8':
			case 'utf8':
				return source;
			default:
				throw new Error(`[ArrayBuffers.toString] Unsupported encoding for string: ${encoding}`);
		}
	}

	const u8 = asView(Uint8Array, source);
	if (isNativeBufferAllowed()) {
		return Buffer.from(u8).toString(encoding);
	}

	// reference: https://github.com/feross/buffer/blob/master/index.js
	switch (encoding) {
		case 'hex': {
			return toHexString(u8);
		}
		case 'base64': {
			return toBase64(u8);
		}
		case 'utf8':
		case 'utf-8':
			return decode(source);
		case 'ascii': {
			return toAsciiString(u8);
		}
		case 'latin1':
		case 'binary': {
			return toLatin1String(u8);
		}
		case 'ucs2':
		case 'ucs-2':
		case 'utf16le': {
			return toUtf16LeString(u8);
		}
		default:
			throw new Error(`[ArrayBuffers.toString] Unknown encoding: ${encoding}`);
	}
}

/**
 * Normalize encoding string to standard form
 * @param encoding - The encoding string to normalize
 * @returns Normalized encoding or undefined if invalid
 */
function normalizeEncoding(encoding: string | undefined): BinaryStringEncoding | undefined {
	switch (encoding?.toLowerCase()) {
		case 'utf-8':
		case 'utf8':
			return 'utf8';
		case 'utf-16le':
		case 'ucs2':
		case 'ucs-2':
			return 'utf16le';
		case 'hex':
		case 'ascii':
		case 'latin1':
		case 'binary':
		case 'base64':
		case 'utf16le':
			return encoding as BinaryStringEncoding;
		default:
			return undefined;
	}
}

/**
 * Check if the given string is a supported character encoding
 * @param v - The string to check
 * @returns True if the encoding is supported, false otherwise
 */
export function isEncoding(v?: string): v is BinaryStringEncoding {
	return normalizeEncoding(v) !== undefined;
}

export function toJSON<T = any>(v: BufferSource | string, reviver?: (this: any, key: string, value: any) => any): T {
	return JSON.parse(toString(v), reviver);
}

/**
 * from convert the given value to {@link ArrayBuffer} like
 */
export function from(
	src: string | BufferSource | ArrayLike<number> | Iterable<number>,
	encoding?: BinaryStringEncoding,
): ArrayBuffer | TypedArray;
/**
 * from convert the given value to {@link TypedArray}
 */
export function from<C extends ArrayBufferViewConstructor<unknown>>(
	src: string | BufferSource | ArrayLike<number> | Iterable<number>,
	encoding: BinaryStringEncoding,
	TypedArray: C,
): InstanceType<C>;
export function from(
	src: string | BufferSource | ArrayLike<number> | Iterable<number>,
	encoding: BinaryStringEncoding = 'utf8',
	view?: any,
): any {
	if (!src) {
		return new (view || ArrayBuffer)(0);
	}

	if (isBufferSource(src)) {
		return view ? asView(view, src) : src;
	}

	// Array<number> | Iterable<number>
	if ((typeof src !== 'string' && isIterable(src)) || Array.isArray(src)) {
		return (view || Uint8Array).from(src as ArrayLike<number>);
	}

	if (view) {
		return asView(view, from(src, encoding));
	}

	if (typeof src === 'string') {
		if (isNativeBufferAllowed()) {
			return Buffer.from(src, encoding);
		}

		switch (encoding) {
			case 'utf-8':
			case 'utf8':
				return encode(src).buffer;
			case 'base64':
				return fromBase64(src);
			case 'hex':
				return fromHex(src);
			default:
				throw new Error(`ArrayBuffers.from unsupported encoding: ${encoding}`);
		}
	}

	const type = classOf(src);
	throw new TypeError(`ArrayBuffers.from unsupported type ${type}`);
}

/**
 * concat the given {@link BufferSource} to a new {@link ArrayBuffer}
 */
export function concat(buffers: Array<BufferSource>, result?: ArrayBuffer, offset = 0): ArrayBuffer {
	if (!Array.isArray(buffers) || buffers.length === 0) {
		return new ArrayBuffer(0);
	}

	const length = buffers.reduce((a, b) => a + (b?.byteLength ?? 0), 0);
	const r = result ? new Uint8Array(result) : new Uint8Array(length);

	for (const buffer of buffers) {
		if (!buffer?.byteLength) continue;

		let n: Uint8Array;
		if (buffer instanceof ArrayBuffer) {
			n = new Uint8Array(buffer);
		} else if (ArrayBuffer.isView(buffer)) {
			n = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		} else {
			throw new Error(`ArrayBuffers.concat unsupported type ${classOf(buffer)}`);
		}

		r.set(n, offset);
		offset += buffer.byteLength;
	}

	return r.buffer;
}

export function fromBase64(v: string, encoding?: undefined): Bytes;
export function fromBase64(v: string, encoding: BinaryStringEncoding): string;
export function fromBase64(v: string, encoding?: BinaryStringEncoding): Bytes | string {
	if (encoding) {
		return toString(fromBase64(v), encoding);
	}

	if ('fromBase64' in Uint8Array && typeof Uint8Array.fromBase64 === 'function') {
		return Uint8Array.fromBase64(v);
	}

	if (isNativeBufferAllowed()) {
		return Buffer.from(v, 'base64');
	}

	// Clean the base64 string by removing invalid characters
	return decodeBase64ToUint8Array(v.replace(/[^0-9a-zA-Z=+/_]/g, ''));
}

export function fromHex(v: string, encoding?: undefined): Bytes;
export function fromHex(v: string, encoding: BinaryStringEncoding): string;
export function fromHex(v: string, encoding?: BinaryStringEncoding): Uint8Array | string {
	if (encoding) {
		return toString(fromHex(v), encoding);
	}

	if ('fromHex' in Uint8Array && typeof Uint8Array.fromHex === 'function') {
		return Uint8Array.fromHex(v);
	}

	if (isNativeBufferAllowed()) {
		return Buffer.from(v, 'hex');
	}

	// Handle odd-length hex strings by padding with leading zero
	const cleanHex = v.length % 2 === 1 ? '0' + v : v;
	const matches = cleanHex.match(/.{1,2}/g);
	if (!matches) {
		throw new Error('Invalid hex string');
	}
	const num = matches.map((byte) => parseInt(byte, 16));
	return new Uint8Array(num);
}

/**
 * toBase64 convert the given {@link BufferSource} to base64 string
 * @param source if string, will be encoded as utf8
 */
export function toBase64(source: BufferSource | string): string {
	source = encode(source);

	if ('toBase64' in Uint8Array.prototype) {
		return (toUint8Array(source) as Uint8Array2).toBase64();
	}

	if (isNativeBufferAllowed()) {
		return Buffer.from(asView(Uint8Array, source)).toString('base64');
	}

	return encodeArrayBufferToBase64(toArrayBuffer(source));
}

export function toHex(v: BufferSource | string): string {
	v = encode(v);

	if ('toHex' in Uint8Array.prototype) {
		return (toUint8Array(v) as Uint8Array2).toHex();
	}

	if (isNativeBufferAllowed()) {
		return Buffer.from(asView(Uint8Array, v)).toString('hex');
	}

	return toString(v, 'hex');
}

export function resize(v: ArrayBuffer, newByteLength?: number, maxByteLength?: number): ArrayBuffer {
	if (newByteLength === undefined || newByteLength === null) {
		return v;
	}

	// Chrome 111, Nodejs 20 - use native resize if available
	if ('resize' in v && typeof v.resize === 'function') {
		if ('resizable' in v && v.resizable) {
			if ('maxByteLength' in v && typeof v.maxByteLength === 'number' && v.maxByteLength >= newByteLength) {
				v.resize(newByteLength);
				return v as ArrayBuffer;
			}
		}
	}

	// Fallback: create new buffer and copy data
	const old = v;
	const newBuf = new (ArrayBuffer as ArrayBuffer2Constructor)(newByteLength, { maxByteLength: maxByteLength });
	const oldView = new Uint8Array(old);
	const newView = new Uint8Array(newBuf);
	newView.set(oldView);
	return newBuf;
}

export function toArrayBuffer(v: BufferSource): ArrayBuffer {
	if (v instanceof ArrayBuffer) {
		return v;
	}

	if (ArrayBuffer.isView(v)) {
		if (v.byteOffset > 0) {
			throw new Error('ArrayBuffers.toArrayBuffer does not support view with offset');
		}
		return v.buffer;
	}

	throw new Error(`ArrayBuffers.toArrayBuffer unsupported type ${classOf(v)}`);
}

export function toUint8Array(v: BufferSource): Bytes {
	return asView(Uint8Array, v);
}

/**
 * Allocate a new ArrayBuffer or Uint8Array with optional fill value
 * @param size - The size in bytes to allocate
 * @param fill - Optional fill value (number or string)
 * @param encoding - Encoding for string fill value (default: 'utf8')
 * @returns ArrayBuffer or Uint8Array
 */
export function alloc(size: number, fill?: string | number, encoding?: BinaryStringEncoding): ArrayBuffer | Bytes {
	if (fill !== undefined) {
		if (typeof fill === 'number') {
			return new Uint8Array(size).fill(fill);
		}
		// Convert string to buffer and slice to size
		// https://stackoverflow.com/questions/73994091
		return asView(Uint8Array, from(fill, encoding)).slice(0, size);
	}
	return new ArrayBuffer(size);
}

type ArrayBufferViewConstructor<T> = new (buffer: ArrayBufferLike, byteOffset?: number, byteLength?: number) => T;

// Helper functions for string conversion
/**
 * Convert Uint8Array to hex string efficiently
 * @param u8 - The Uint8Array to convert
 * @returns Hex string representation
 */
function toHexString(u8: Uint8Array): string {
	let result = '';
	for (let i = 0; i < u8.length; i++) {
		result += hexLookupTable[u8[i]];
	}
	return result;
}

/**
 * Convert Uint8Array to ASCII string
 * @param u8 - The Uint8Array to convert
 * @returns ASCII string representation
 */
function toAsciiString(u8: Uint8Array): string {
	let result = '';
	for (let i = 0; i < u8.length; i++) {
		result += String.fromCharCode(u8[i] & 0x7f);
	}
	return result;
}

/**
 * Convert Uint8Array to Latin1 string
 * @param u8 - The Uint8Array to convert
 * @returns Latin1 string representation
 */
function toLatin1String(u8: Uint8Array): string {
	let result = '';
	for (let i = 0; i < u8.length; i++) {
		result += String.fromCharCode(u8[i]);
	}
	return result;
}

/**
 * Convert Uint8Array to UTF-16LE string
 * @param u8 - The Uint8Array to convert
 * @returns UTF-16LE string representation
 */
function toUtf16LeString(u8: Uint8Array): string {
	let result = '';
	// If length is odd, the last 8 bits must be ignored (same as node.js)
	for (let i = 0; i < u8.length - 1; i += 2) {
		result += String.fromCharCode(u8[i] + u8[i + 1] * 256);
	}
	return result;
}

// base16 lookup table for efficient hex conversion
const hexLookupTable = (function () {
	const alphabet = '0123456789abcdef';
	const table = new Array(256);
	for (let i = 0; i < 16; ++i) {
		const i16 = i * 16;
		for (let j = 0; j < 16; ++j) {
			table[i16 + j] = alphabet[i] + alphabet[j];
		}
	}
	return table;
})();

// avoid declare global

interface Uint8Array2 extends Uint8Array {
	toBase64(): string;

	toHex(): string;
}

type IArrayBuffer = (ArrayBuffer | SharedArrayBuffer) & {
	resize(newByteLength: number): void;
	resizable: boolean;
	maxByteLength: number;
};

interface ArrayBuffer2Constructor {
	new (byteLength: number, opts?: { maxByteLength?: number }): ArrayBuffer;
}

// Helper functions for internal use
function isIterable<T>(obj: unknown): obj is Iterable<T> {
	return obj != null && typeof (obj as any)?.[Symbol.iterator] === 'function';
}

function isBufferSource(value: unknown): value is BufferSource {
	return ArrayBuffer.isView(value) || value instanceof ArrayBuffer;
}

/**
 * Check if two BufferSources are equal
 * @param a - First buffer source
 * @param b - Second buffer source
 * @returns True if buffers are equal, false otherwise
 */
export function equals(a: BufferSource, b: BufferSource): boolean {
	if (a === b) return true;
	const aView = asView(Uint8Array, a);
	const bView = asView(Uint8Array, b);

	if (aView.length !== bView.length) {
		return false;
	}

	for (let i = 0; i < aView.length; i++) {
		if (aView[i] !== bView[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Compare two BufferSources lexicographically
 * @param a - First buffer source
 * @param b - Second buffer source
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: BufferSource, b: BufferSource): number {
	if (a === b) return 0;
	const aView = asView(Uint8Array, a);
	const bView = asView(Uint8Array, b);

	const minLength = Math.min(aView.length, bView.length);

	for (let i = 0; i < minLength; i++) {
		if (aView[i] < bView[i]) return -1;
		if (aView[i] > bView[i]) return 1;
	}

	return aView.length - bView.length;
}

/**
 * Check if a BufferSource starts with another BufferSource
 * @param buffer - The buffer to check
 * @param prefix - The prefix to check for
 * @returns True if buffer starts with prefix, false otherwise
 */
export function startsWith(buffer: BufferSource, prefix: BufferSource): boolean {
	const bufferView = asView(Uint8Array, buffer);
	const prefixView = asView(Uint8Array, prefix);

	if (prefixView.length > bufferView.length) {
		return false;
	}

	for (let i = 0; i < prefixView.length; i++) {
		if (bufferView[i] !== prefixView[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Check if a BufferSource ends with another BufferSource
 * @param buffer - The buffer to check
 * @param suffix - The suffix to check for
 * @returns True if buffer ends with suffix, false otherwise
 */
export function endsWith(buffer: BufferSource, suffix: BufferSource): boolean {
	const bufferView = asView(Uint8Array, buffer);
	const suffixView = asView(Uint8Array, suffix);

	if (suffixView.length > bufferView.length) {
		return false;
	}

	const offset = bufferView.length - suffixView.length;
	for (let i = 0; i < suffixView.length; i++) {
		if (bufferView[offset + i] !== suffixView[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Find the index of a sub-buffer within a buffer
 * @param buffer - The buffer to search in
 * @param search - The sub-buffer to search for
 * @param startIndex - Starting index for search (default: 0)
 * @returns Index of first occurrence, or -1 if not found
 */
export function indexOf(buffer: BufferSource, search: BufferSource, startIndex = 0): number {
	const bufferView = asView(Uint8Array, buffer);
	const searchView = asView(Uint8Array, search);

	if (searchView.length === 0) return startIndex;
	if (searchView.length > bufferView.length) return -1;

	for (let i = startIndex; i <= bufferView.length - searchView.length; i++) {
		let found = true;
		for (let j = 0; j < searchView.length; j++) {
			if (bufferView[i + j] !== searchView[j]) {
				found = false;
				break;
			}
		}
		if (found) return i;
	}

	return -1;
}

/**
 * Get a sub-buffer from a buffer
 * @param buffer - The source buffer
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive, optional)
 * @returns New Uint8Array containing the sub-buffer
 */
export function subarray(buffer: BufferSource, start: number, end?: number): Uint8Array {
	const view = asView(Uint8Array, buffer);
	return view.subarray(start, end);
}
