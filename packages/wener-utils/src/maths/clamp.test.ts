import { expect, test } from 'vitest';
import { clamp } from './clamp';

test('clamp', () => {
	for (const [a, b] of [
		// 基本用法
		[[null, 0, 0], 0],
		[[null, 1, 10], 1],
		[[undefined, 1, 10], 1],
		[[undefined, 1, 10, 5], 5],
		[[2, 1, 10, 5], 2],
		[[11, 1, 10, 5], 10],
		[[0, 1, 10, 5], 1],
		// 只限制 min
		[[1, 2, undefined], 2],
		[[5, 2, undefined], 5],
		// 只限制 max
		[[1, undefined, 0], 0],
		[[5, undefined, 10], 5],
		// BigInt
		[[2n, 1n, 10n, 5n], 2n],
		[[11n, 1n, 10n, 5n], 10n],
	] as const) {
		expect(clamp.apply(null, a as any), `${a} -> ${b}`).toBe(b);
	}
});
