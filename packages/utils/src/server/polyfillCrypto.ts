export async function polyfillCrypto() {
  if ('crypto' in globalThis) {
    return false;
  }
  globalThis.crypto = (await import('node:crypto')).webcrypto as Crypto;
  return true;
}
