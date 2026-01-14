import { parseObjectPath, type ObjectKey, type ObjectPath } from './parseObjectPath';

/**
 * Deep set
 *
 * {@link https://github.com/lukeed/dset dset}
 */
export function set<T extends object, V>(obj: T, key: ObjectKey | ObjectPath, val: V, merging = true) {
	const path = parseObjectPath(key);
	let i = 0;
	const len = path.length;
	let current: any = obj;
	let x: any;
	let k: ObjectKey;
	while (i < len) {
		k = path[i++];
		// Security: Prevent prototype pollution
		if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;

		// noinspection PointlessArithmeticExpressionJS
		current = current[k] =
			i === len
				? merging
					? merge(current[k], val)
					: val
				: typeof (x = current[k]) === typeof path
					? x
					: // Determine if we should create an Object or an Array for the next level
						// If the next key is NOT an integer-like index, or contains a dot, create an Object.
						// Otherwise, create an Array.
						//
						// path[i] * 0 !== 0 checks if it is NOT a number (NaN * 0 is NaN).
						// !!~('' + path[i]).indexOf('.') checks if it contains a dot.
						//
						// @ts-expect-error hacky type check from dset
						path[i] * 0 !== 0 || !!~`${path[i]}`.indexOf('.') // eslint-disable-line
						? {}
						: [];
	}
}

export function merge(a: any, b: any) {
	let k: string | number;
	if (typeof a === 'object' && typeof b === 'object') {
		if (Array.isArray(a) && Array.isArray(b)) {
			for (k = 0; k < b.length; k++) {
				a[k] = merge(a[k], b[k]);
			}
		} else {
			for (k in b) {
				if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
				a[k] = merge(a[k], b[k]);
			}
		}
		return a;
	}
	return b;
}
