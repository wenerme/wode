import { getAppContext, type TypeToken } from './ApplicationContext';

type ContextProvider = <O = any>(needle: TypeToken<O>) => O;
export const getContext: ContextProvider = (needle) => {
	if (!_getContext) {
		throw new Error('ContextProvider is not set');
	}
	return _getContext(needle);
};
let _getContext: ContextProvider = (needle: any) => getAppContext().get(needle);

export function setContextProvider(fn: ContextProvider) {
	_getContext = fn;
}
