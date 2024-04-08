export function transformData(input: Record<string, string[]>) {
  let out = {} as Record<string, string[]>;
  for (let [py, chars] of Object.entries(input)) {
    for (let c of chars) {
      if (!out[c]) {
        out[c] = [];
      }
      out[c].push(py);
    }
  }
  return out;
}
