import { getNodeCrypto } from '../crypto/getNodeCrypto';
import type { TypedArray } from '../io/types';
import { getGlobalThis } from './getGlobalThis';

type RandomValuesArray = Exclude<TypedArray, Float32Array | Float64Array>;
type GetRandomValues = <T extends RandomValuesArray>(typedArray: T) => T;
type RandomBytes = (size: number) => unknown;

const MAX_RANDOM_VALUES_BYTES = 65_536;
const integerTypedArrayTags = new Set([
	'[object Int8Array]',
	'[object Uint8Array]',
	'[object Uint8ClampedArray]',
	'[object Int16Array]',
	'[object Uint16Array]',
	'[object Int32Array]',
	'[object Uint32Array]',
	'[object BigInt64Array]',
	'[object BigUint64Array]',
]);
const globalObject = getGlobalThis() as typeof globalThis & { msCrypto?: unknown };
let implementation =
	bindGetRandomValues(globalObject.crypto) ?? bindGetRandomValues(globalObject.msCrypto) ?? getNodeRandomValues;

// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
export function getRandomValues<T extends RandomValuesArray>(typedArray: T): T {
	return implementation(typedArray);
}

// Keep the public ArrayBufferLike generic while leaving native WebCrypto to enforce its runtime contract.
function bindGetRandomValues(candidate: unknown): GetRandomValues | undefined {
	if (!isObject(candidate)) return undefined;
	const method = Reflect.get(candidate, 'getRandomValues');
	if (typeof method !== 'function') return undefined;

	return <T extends RandomValuesArray>(typedArray: T): T => {
		Reflect.apply(method, candidate, [typedArray]);
		return typedArray;
	};
}

function getNodeRandomValues<T extends RandomValuesArray>(typedArray: T): T {
	const nodeCrypto = getNodeCrypto();
	if (!isObject(nodeCrypto)) {
		throw new Error('[getRandomValues]: No secure random number generator available.');
	}

	const webcrypto = bindGetRandomValues(Reflect.get(nodeCrypto, 'webcrypto'));
	if (webcrypto) {
		implementation = webcrypto;
		return implementation(typedArray);
	}

	const randomBytes = Reflect.get(nodeCrypto, 'randomBytes');
	if (typeof randomBytes === 'function') {
		implementation = createRandomBytesImplementation(nodeCrypto, randomBytes as RandomBytes);
		return implementation(typedArray);
	}

	throw new Error('[getRandomValues]: No secure random number generator available.');
}

function createRandomBytesImplementation(nodeCrypto: object, randomBytes: RandomBytes): GetRandomValues {
	return <T extends RandomValuesArray>(typedArray: T): T => {
		assertIntegerTypedArray(typedArray);
		if (typedArray.byteLength > MAX_RANDOM_VALUES_BYTES) {
			throw createWebCryptoError('The requested length exceeds 65,536 bytes', 'QuotaExceededError', 22);
		}

		const bytes = Reflect.apply(randomBytes, nodeCrypto, [typedArray.byteLength]);
		if (!ArrayBuffer.isView(bytes)) {
			throw new TypeError('[getRandomValues]: randomBytes did not return an ArrayBuffer view.');
		}

		const source = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		if (source.byteLength < typedArray.byteLength) {
			throw new TypeError('[getRandomValues]: randomBytes returned fewer bytes than requested.');
		}
		new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength).set(
			source.subarray(0, typedArray.byteLength),
		);
		return typedArray;
	};
}

function assertIntegerTypedArray(value: unknown): asserts value is RandomValuesArray {
	if (!ArrayBuffer.isView(value) || !integerTypedArrayTags.has(Object.prototype.toString.call(value))) {
		throw createWebCryptoError('The data argument must be an integer-type TypedArray', 'TypeMismatchError', 17);
	}
}

function createWebCryptoError(message: string, name: string, code: number): Error {
	if (typeof DOMException === 'function') return new DOMException(message, name);
	const error = new Error(message) as Error & { code: number };
	error.name = name;
	error.code = code;
	return error;
}

function isObject(value: unknown): value is object {
	return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
