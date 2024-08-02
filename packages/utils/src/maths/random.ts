/// javascript pseudo random
export function createRandom(o: { seed?: string | number } = {}) {
  let seed = typeof o.seed === 'string' ? 0 : (o.seed ?? 0);
  if (typeof o.seed === 'string') {
    let sum = 0;
    for (let i = 0; i < o.seed.length; i++) {
      sum += o.seed.charCodeAt(i);
    }
    seed = sum;
  }

  return () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}
