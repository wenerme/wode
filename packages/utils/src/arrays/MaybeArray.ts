export type MaybeArray<T> = T | T[];

export function objectOfMaybeArray<T = any>(
  o: Record<string, MaybeArray<T>>,
  keys: string[] | null = null,
  picker = firstOfMaybeArray,
): Record<string, T> {
  if (keys === null) {
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, picker(v)]));
  }
  return Object.fromEntries(keys.map((v) => [v, picker(v)])) as any;
}
export function firstOfMaybeArray<T>(v: MaybeArray<T>): T {
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

export function lastOfMaybeArray<T>(v: MaybeArray<T>): T {
  if (Array.isArray(v)) {
    return v[v.length - 1];
  }
  return v;
}

export function arrayOfMaybeArray<T>(v: MaybeArray<T>): T[] {
  if (Array.isArray(v)) {
    return v;
  }
  if (v === null || v === undefined) {
    return [];
  }
  return [v];
}
