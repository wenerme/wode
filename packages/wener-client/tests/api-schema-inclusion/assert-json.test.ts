import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { assertJsonStructureEqual, assertOfficialIncluded } from './assert-json';

describe('Official inclusion assertions', () => {
	test('ignores object key order and floating-point precision', () => {
		expect(() =>
			assertJsonStructureEqual({ a: 0.3, b: [null, true] }, { b: [null, true], a: 0.1 + 0.2 }),
		).not.toThrow();
	});

	test.each([
		[{ a: 1 }, {}],
		[{}, { a: 1 }],
		[{ a: null }, {}],
		[
			[1, 2],
			[2, 1],
		],
		[[1], [1, 2]],
		[1, '1'],
		[1, 1.01],
		[1, 1.0000000001],
		[1.0000000001, 1],
		[1_000_000_000_000, 1_000_000_000_001],
		[{ nested: { a: true } }, { nested: {} }],
	])('rejects structural or value changes: %j', (expected, actual) => {
		expect(() => assertJsonStructureEqual(expected, actual)).toThrow();
	});

	test('rejects field stripping, defaults, coercion, mutation and an invalid oracle sample', () => {
		const valid = () => true;
		expect(() => assertOfficialIncluded(valid, (value) => z.object({}).parse(value), { extension: 1 })).toThrow();
		expect(() =>
			assertOfficialIncluded(valid, (value) => z.object({ n: z.number().default(0) }).parse(value), {}),
		).toThrow();
		expect(() => assertOfficialIncluded(valid, (value) => z.coerce.number().parse(value), '1')).toThrow();
		expect(() => assertOfficialIncluded(valid, () => 1.0000000001, 1)).toThrow();
		expect(() => assertOfficialIncluded(valid, (value) => Object.assign(value as object, { added: 1 }), {})).toThrow();
		expect(() =>
			assertOfficialIncluded(
				() => false,
				(value) => value,
				{},
			),
		).toThrow(/invalid official JSON/);
	});

	test('also checks that parsed output satisfies the official oracle', () => {
		const acceptsOnlyOriginal = (value: unknown) => value === 0.3;
		expect(() => assertOfficialIncluded(acceptsOnlyOriginal, () => 0.1 + 0.2, 0.3)).toThrow(/official schema/);
	});

	test('preserves provider extensions with a loose schema', () => {
		expect(() =>
			assertOfficialIncluded(
				() => true,
				(value) => z.looseObject({}).parse(value),
				{ extra: null },
			),
		).not.toThrow();
	});
});
