// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let nodeCrypto: Awaited<typeof import('node:crypto')>;
// globalThis.process?.release?.name

// typedoc error
if (!process.browser) {
  try {
    if (typeof require === 'undefined') {
      void import('node:crypto').then((v) => (nodeCrypto = v.default));
    } else {
      nodeCrypto = require('node:crypto');
    }
  } catch (e) {}
}

export let getRandomValues: <T extends Exclude<NodeJS.TypedArray, Float32Array | Float64Array>>(typedArray: T) => T =
  globalThis.crypto?.getRandomValues?.bind(globalThis.crypto) ||
  (globalThis as any).msCrypto?.getRandomValues?.bind((globalThis as any).msCrypto) ||
  _getRandomValues;

function _getRandomValues<T extends Exclude<NodeJS.TypedArray, Float32Array | Float64Array>>(buf: T) {
  if (nodeCrypto?.webcrypto?.getRandomValues) {
    getRandomValues = nodeCrypto?.webcrypto?.getRandomValues?.bind(nodeCrypto?.webcrypto);
    return nodeCrypto.webcrypto.getRandomValues(buf);
  }
  if (nodeCrypto?.randomBytes) {
    if (!(buf instanceof Uint8Array)) {
      throw new TypeError('expected Uint8Array');
    }
    if (buf.length > 65536) {
      const e: any = new Error();
      e.code = 22;
      e.message = `Failed to execute 'getRandomValues' on 'Crypto': The ArrayBufferView's byte length (${buf.length}) exceeds the number of bytes of entropy available via this API (65536).`;
      e.name = 'QuotaExceededError';
      throw e;
    }
    const bytes = nodeCrypto.randomBytes(buf.length);
    buf.set(bytes);
    return buf;
  }
  throw new Error('No secure random number generator available.');
}
