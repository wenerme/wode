export function ifPresent<T, R>(value: T, fn: (v: T) => R): R | undefined {
  return value ? fn(value) : undefined;
}
