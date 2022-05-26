declare const global: typeof globalThis;

/**
 * isomorphic globalThis
 *
 * globalThis supported by ff 65, Chrome 71, Node 12, babel
 *
 * @see https://caniuse.com/#search=globalThis
 * @see https://v8.dev/features/globalthis
 */
export const getGlobalThis = (): typeof globalThis => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global as any;
  // if (typeof this !== 'undefined') return this;
  throw new Error('Unable to locate global `this`');
};
