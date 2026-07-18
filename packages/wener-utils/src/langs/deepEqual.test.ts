import { expect, test } from 'vite-plus/test';
import { deepEqual } from './deepEqual';

test('deep equal', () => {
	expect(deepEqual({ a: null, b: Infinity }, { a: null, b: Infinity })).toBeTruthy();
});
