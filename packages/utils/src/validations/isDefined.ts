export function isDefined<T = any>(v: T): v is NonNullable<T> {
  return v !== null && v !== undefined;
}
