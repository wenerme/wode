import { describe, expect, test } from 'vite-plus/test';
import { createRandomUUIDv7, isUUIDv7, parseUUIDv7Timestamp, randomUUIDv7 } from './randomUUIDv7';

describe('randomUUIDv7', () => {
	test('generates valid UUIDv7', () => {
		const uuid = randomUUIDv7();
		expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	});

	test('generates unique UUIDs', () => {
		const uuids = new Set<string>();
		for (let i = 0; i < 1000; i++) {
			uuids.add(randomUUIDv7());
		}
		expect(uuids.size).toBe(1000);
	});

	test('respects provided timestamp', () => {
		const ts = 1704067200000; // 2024-01-01 00:00:00 UTC
		const uuid = randomUUIDv7(ts);
		const extractedTs = parseUUIDv7Timestamp(uuid);
		expect(extractedTs).toBe(ts);
	});

	test('UUIDs are sortable by time', () => {
		const ts1 = 1704067200000;
		const ts2 = 1704067201000;
		const uuid1 = randomUUIDv7(ts1);
		const uuid2 = randomUUIDv7(ts2);
		expect(uuid1 < uuid2).toBe(true);
	});
});

describe('isUUIDv7', () => {
	test('returns true for valid UUIDv7', () => {
		const uuid = randomUUIDv7();
		expect(isUUIDv7(uuid)).toBe(true);
	});

	test('returns false for UUIDv4', () => {
		expect(isUUIDv7('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
	});

	test('returns false for invalid strings', () => {
		expect(isUUIDv7('')).toBe(false);
		expect(isUUIDv7(null)).toBe(false);
		expect(isUUIDv7(undefined)).toBe(false);
		expect(isUUIDv7('not-a-uuid')).toBe(false);
	});
});

describe('parseUUIDv7Timestamp', () => {
	test('extracts correct timestamp', () => {
		const ts = Date.now();
		const uuid = randomUUIDv7(ts);
		expect(parseUUIDv7Timestamp(uuid)).toBe(ts);
	});

	test('throws for invalid UUID format', () => {
		expect(() => parseUUIDv7Timestamp('invalid')).toThrow('Invalid UUID format');
	});
});

describe('createRandomUUIDv7', () => {
	test('creates generator with custom now function', () => {
		let currentTime = 1704067200000;
		const generator = createRandomUUIDv7({ now: () => currentTime });

		const uuid1 = generator();
		expect(parseUUIDv7Timestamp(uuid1)).toBe(currentTime);

		currentTime = 1704067201000;
		const uuid2 = generator();
		expect(parseUUIDv7Timestamp(uuid2)).toBe(currentTime);
	});

	test('generator accepts explicit timestamp override', () => {
		const generator = createRandomUUIDv7({ now: () => 1000 });
		const uuid = generator(2000);
		expect(parseUUIDv7Timestamp(uuid)).toBe(2000);
	});
});
