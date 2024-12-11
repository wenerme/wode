export function ifPresent<T, R>(value: T, fn: (v: NonNullable<T>) => R): R | undefined {
  return value ? fn(value) : undefined;
}
