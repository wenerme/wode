import { type Constructor, getObjectId } from '@wener/utils';

export type TypeToken<T> = Constructor<T> | Constructor | Function | string | symbol;

export interface IApplicationContext {
	get<TInput = any, TResult = TInput>(needle: TypeToken<TInput>): TResult;
	resolve<TInput = any, TResult = TInput>(needle: TypeToken<TInput>): Promise<TResult>;
}

// export const ApplicationContextTypeToken = defineSymbolTypeToken<IApplicationContext>('ApplicationContext');

export function defineTypeToken<T>(name: string): TypeToken<T> & symbol {
	return Symbol.for(`Type<${name}>`);
}

const tokens = new WeakMap<any, string | symbol>();

export function getTypeToken<T>(needle: TypeToken<T>): TypeToken<T> & (string | symbol) {
	let s: string | symbol;
	if (typeof needle === 'function') {
		s = tokens.get(needle) || '';
		if (!s) {
			s = `Type<${needle.name || 'anonymous'}#${getObjectId(needle)}>`;
			tokens.set(needle, s);
		}
	} else if (typeof needle === 'symbol' || typeof needle === 'string') {
		s = needle;
	} else {
		throw new Error(`Invalid needle: ${needle}`);
	}
	return s;
}

export function getAppContext<T extends IApplicationContext = IApplicationContext>(): T {
	if (!_ctx) throw new Error('ApplicationContext is not initialized');
	return _ctx as T;
}

let _ctx: IApplicationContext;

export function setAppContext(app: IApplicationContext) {
	_ctx = app;
}
