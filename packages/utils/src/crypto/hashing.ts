import { ArrayBuffers } from '../io/ArrayBuffers';

export function sha1(s: BinaryLike, o?: undefined): Promise<Buffer>;
export function sha1(s: BinaryLike, o: 'hex' | 'base64'): Promise<string>;

export function sha1(s: BinaryLike, o?: DigestOptions) {
  return digestOf('SHA-1', s, o);
}

export function sha256(s: BinaryLike, o?: undefined): Promise<Buffer>;
export function sha256(s: BinaryLike, o: 'hex' | 'base64'): Promise<string>;

export function sha256(s: BinaryLike, o?: DigestOptions) {
  return digestOf('SHA-256', s, o);
}

export function sha384(s: BinaryLike, o?: undefined): Promise<Buffer>;
export function sha384(s: BinaryLike, o: 'hex' | 'base64'): Promise<string>;

export function sha384(s: BinaryLike, o?: DigestOptions) {
  return digestOf('SHA-384', s, o);
}

export function sha512(s: BinaryLike, o?: undefined): Promise<Buffer>;
export function sha512(s: BinaryLike, o: 'hex' | 'base64'): Promise<string>;

export function sha512(s: BinaryLike, o?: DigestOptions) {
  return digestOf('SHA-512', s, o);
}

function digestOf(a: string, s: BinaryLike, o?: DigestOptions) {
  let buffer = crypto.subtle.digest(a, binaryOf(s));
  return o ? buffer.then((v) => encode(v, o)) : buffer;
}

export type DigestOptions =
  | 'hex'
  | 'base64'
  | {
      encoding: 'hex' | 'base64';
    };

type BinaryLike = string | BufferSource;

function binaryOf(s: BinaryLike) {
  // ArrayBuffer, TypedArray, DataView
  if (typeof s === 'string') {
    return new TextEncoder().encode(s);
  }
  //  ArrayBuffer, Buffer, TypedArray, DataView
  return s;
}

function encode(buf: BufferSource, o?: DigestOptions) {
  if (o) {
    switch (o) {
      case 'hex':
      case 'base64':
        return ArrayBuffers.toString(buf, o);
    }
  }
  return buf;
}

type StringEncoding = 'hex' | 'base64';
type IsStringCoding<T> = T extends StringEncoding ? true : T extends { encoding: StringEncoding } ? true : false;

export function hmac<O extends DigestOptions>(
  hash: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'sha1' | 'sha256' | 'sha384' | 'sha512',
  key: BinaryLike | CryptoKey,
  data: BinaryLike,
  o?: O,
): Promise<IsStringCoding<O> extends true ? string : Buffer>;

export async function hmac(
  hash: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'sha1' | 'sha256' | 'sha384' | 'sha512',
  key: BinaryLike | CryptoKey,
  data: BinaryLike,
  o?: DigestOptions,
) {
  let ck =
    key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey(
          'raw',
          binaryOf(key),
          {
            name: 'HMAC',
            hash: {
              name: normalizeHash(hash),
            },
          },
          false,
          ['sign'],
        );
  let buffer = await crypto.subtle.sign(
    {
      name: 'HMAC',
      hash: {
        name: hash,
      },
    },
    ck,
    binaryOf(data),
  );

  return encode(buffer, o);
}

function normalizeHash(hash: string) {
  return hash.replace(/^sha/i, 'SHA-');
}
