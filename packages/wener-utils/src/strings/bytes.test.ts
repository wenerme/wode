import { describe, expect, test } from 'vitest';
import { formatBytes } from './formatBytes';
import { parseBytes } from './parseBytes';

describe('bytes', () => {
	describe('formatBytes', () => {
		for (const [input, expected, options] of [
			[1024, '1 KB', undefined],
			[1048576, '1 MB', undefined],
			[1000, '1000 B', { unit: 'B' }],
			[1000, '1 kB', { si: true }],
			[1536, '1.5 KB', undefined],
			[1073741824, '1 GB', undefined],
			[123456789, '117.74 MB', undefined],
		]) {
			test(`formatBytes(${input}, ${JSON.stringify(options)}) === '${expected}'`, () => {
				expect(formatBytes(input, options)).toBe(expected);
			});
		}
	});

	describe('parseBytes', () => {
		for (const [input, expected] of [
			['1 KB', 1024],
			['1 MB', 1048576],
			['1 GB', 1073741824],
			['1G', 1073741824],
			['1M', 1048576],
			['1K', 1024],
			['1 kB', 1000],
			['1 MB', 1048576],
			['1.5 KB', 1536],
			['117.74 MB', 123456789],
			['1000 B', 1000],
			['2048', 2048],
			['2.5G', 2684354560],
			['2.5GB', 2684354560],
			['2.5 GiB', 2684354560],
			['2.5MiB', 2621440],
			['2.5M', 2621440],
			['2.5k', 2560],
			['2.5K', 2560],
			['2.5KiB', 2560],
		]) {
			test(`parseBytes('${input}') === ${expected}`, () => {
				expect(parseBytes(input)).toBe(expected);
			});
		}
	});
});
