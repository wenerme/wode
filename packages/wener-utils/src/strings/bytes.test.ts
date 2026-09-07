import { describe, expect, test } from 'vite-plus/test';
import { formatBytes } from './formatBytes';
import { parseBytes } from './parseBytes';

describe('bytes', () => {
	describe('formatBytes', () => {
		const testCases: [number, any, string][] = [
			// IEC standard by default
			[1024, undefined, '1.0 KiB'],
			[1024 * 1024, undefined, '1.0 MiB'],
			[1536, undefined, '1.5 KiB'],
			// SI standard
			[1000, true, '1.0 kB'],
			[1000 * 1000, true, '1.0 MB'],
			[1500, true, '1.5 kB'],
			// Small byte values
			[100, undefined, '100 B'],
			[999, undefined, '999 B'],
			[1023, undefined, '1023 B'],
			// SI small byte values
			[100, true, '100 B'],
			[999, true, '999 B'],
			// Decimal places
			[1536, { dp: 2 }, '1.50 KiB'],
			[1536, { dp: 3 }, '1.500 KiB'],
			// Force unit
			[1024 * 1024, { unit: 'KiB' }, '1024.0 KiB'],
			[1000 * 1000, { si: true, unit: 'kB' }, '1000.0 kB'],
		];

		test('should format bytes correctly', () => {
			for (const [bytes, options, expected] of testCases) {
				expect(formatBytes(bytes, options as any)).toBe(expected);
			}
		});
	});

	describe('parseBytes', () => {
		const validTestCases: [string, ReturnType<typeof parseBytes>][] = [
			['1B', { value: 1, unit: 'B', bytes: 1 }],
			['1KB', { value: 1, unit: 'KB', bytes: 1000 }],
			['1KiB', { value: 1, unit: 'KiB', bytes: 1024 }],
			['1.5GB', { value: 1.5, unit: 'GB', bytes: 1.5 * 1000 ** 3 }],
			['2TiB', { value: 2, unit: 'TiB', bytes: 2 * 1024 ** 4 }],
			// single letter
			['1G', { value: 1, unit: 'G', bytes: 1000 ** 3 }],
			['1.5T', { value: 1.5, unit: 'T', bytes: 1.5 * 1000 ** 4 }],
			// case-insensitive
			['1gb', { value: 1, unit: 'gb', bytes: 1000 ** 3 }],
			['1.5 mib', { value: 1.5, unit: 'mib', bytes: 1.5 * 1024 ** 2 }],
			// whitespace
			[' 1.5 GB ', { value: 1.5, unit: 'GB', bytes: 1.5 * 1000 ** 3 }],
		];

		test('should parse valid byte strings', () => {
			for (const [str, expected] of validTestCases) {
				expect(parseBytes(str)).toEqual(expected);
			}
		});

		const invalidTestCases = ['abc', '1.5XB', ''];

		test('should return undefined for invalid strings', () => {
			for (const str of invalidTestCases) {
				expect(parseBytes(str)).toBeUndefined();
			}
		});
	});
});
