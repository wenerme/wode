export async function polyfill() {
  if (!('crypto' in globalThis)) {
    (globalThis as any).crypto = (await import('node:crypto')).webcrypto;
  }
}
