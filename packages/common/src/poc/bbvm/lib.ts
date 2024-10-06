export function float32bits(v: number) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = v;
  return new Uint32Array(buf)[0];
}

export function float32frombits(v: number) {
  const buf = new ArrayBuffer(4);
  new Uint32Array(buf)[0] = v;
  return new Float32Array(buf)[0];
}
