declare const global: typeof globalThis;

/**
 * isomorphic globalThis
 *
 * globalThis supported by ff 65, chrome 71, node 12, babel
 *
 * @see https://caniuse.com/#search=globalThis
 * @see https://v8.dev/features/globalthis
 */
export const getGlobalThis = (): typeof globalThis => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global as any;
  // eslint-disable-next-line
  // @ts-ignore
  if (typeof this !== 'undefined') return this;
  throw new Error('Unable to locate global `this`');
};
