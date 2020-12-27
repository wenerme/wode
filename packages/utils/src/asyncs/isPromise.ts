export function isPromise<T>(v: any): v is Promise<T> {
  return v && (v instanceof Promise || (v.then && v.catch));
}
