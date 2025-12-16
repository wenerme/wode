import { ArrayBuffers, classOf } from '@wener/utils';
import type { IFileStat, WritableData } from './IFileSystem';

export function resolveData(data: WritableData) {
	let buf: Uint8Array;
	if (typeof data === 'string') {
		buf = ArrayBuffers.toUint8Array(ArrayBuffers.from(data, 'utf8'));
	} else if (data instanceof ArrayBuffer) {
		buf = new Uint8Array(data);
	} else if (data instanceof Uint8Array) {
		buf = data;
	} else {
		throw new Error(`unable to resolve data: ${typeof data} ${classOf(data)}`);
	}
	return buf;
}

export function getPath(f: IFileStat | string) {
	if (typeof f === 'string') {
		return f;
	}
	return f.path;
}
