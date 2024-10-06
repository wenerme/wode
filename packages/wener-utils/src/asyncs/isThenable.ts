export function isThenable(v: any): v is PromiseLike<any> {
  // we are at Promise era now, so we can use Promise instead of PromiseLike
  return v && typeof v.then === 'function';
}
