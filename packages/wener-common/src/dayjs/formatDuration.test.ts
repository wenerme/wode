import { expect, test } from 'vite-plus/test';
import { formatDuration } from './formatDuration';

test('formatDuration', () => {
	for (const [a, b] of [
		[0, '0ms'],
		[1000, '1s'],
		[1000 * 60, '1m'],
		[1000 * 60 + 1000, '1m1s'],
		[1000 * 60 + 1000 + 1, '1m1s1ms'],
	]) {
		expect(formatDuration(a)).toBe(b);
	}
});
