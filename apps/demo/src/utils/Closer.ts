type Closable = { close(): void } | (() => void) | Disposable;

/**
 * @see DisposableStack
 */
export class Closer implements Disposable {
  closers: Array<Closable> = [];

  defer(closer: Closable | null | undefined) {
    if (!closer) {
      return;
    }
    this.closers.push(closer);
  }

  add<T extends Closable | null | undefined>(closer: T): T {
    if (!closer) {
      return closer;
    }
    this.closers.push(closer);
    return closer;
  }

  [Symbol.dispose]() {
    for (let closer of this.closers) {
      if (typeof closer === 'function') {
        closer();
      } else if (Symbol.dispose in closer) {
        closer[Symbol.dispose]();
      } else {
        closer.close();
      }
    }
  }

  close() {
    this[Symbol.dispose]();
  }
}
