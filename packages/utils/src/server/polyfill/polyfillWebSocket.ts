import type { MaybePromise } from '../../asyncs/MaybePromise';
import { getGlobalThis } from '../../runtime/getGlobalThis';

export function polyfillWebSocket(ws: any): boolean;
export function polyfillWebSocket(ws?: undefined): Promise<boolean>;
export function polyfillWebSocket(ws?: any): MaybePromise<boolean> {
  const globalThis = getGlobalThis();
  if ('WebSocket' in globalThis) {
    return false;
  }
  if (ws && 'then' in ws) {
    return ws.then((v: any) => {
      return polyfillWebSocket(v?.default || v);
    });
  }
  if (ws) {
    const { WebSocket } = ws;
    Object.assign(globalThis, { WebSocket });
  }
  return import('ws').then((ws) => polyfillWebSocket(ws));
}
