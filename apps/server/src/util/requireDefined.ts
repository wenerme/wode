export function requireDefined<T>(v: T | undefined | null, message?: string): T {
  if (v === undefined || v === null) {
    throw new Error(message || 'requireDefined');
  }
  return v;
}
