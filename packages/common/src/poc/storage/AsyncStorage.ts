/**
 *
 * @see https://developer.mozilla.org/docs/Web/API/Storage
 * @see https://localforage.github.io/localForage/
 */
export interface AsyncStorage {
	clear(): Promise<void>;

	getItem(key: string): Promise<string | null>;

	removeItem(key: string): Promise<void>;

	setItem(key: string, value: string): Promise<void>;

	length(): Promise<number>;

	keys(options: { prefix?: string; limit?: number }): Promise<string[]>;
}

type Value =
	| Array<any>
	| ArrayBuffer
	| Blob
	| Float32Array
	| Float64Array
	| Int8Array
	| Int16Array
	| Int32Array
	| Number
	| number
	| Object
	| Uint8Array
	| Uint8ClampedArray
	| Uint16Array
	| Uint32Array
	| string
	| String;
