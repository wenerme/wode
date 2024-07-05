// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { TypedArray } from '../io/ArrayBuffers';
import { getGlobalThis } from '../runtime/getGlobalThis';
import { getNodeCrypto } from './getNodeCrypto';

const globalThis = getGlobalThis();

// chrome 11+, safari 5+, nodejs 17.4+
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
export let getRandomValues: <T extends Exclude<TypedArray, Float32Array | Float64Array>>(typedArray: T) => T =
  globalThis.crypto?.getRandomValues?.bind(globalThis.crypto) ||
  (globalThis as any).msCrypto?.getRandomValues?.bind((globalThis as any).msCrypto) ||
  (() => {
    throw new Error('[getRandomValues]: No secure random number generator available.');
  });

function _getRandomValues<T extends Exclude<TypedArray, Float32Array | Float64Array>>(buf: T) {
  const nodeCrypto = getNodeCrypto();
  // avoid type error
  let wc = nodeCrypto?.webcrypto as any;
  if (wc?.getRandomValues) {
    getRandomValues = wc.getRandomValues?.bind(nodeCrypto?.webcrypto);
    return wc.getRandomValues(buf);
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
  throw new Error('[getRandomValues]: No secure random number generator available.');
}
