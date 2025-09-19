import type { Constructor } from '@wener/utils';

type ContextProvider = <O = any>(needle: Constructor<O> | Constructor | Function | string | symbol) => O;
export const getContext: ContextProvider = (needle) => {
	if (!_contextProvider) {
		throw new Error('ContextProvider is not set');
	}
	return _contextProvider(needle);
};
let _contextProvider: ContextProvider;

export function setContextProvider(fn: ContextProvider) {
	_contextProvider = fn;
}
