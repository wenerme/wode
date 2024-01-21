type AsyncClosable = { close(): void | Promise<void> } | (() => void | Promise<void>) | AsyncDisposable | Disposable;

/**
 * @see AsyncDisposableStack
 */
export class AsyncCloser implements AsyncDisposable {
  closers: Array<AsyncClosable> = [];

  defer(closer: AsyncClosable | null | undefined) {
    if (!closer) {
      return;
    }
    this.closers.push(closer);
  }

  async [Symbol.asyncDispose]() {
    for (let closer of this.closers) {
      let o;
      if (typeof closer === 'function') {
        o = closer();
      } else if (Symbol.asyncDispose in closer) {
        o = closer[Symbol.asyncDispose]();
      } else if (Symbol.dispose in closer) {
        closer[Symbol.dispose]();
      } else {
        o = closer.close();
      }
      if (o && typeof o.then === 'function') {
        await o;
      }
    }
  }

  close() {
    return this[Symbol.asyncDispose]();
  }
}
