export function sha1(s: string | BufferSource) {
  return digestOf('SHA-1', s);
}

export function sha256(s: string | BufferSource) {
  return digestOf('SHA-256', s);
}

export function sha384(s: string | BufferSource) {
  return digestOf('SHA-384', s);
}

export function sha512(s: string | BufferSource) {
  return digestOf('SHA-512', s);
}

function digestOf(a: string, s: string | BufferSource) {
  return crypto.subtle.digest(a, bufferOf(s));
}

function bufferOf(s: string | BufferSource) {
  // ArrayBuffer, TypedArray, DataView
  if (typeof s === 'string') {
    return new TextEncoder().encode(s);
  }
  return s;
}
