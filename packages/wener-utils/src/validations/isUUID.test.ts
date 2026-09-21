import { describe, expect, test } from 'vitest';
import { randomUUIDv7 } from '../crypto/randomUUIDv7';
import { isUUID } from './isUUID';
import { isUUIDv4 } from './isUUIDv4';
import { isUUIDv7 } from './isUUIDv7';

describe('UUID 校验', () => {
	test('isUUID 接受 RFC variant 的 UUID 版本 1 到 8', () => {
		for (const value of [
			'6ba7b810-9dad-11d1-80b4-00c04fd430c8',
			'550e8400-e29b-41d4-a716-446655440000',
			'01890f76-7c5b-7cc3-98c4-dc0c0c07398f',
			'2489e9ad-2ee2-8e00-8ec9-4f63b238b53c',
		]) {
			expect(isUUID(value)).toBe(true);
		}
	});

	test('isUUID 拒绝非标准格式、未知版本和非 RFC variant', () => {
		for (const value of [
			undefined,
			null,
			'',
			'not-a-uuid',
			'00000000-0000-0000-0000-000000000000',
			'550e8400-e29b-91d4-a716-446655440000',
			'550e8400-e29b-41d4-c716-446655440000',
			'{550e8400-e29b-41d4-a716-446655440000}',
		]) {
			expect(isUUID(value)).toBe(false);
		}
	});

	test('isUUIDv4 只接受 UUIDv4', () => {
		expect(isUUIDv4('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
		expect(isUUIDv4('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
		expect(isUUIDv4('01890f76-7c5b-7cc3-98c4-dc0c0c07398f')).toBe(false);
	});

	test('isUUIDv7 只接受 UUIDv7', () => {
		expect(isUUIDv7(randomUUIDv7())).toBe(true);
		expect(isUUIDv7('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
		expect(isUUIDv7(null)).toBe(false);
	});
});
