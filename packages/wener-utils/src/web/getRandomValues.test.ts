import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const FILL_BYTE = 0xa5;

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('getRandomValues', () => {
	it('binds browser crypto and preserves every integer typed array identity', async () => {
		const calls: unknown[] = [];
		const browserCrypto = {
			getRandomValues(this: unknown, value: unknown) {
				expect(this).toBe(browserCrypto);
				calls.push(value);
				fillView(value, FILL_BYTE);
				return new Uint8Array();
			},
		};
		vi.stubGlobal('crypto', browserCrypto);

		const { getRandomValues } = await import('./getRandomValues');
		const values = [
			new Int8Array(4),
			new Uint8Array(4),
			new Uint8ClampedArray(4),
			new Int16Array(4),
			new Uint16Array(4),
			new Int32Array(4),
			new Uint32Array(4),
			new BigInt64Array(4),
			new BigUint64Array(4),
			new Uint8Array(new SharedArrayBuffer(4)),
		];

		for (const value of values) {
			expect(getRandomValues(value)).toBe(value);
			expect([...bytesOf(value)]).toEqual(Array.from({ length: value.byteLength }, () => FILL_BYTE));
		}
		expect(calls).toEqual(values);
	});

	it('keeps the intentionally supported msCrypto path bound', async () => {
		const msCrypto = {
			getRandomValues(this: unknown, value: unknown) {
				expect(this).toBe(msCrypto);
				fillView(value, 0x33);
				return value;
			},
		};
		vi.stubGlobal('crypto', undefined);
		vi.stubGlobal('msCrypto', msCrypto);

		const { getRandomValues } = await import('./getRandomValues');
		const value = new Uint8Array(3);
		expect(getRandomValues(value)).toBe(value);
		expect([...value]).toEqual([0x33, 0x33, 0x33]);
	});

	it('binds and caches a Node webcrypto fallback', async () => {
		let calls = 0;
		const webcrypto = {
			getRandomValues(this: unknown, value: unknown) {
				expect(this).toBe(webcrypto);
				calls += 1;
				fillView(value, calls);
				return value;
			},
		};
		vi.stubGlobal('crypto', { webcrypto });

		const { getRandomValues } = await import('./getRandomValues');
		const first = new Uint16Array(2);
		const second = new Uint16Array(2);
		expect(getRandomValues(first)).toBe(first);
		expect(getRandomValues(second)).toBe(second);
		expect([...bytesOf(first)]).toEqual([1, 1, 1, 1]);
		expect([...bytesOf(second)]).toEqual([2, 2, 2, 2]);
	});

	it('fills the exact byte range through randomBytes and returns the input view', async () => {
		const requestedSizes: number[] = [];
		const nodeCrypto = {
			randomBytes(this: unknown, size: number) {
				expect(this).toBe(nodeCrypto);
				requestedSizes.push(size);
				return Uint8Array.from({ length: size }, (_, index) => index + 1);
			},
		};
		vi.stubGlobal('crypto', nodeCrypto);

		const { getRandomValues } = await import('./getRandomValues');
		const buffer = new ArrayBuffer(12);
		const value = new Uint16Array(buffer, 2, 3);
		expect(getRandomValues(value)).toBe(value);
		expect(requestedSizes).toEqual([value.byteLength]);
		expect([...new Uint8Array(buffer)]).toEqual([0, 0, 1, 2, 3, 4, 5, 6, 0, 0, 0, 0]);
	});

	it('matches WebCrypto type and quota rejection behavior in the randomBytes fallback', async () => {
		let randomBytesCalls = 0;
		vi.stubGlobal('crypto', {
			randomBytes(size: number) {
				randomBytesCalls += 1;
				return new Uint8Array(size);
			},
		});

		const { getRandomValues } = await import('./getRandomValues');
		const callWithUnknown = getRandomValues as unknown as (value: unknown) => unknown;

		expect(captureError(() => callWithUnknown(new Float32Array(1)))).toMatchObject({
			name: 'TypeMismatchError',
			code: 17,
		});
		expect(captureError(() => callWithUnknown(new DataView(new ArrayBuffer(1))))).toMatchObject({
			name: 'TypeMismatchError',
			code: 17,
		});
		expect(captureError(() => getRandomValues(new Uint16Array(32_769)))).toMatchObject({
			name: 'QuotaExceededError',
			code: 22,
		});
		expect(randomBytesCalls).toBe(0);
	});
});

function fillView(value: unknown, byte: number): void {
	if (!ArrayBuffer.isView(value)) throw new TypeError('expected an ArrayBuffer view');
	bytesOf(value).fill(byte);
}

function bytesOf(value: ArrayBufferView): Uint8Array<ArrayBufferLike> {
	return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

function captureError(action: () => unknown): Error & { code?: number } {
	try {
		action();
	} catch (error) {
		if (error instanceof Error) return error;
		throw new TypeError('expected Error rejection');
	}
	throw new Error('expected action to reject');
}
