// LCG pseudo random
export function createRandom(_seed: number | string = Date.now()): {
  random(n?: number): number;
  randomBytes(length: number): Uint8Array;
  [Symbol.iterator](): Generator<number, void, unknown>;
} {
  let seed = 0;

  if (typeof _seed === 'string') {
    for (let i = 0; i < _seed.length; i++) {
      seed = (Math.imul(31, seed) + _seed.charCodeAt(i)) | 0;
    }
  } else if (typeof _seed === 'number') {
    seed = _seed;
  }

  // int32
  seed = seed >>> 0;

  // alternative 梅森旋转算法 (Mersenne Twister), Xorshift
  // LCG
  const m = 0x80000000; // 2^31
  const a = 1664525;
  const c = 1013904223;

  const random = (n?: number): number => {
    seed = (a * seed + c) % m;
    let r = seed / m;
    if (n) {
      r = Math.floor(r * n);
    }
    return r;
  };

  const randomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(random() * 256);
    }
    return bytes;
  };

  return {
    random,
    randomBytes,
    [Symbol.iterator]: function* () {
      while (true) {
        yield random();
      }
    },
  };
}
