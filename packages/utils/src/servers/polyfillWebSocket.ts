import type { MaybePromise } from '../asyncs/MaybePromise';

export function polyfillWebSocket(ws: any): boolean;
export function polyfillWebSocket(ws?: undefined): Promise<boolean>;
export function polyfillWebSocket(ws?: any): MaybePromise<boolean> {
  if ('WebSocket' in globalThis) {
    return false;
  }
  if (ws) {
    const { WebSocket } = ws;
    Object.assign(globalThis, { WebSocket });
  }
  return import('ws').then((ws) => polyfillWebSocket(ws));
}
