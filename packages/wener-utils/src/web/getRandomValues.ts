import { getNodeCrypto } from '../crypto/getNodeCrypto';
import type { TypedArray } from '../io/types';
import { getGlobalThis } from './getGlobalThis';

type RandomValuesArray = Exclude<TypedArray, Float32Array | Float64Array>;

const _globalThis = getGlobalThis();

// chrome 11+, safari 5+, nodejs 17.4+
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
export let getRandomValues: <T extends RandomValuesArray>(typedArray: T) => T =
	((_globalThis.crypto?.getRandomValues?.bind(_globalThis.crypto) ||
		(_globalThis as any).msCrypto?.getRandomValues?.bind((_globalThis as any).msCrypto) ||
		_getRandomValues) as <T extends RandomValuesArray>(typedArray: T) => T);

function _getRandomValues<T extends RandomValuesArray>(buf: T): T {
	const nodeCrypto = getNodeCrypto() as (typeof import('node:crypto') & { webcrypto?: Crypto }) | undefined;
	const wc = nodeCrypto?.webcrypto;
	if (wc?.getRandomValues) {
		getRandomValues = wc.getRandomValues.bind(wc) as <T extends RandomValuesArray>(typedArray: T) => T;
		return getRandomValues(buf);
	}
	if (nodeCrypto?.randomBytes) {
		if (!(buf instanceof Uint8Array)) {
			throw new TypeError('expected Uint8Array');
		}
		if (buf.length > 65536) {
			const e = new Error(
				`Failed to execute 'getRandomValues' on 'Crypto': The ArrayBufferView's byte length (${buf.length}) exceeds the number of bytes of entropy available via this API (65536).`,
			) as Error & { code: number; name: string };
			e.code = 22;
			e.name = 'QuotaExceededError';
			throw e;
		}
		const bytes = nodeCrypto.randomBytes(buf.length);
		buf.set(bytes);
		return buf;
	}
	throw new Error('[getRandomValues]: No secure random number generator available.');
}
