import { getGlobalThis } from './getGlobalThis';

const globalThis = getGlobalThis();

/**
 * generate random UUIDv4
 */
export const randomUUID: () => string = globalThis.crypto?.randomUUID?.bind(globalThis.crypto) || _randomUUID;

/**
 * @internal
 */
export function _randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
