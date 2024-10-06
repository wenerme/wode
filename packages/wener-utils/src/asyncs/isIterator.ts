export function isIterator<T>(it: any): it is Iterator<T> | AsyncIterator<T> {
  return typeof it?.next === 'function';
}
