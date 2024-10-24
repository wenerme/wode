// for safari
export const requestIdleCallback =
  globalThis.requestIdleCallback ||
  ((callback: (deadline: IdleDeadline) => void, options?: IdleRequestOptions) => {
    const start = Date.now();
    const deadline: IdleDeadline = {
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    };
    // skip options?.timeout
    return setTimeout(() => callback(deadline), 1);
  });

export const cancelIdleCallback = globalThis.cancelIdleCallback || ((id: number) => clearTimeout(id));
