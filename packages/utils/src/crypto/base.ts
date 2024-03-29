/**
 * hex string
 */
export function hex(s: Uint8Array | ArrayBuffer) {
  return Array.from(new Uint8Array(s))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}
