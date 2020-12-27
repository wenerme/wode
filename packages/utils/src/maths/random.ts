/// javascript pseudo random
export function createRandom({ seed = 0 } = {}) {
  if (typeof seed === 'string') {
    const s: string = seed;
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
      sum += s.charCodeAt(i);
    }
    seed = sum;
  }

  return () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}
