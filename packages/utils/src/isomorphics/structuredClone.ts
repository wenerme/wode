/**
 * Chrome 98, Safari 15.4
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/structuredClone structuredClone}
 * {@link https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/web.structured-clone.js core-js}
 */
export const structuredClone: (value: any, options?: StructuredSerializeOptions) => any =
  globalThis.structuredClone ||
  function <T>(obj: T, _?: any): T {
    return JSON.parse(JSON.stringify(obj));
  };
