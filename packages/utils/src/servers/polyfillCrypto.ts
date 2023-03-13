import { globalThis } from '../isomorphics/globalThis';

export async function polyfillCrypto() {
  if ('crypto' in globalThis) {
    return false;
  }
  (globalThis as any).crypto = (await import('node:crypto')).webcrypto as Crypto;
  return true;
}
