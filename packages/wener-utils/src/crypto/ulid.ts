import { randomString } from '../maths/random';

/**
 * Universally Unique Lexicographically Sortable Identifier
 *
 * @see https://github.com/ulid/spec ulid/spec
 */
export type ULID = (seedTime?: number) => string;

export interface ULIDError extends Error {
	source: string;
}

function createError(message: string): ULIDError {
	const err = new Error(message) as ULIDError;
	err.source = 'ulid';
	return err;
}

// These values should NEVER change. If
// they do, we're no longer making ulids!
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = 2 ** 48 - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * check give {@link str} is a valid ulid
 */
export function isULID(str: string | undefined | null): boolean {
	if (!str) {
		return false;
	}
	// ttttttttttrrrrrrrrrrrrrrrr
	return str.length === 26 && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(str);
}

function replaceCharAt(str: string, index: number, char: string) {
	if (index > str.length - 1) {
		return str;
	}
	return str.substr(0, index) + char + str.substr(index + 1);
}

function incrementBase32(str: string): string {
	let done: string | undefined;
	let index = str.length;
	let char: string | undefined;
	let charIndex: number;
	const maxCharIndex = ENCODING_LEN - 1;
	while (!done && index-- >= 0) {
		char = str[index];
		charIndex = ENCODING.indexOf(char);
		if (charIndex === -1) {
			throw createError('incorrectly encoded string');
		}
		if (charIndex === maxCharIndex) {
			str = replaceCharAt(str, index, ENCODING[0]);
			continue;
		}
		done = replaceCharAt(str, index, ENCODING[charIndex + 1]);
	}
	if (typeof done === 'string') {
		return done;
	}
	throw createError('cannot increment this string');
}

function encodeTime(now: number, len: number): string {
	if (Number.isNaN(now)) {
		throw new Error(`${now} must be a number`);
	}
	if (now > TIME_MAX) {
		throw createError(`cannot encode time greater than ${TIME_MAX}`);
	}
	if (now < 0) {
		throw createError('time must be positive');
	}
	if (!Number.isInteger(now)) {
		throw createError('time must be an integer');
	}
	let mod: number;
	let str = '';
	for (; len > 0; len--) {
		mod = now % ENCODING_LEN;
		str = ENCODING.charAt(mod) + str;
		now = (now - mod) / ENCODING_LEN;
	}
	return str;
}

/**
 * extract time & random from ulid
 *
 * @throws ULIDError
 */
export function parseULID(id: string): { timestamp: number; random: string } {
	if (id.length !== TIME_LEN + RANDOM_LEN) {
		throw createError('malformed ulid');
	}
	const time = id
		.substr(0, TIME_LEN)
		.split('')
		.reverse()
		.reduce((carry, char, index) => {
			const encodingIndex = ENCODING.indexOf(char);
			if (encodingIndex === -1) {
				throw createError(`invalid character found: ${char}`);
			}
			return (carry += encodingIndex * ENCODING_LEN ** index);
		}, 0);
	if (time > TIME_MAX) {
		throw createError('malformed ulid, timestamp too large');
	}
	return { timestamp: time, random: id.substring(TIME_LEN) };
}

/**
 * create a ulid generator
 */
export function createULID({
	monotonic = true,
	random = Math.random,
	now = Date.now,
}: {
	monotonic?: boolean;
	now?: () => number;
	random?: () => number;
} = {}) {
	const encodeRandom = (len: number) => randomString(random, ENCODING, len);

	if (!monotonic) {
		return function ulid(seedTime?: number): string {
			seedTime ||= now();
			return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN);
		};
	}

	let lastTime: number = 0;
	let lastRandom: string;
	return function ulid(seedTime?: number): string {
		seedTime ||= now();
		if (seedTime <= lastTime && lastRandom) {
			const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
			return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
		}
		lastTime = seedTime;
		const newRandom = (lastRandom = encodeRandom(RANDOM_LEN));
		return encodeTime(seedTime, TIME_LEN) + newRandom;
	};
}

/**
 * default monotonic ulid generator
 */
export const ulid: ULID = createULID();
