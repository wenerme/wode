let counter: Record<string, number>;

export function warn(msg: string, ...args: any[]) {
  if (!counter) {
    counter = {};
  }
  counter[msg] = counter[msg] || 0;
  let count = counter[msg]++;
  if (count === 0) {
    console.trace(`[WARN] ${count}: ${msg}`, ...args);
  } else {
    console.warn(`[WARN] ${count}: ${msg}`, ...args);
  }
  return count;
}
