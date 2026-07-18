import { describe, expect, test } from 'vite-plus/test';
import { createRandom, randomString, resolveRandom } from './random';

describe('createRandom', () => {
	test('deterministic with same seed', () => {
		const r1 = createRandom(12345);
		const r2 = createRandom(12345);
		expect(r1.random()).toBe(r2.random());
		expect(r1.randomInt(100)).toBe(r2.randomInt(100));
	});

	test('random() returns [0, 1)', () => {
		const r = createRandom(0);
		for (let i = 0; i < 100; i++) {
			const v = r.random();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	test('random(a) returns [0, a)', () => {
		const r = createRandom(42);
		for (let i = 0; i < 100; i++) {
			const v = r.random(50);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(50);
		}
	});

	test('random(a, b) returns [a, b)', () => {
		const r = createRandom(42);
		for (let i = 0; i < 100; i++) {
			const v = r.random(10, 20);
			expect(v).toBeGreaterThanOrEqual(10);
			expect(v).toBeLessThan(20);
		}
	});

	test('randomInt(max) returns [0, max]', () => {
		const r = createRandom(42);
		const results = new Set<number>();
		for (let i = 0; i < 1000; i++) {
			const v = r.randomInt(5);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThanOrEqual(5);
			expect(Number.isInteger(v)).toBe(true);
			results.add(v);
		}
		// should hit all values 0-5
		expect(results.size).toBe(6);
	});

	test('randomInt(min, max) returns [min, max]', () => {
		const r = createRandom(42);
		const results = new Set<number>();
		for (let i = 0; i < 1000; i++) {
			const v = r.randomInt(10, 15);
			expect(v).toBeGreaterThanOrEqual(10);
			expect(v).toBeLessThanOrEqual(15);
			expect(Number.isInteger(v)).toBe(true);
			results.add(v);
		}
		// should hit all values 10-15
		expect(results.size).toBe(6);
	});

	test('shuffle', () => {
		const r = createRandom(42);
		const arr = [1, 2, 3, 4, 5];
		const shuffled = r.shuffle([...arr]);
		expect(shuffled).toHaveLength(5);
		expect(shuffled.sort()).toEqual(arr);
	});

	test('sample', () => {
		const r = createRandom(42);
		const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const sampled = r.sample(arr, 3);
		expect(sampled).toHaveLength(3);
		// all sampled items should be from original array
		for (const v of sampled) {
			expect(arr).toContain(v);
		}
		// no duplicates
		expect(new Set(sampled).size).toBe(3);
	});

	test('sample with n >= arr.length returns shuffled copy', () => {
		const r = createRandom(42);
		const arr = [1, 2, 3];
		const sampled = r.sample(arr, 5);
		expect(sampled).toHaveLength(3);
		expect(sampled.sort()).toEqual(arr);
	});

	test('pick', () => {
		const r = createRandom(42);
		const arr = [1, 2, 3, 4, 5];
		const picked = r.pick(arr);
		expect(arr).toContain(picked);
	});

	test('reset restores initial state', () => {
		const r = createRandom(42);
		const first = r.random();
		r.random();
		r.random();
		r.reset();
		expect(r.random()).toBe(first);
	});

	test('reset with new seed', () => {
		const r = createRandom(42);
		r.reset(100);
		const r2 = createRandom(100);
		expect(r.random()).toBe(r2.random());
	});

	test('reset with string seed', () => {
		const r = createRandom(42);
		r.reset('hello');
		const r2 = createRandom('hello');
		expect(r.random()).toBe(r2.random());
	});

	test('seed property', () => {
		const r = createRandom(12345);
		expect(r.seed).toBe(12345);
	});

	test('string seed', () => {
		const r1 = createRandom('test-seed');
		const r2 = createRandom('test-seed');
		expect(r1.random()).toBe(r2.random());
	});

	test('randomBytes(n) returns Uint8Array of length n', () => {
		const r = createRandom(42);
		const bytes = r.randomBytes(16);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(16);
	});

	test('randomBytes fills provided buffer', () => {
		const r = createRandom(42);
		const buf = new Uint8Array(8);
		const result = r.randomBytes(buf);
		expect(result).toBe(buf);
		// should not be all zeros
		expect(buf.some((v) => v !== 0)).toBe(true);
	});

	test('randomBytes is deterministic', () => {
		const r1 = createRandom(42);
		const r2 = createRandom(42);
		expect(r1.randomBytes(16)).toEqual(r2.randomBytes(16));
	});

	test('randomBytes handles non-multiple of 4', () => {
		const r = createRandom(42);
		const bytes1 = r.randomBytes(1);
		expect(bytes1.length).toBe(1);

		const r2 = createRandom(42);
		const bytes5 = r2.randomBytes(5);
		expect(bytes5.length).toBe(5);

		const r3 = createRandom(42);
		const bytes7 = r3.randomBytes(7);
		expect(bytes7.length).toBe(7);
	});

	test('randomBytes produces values in range 0-255', () => {
		const r = createRandom(42);
		const bytes = r.randomBytes(1000);
		for (const b of bytes) {
			expect(b).toBeGreaterThanOrEqual(0);
			expect(b).toBeLessThanOrEqual(255);
		}
	});
});

describe('resolveRandom', () => {
	test('returns existing RNG', () => {
		const r = createRandom(42);
		expect(resolveRandom(r)).toBe(r);
	});

	test('creates RNG from number seed', () => {
		const r = resolveRandom(42);
		const r2 = createRandom(42);
		expect(r.random()).toBe(r2.random());
	});

	test('creates RNG from string seed', () => {
		const r = resolveRandom('test');
		const r2 = createRandom('test');
		expect(r.random()).toBe(r2.random());
	});
});

describe('randomString', () => {
	test('generates string of correct length', () => {
		const r = createRandom(42);
		const str = randomString(r.random, 'abc', 10);
		expect(str.length).toBe(10);
	});

	test('only uses characters from charset', () => {
		const r = createRandom(42);
		const chars = 'ABC';
		const str = randomString(r.random, chars, 100);
		for (const c of str) {
			expect(chars).toContain(c);
		}
	});

	test('is deterministic with same random', () => {
		const r1 = createRandom(42);
		const r2 = createRandom(42);
		expect(randomString(r1.random, 'abc', 20)).toBe(randomString(r2.random, 'abc', 20));
	});

	test('works with array charset', () => {
		const r = createRandom(42);
		const chars = ['aa', 'bb', 'cc'];
		const str = randomString(r.random, chars, 5);
		expect(str.length).toBe(10); // 5 * 2 chars each
	});

	test('RNG.randomString method', () => {
		const r = createRandom(42);
		const str = r.randomString('0123456789', 8);
		expect(str.length).toBe(8);
		expect(str).toMatch(/^[0-9]+$/);
	});
});
