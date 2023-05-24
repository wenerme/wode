import type { MaybePromise } from '../asyncs/MaybePromise';
import { getGlobalThis } from '../isomorphics/getGlobalThis';

export function polyfillWebSocket(ws: any): boolean;
export function polyfillWebSocket(ws?: undefined): Promise<boolean>;
export function polyfillWebSocket(ws?: any): MaybePromise<boolean> {
  const globalThis = getGlobalThis();
  if ('WebSocket' in globalThis) {
    return false;
  }
  if (ws) {
    const { WebSocket } = ws;
    Object.assign(globalThis, { WebSocket });
  }
  return import('ws').then((ws) => polyfillWebSocket(ws));
}
