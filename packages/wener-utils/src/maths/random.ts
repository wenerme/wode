export type RNG = {
	/** 返回 [0,1) 或 [0,a) 或 [a,b) 范围的随机浮点数 */
	random(a?: number, b?: number): number;
	/** 返回 [0, max] 或 [min, max] 范围的随机整数（包含两端） */
	randomInt(max: number): number;
	randomInt(min: number, max: number): number;
	/** 生成随机字节，填充到提供的数组或返回指定长度的新数组 */
	randomBytes(n: number): Uint8Array;
	randomBytes(buf: Uint8Array): Uint8Array;
	/** Fisher-Yates 洗牌算法，原地打乱数组 */
	shuffle<T>(arr: T[]): T[];
	/** 从数组中随机采样 n 个元素（不重复） */
	sample<T>(arr: T[], n: number): T[];
	/** 从数组中随机选择一个元素 */
	pick<T>(arr: T[]): T;
	/** 重置随机数生成器到初始种子或指定种子 */
	reset(seed?: SeedSource): void;
	/** 当前种子值 */
	readonly seed: number;
};

type SeedSource = string | number;

function resolveSeed(seed: SeedSource = Date.now()) {
	let v = 0;

	if (typeof seed === 'number') {
		v = seed;
	} else {
		seed = String(seed);
		for (let i = 0; i < seed.length; i++) {
			v = (Math.imul(31, v) + seed.charCodeAt(i)) | 0;
		}
	}

	// uint32
	v = v >>> 0;

	return v;
}

export function createRandom(s: SeedSource): RNG {
	// seealso https://github.com/skeeto/rng-js/blob/master/rng.js
	const initialSeed = resolveSeed(s);
	const rng = createXorshift128plus(initialSeed);

	const random = (a?: number, b?: number) => {
		const r = rng.next();
		if (a !== undefined && b !== undefined) {
			return r * (b - a) + a;
		}
		if (a !== undefined) {
			return r * a;
		}
		return r;
	};

	const randomInt = (min: number, max?: number) => {
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return Math.floor(random(min, max + 1));
	};

	const shuffle = <T>(arr: T[]): T[] => {
		// Fisher-Yates shuffle
		for (let i = arr.length - 1; i > 0; i--) {
			const j = randomInt(0, i);
			const tmp = arr[i]!;
			arr[i] = arr[j]!;
			arr[j] = tmp;
		}
		return arr;
	};

	const sample = <T>(arr: T[], n: number): T[] => {
		if (n >= arr.length) {
			return shuffle([...arr]);
		}
		// 使用 partial Fisher-Yates
		const copy = [...arr];
		const result: T[] = [];
		for (let i = 0; i < n; i++) {
			const j = randomInt(i, copy.length - 1);
			const tmp = copy[i]!;
			copy[i] = copy[j]!;
			copy[j] = tmp;
			result.push(copy[i]!);
		}
		return result;
	};

	const pick = <T>(arr: T[]): T => {
		return arr[randomInt(0, arr.length - 1)]!;
	};

	const randomBytes = (input: number | Uint8Array): Uint8Array => {
		const buf = typeof input === 'number' ? new Uint8Array(input) : input;
		const len = buf.length;
		// 每次 nextInt32 产生 4 字节
		let i = 0;
		while (i + 4 <= len) {
			const v = rng.nextInt32();
			buf[i] = v & 0xff;
			buf[i + 1] = (v >>> 8) & 0xff;
			buf[i + 2] = (v >>> 16) & 0xff;
			buf[i + 3] = (v >>> 24) & 0xff;
			i += 4;
		}
		// 处理剩余字节
		if (i < len) {
			const v = rng.nextInt32();
			for (let j = 0; i < len; i++, j++) {
				buf[i] = (v >>> (j * 8)) & 0xff;
			}
		}
		return buf;
	};

	return {
		random,
		randomInt,
		randomBytes,
		shuffle,
		sample,
		pick,
		reset: (seed?: SeedSource) => rng.reset(seed !== undefined ? resolveSeed(seed) : undefined),
		get seed() {
			return rng.seed;
		},
	};
}

export function resolveRandom(r: RNG | SeedSource = Date.now()): RNG {
	if (typeof r !== 'string' && typeof r !== 'number') {
		return r;
	}
	return createRandom(r);
}

/**
 * xorshift128+ 算法
 * 周期: 2^128 - 1，统计特性优于 LCG
 * 参考: https://prng.di.unimi.it/
 */
function createXorshift128plus(seed: number): {
	next: () => number;
	nextFloat: () => number;
	nextDouble: () => number;
	nextInt32: () => number;
	reset: (seed?: number) => void;
	readonly seed: number;
} {
	const initialSeed = seed;
	// 使用 SplitMix64 风格初始化两个状态
	let s0 = seed >>> 0;
	let s1 = (seed * 1812433253 + 1) >>> 0;

	// 确保状态非零
	if (s0 === 0) s0 = 0xdeadbeef;
	if (s1 === 0) s1 = 0xcafebabe;

	const nextInt32 = () => {
		// xorshift128+ 核心算法（32位简化版）
		let x = s0;
		const y = s1;

		s0 = y;
		x ^= x << 23;
		x ^= x >>> 17;
		x ^= y;
		x ^= y >>> 26;
		s1 = x >>> 0;

		// 返回 uint32
		return (s0 + s1) >>> 0;
	};

	// 32 位精度 [0, 1)
	const nextFloat = () => nextInt32() / 0x100000000;

	// 53 位精度 [0, 1)，两次迭代组合
	const nextDouble = () => {
		const hi = nextInt32() >>> 11; // 21 位
		const lo = nextInt32(); // 32 位
		return hi / (1 << 21) + lo / ((1 << 21) * 0x100000000);
	};

	const next = nextFloat;

	const reset = (newSeed: number = initialSeed) => {
		s0 = newSeed >>> 0;
		s1 = (newSeed * 1812433253 + 1) >>> 0;
		if (s0 === 0) s0 = 0xdeadbeef;
		if (s1 === 0) s1 = 0xcafebabe;
	};

	return {
		next,
		nextFloat,
		nextDouble,
		nextInt32,
		reset,
		get seed() {
			return initialSeed;
		},
	};
}
