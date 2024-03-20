import { getGlobalThis } from '../../runtime/getGlobalThis';

export async function polyfillCrypto() {
  const globalThis = getGlobalThis();
  if ('crypto' in globalThis) {
    return false;
  }
  (globalThis as any).crypto = (await import('node:crypto')).webcrypto as Crypto;
  return true;
}
