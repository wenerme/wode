import { describe, expect, test } from 'vitest';
import { getObjectId } from './getObjectId';

describe('getObjectId', () => {
	test('returns a stable positive integer id for the same object reference', () => {
		const object = {};
		const id = getObjectId(object);

		expect(Number.isInteger(id)).toBe(true);
		expect(id).toBeGreaterThan(0);
		expect(getObjectId(object)).toBe(id);
	});

	test('assigns unique ids across object-like key types', () => {
		class Demo {}
		function fn() {}
		const arrow = () => undefined;
		const numberObject = Object(1);
		const stringObject = Object('hello');
		const booleanObject = Object(true);

		const values = [
			{},
			[],
			fn,
			arrow,
			Demo,
			new Demo(),
			new Date(0),
			/hello/,
			new Map(),
			new Set(),
			new WeakMap(),
			new WeakSet(),
			new ArrayBuffer(8),
			new DataView(new ArrayBuffer(8)),
			new Uint8Array(2),
			Promise.resolve(),
			new Error('hello'),
			numberObject,
			stringObject,
			booleanObject,
		];
		const ids = values.map((value) => getObjectId(value));

		expect(new Set(ids).size).toBe(values.length);
		for (const [index, value] of values.entries()) {
			expect(getObjectId(value)).toBe(ids[index]);
		}
	});

	test('treats equal-looking values as different references', () => {
		const left = { value: 1 };
		const right = { value: 1 };
		const leftArray = [1, 2, 3];
		const rightArray = [1, 2, 3];

		expect(getObjectId(left)).not.toBe(getObjectId(right));
		expect(getObjectId(leftArray)).not.toBe(getObjectId(rightArray));
	});

	test('throws for primitive values that cannot be WeakMap keys', () => {
		const primitiveValues = [null, undefined, 0, 1, Number.NaN, '', 'hello', true, false, 1n] as const;

		for (const value of primitiveValues) {
			expect(() => getObjectId(value)).toThrow(TypeError);
		}
		expect(() => getObjectId(Symbol.for('getObjectId.test'))).toThrow(TypeError);
	});

	test('handles non-registered symbols according to runtime WeakMap support', () => {
		const symbol = Symbol('getObjectId.test');

		if (!supportsWeakMapSymbolKeys()) {
			expect(() => getObjectId(symbol)).toThrow(TypeError);
			return;
		}

		const id = getObjectId(symbol);

		expect(Number.isInteger(id)).toBe(true);
		expect(getObjectId(symbol)).toBe(id);
		expect(getObjectId(Symbol('getObjectId.test'))).not.toBe(id);
	});
});

function supportsWeakMapSymbolKeys() {
	try {
		new WeakMap().set(Symbol('getObjectId.test.support'), true);
		return true;
	} catch {
		return false;
	}
}
