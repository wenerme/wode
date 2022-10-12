import { getRandomValues } from './getRandomValues';

type PRNG = () => number;

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
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * check give {@link str} is a valid ulid
 */
export function isULID(str: string): boolean {
  return str?.length === 26 && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(str);
}

function replaceCharAt(str: string, index: number, char: string) {
  if (index > str.length - 1) {
    return str;
  }
  return str.substr(0, index) + char + str.substr(index + 1);
}

function incrementBase32(str: string): string {
  let done;
  let index = str.length;
  let char;
  let charIndex;
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

function randomChar(prng: PRNG): string {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand);
}

function encodeTime(now: number, len: number): string {
  if (isNaN(now)) {
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
  let mod;
  let str = '';
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(len: number, prng: PRNG): string {
  let str = '';
  for (; len > 0; len--) {
    str = randomChar(prng) + str;
  }
  return str;
}

/**
 * extract time & random from ulid
 *
 * @throws ULIDError
 */
export function parseULID(id: string): { time: number; random: string } {
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
        throw createError('invalid character found: ' + char);
      }
      return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
    }, 0);
  if (time > TIME_MAX) {
    throw createError('malformed ulid, timestamp too large');
  }
  return { time, random: id.substring(TIME_LEN) };
}

function createPrng(): PRNG {
  return () => {
    const buffer = new Uint8Array(1);
    getRandomValues(buffer);
    return buffer[0] / 0xff;
  };
}

/**
 * create a ulid generator
 */
export function createULID({
  monotonic = true,
  random = createPrng(),
  now = Date.now,
}: { monotonic?: boolean; now?: () => number; random?: () => number } = {}) {
  if (!monotonic) {
    return function ulid(seedTime?: number): string {
      seedTime ||= now();
      return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN, random);
    };
  }

  let lastTime: number = 0;
  let lastRandom: string;
  return function ulid(seedTime?: number): string {
    seedTime ||= now();
    if (seedTime <= lastTime) {
      const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
      return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
    }
    lastTime = seedTime;
    const newRandom = (lastRandom = encodeRandom(RANDOM_LEN, random));
    return encodeTime(seedTime, TIME_LEN) + newRandom;
  };
}

/**
 * default monotonic ulid generator
 */
export let ulid: ULID = (...args) => {
  if (_real) {
    return _real(...args);
  }
  // delay initialize crypto
  _real = createULID();
  ulid = _real;
  return _real(...args);
};
let _real: ULID;
