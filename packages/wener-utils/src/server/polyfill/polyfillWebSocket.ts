import type { MaybePromise } from '../../asyncs/MaybePromise';
import { getGlobalThis } from '../../web/getGlobalThis';

export function polyfillWebSocket(ws: any): boolean;
export function polyfillWebSocket(ws?: undefined): Promise<boolean>;
export function polyfillWebSocket(ws?: any): MaybePromise<boolean> {
	const globalObject = getGlobalThis();
	if ('WebSocket' in globalObject) {
		return false;
	}
	if (ws && 'then' in ws) {
		return ws.then((v: any) => {
			return polyfillWebSocket(v?.default || v);
		});
	}
	if (ws) {
		const { WebSocket } = ws;
		Object.assign(globalObject, { WebSocket });
	}
	return import('ws').then((ws) => polyfillWebSocket(ws));
}
