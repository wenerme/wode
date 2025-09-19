import 'reflect-metadata';
import { Logger, type INestApplicationContext } from '@nestjs/common';
import { createLazyPromise, type LazyPromise } from '@wener/utils';
import { setContextProvider } from '../ContextProvider';

const log = new Logger('ApplicationContext');

let _context: INestApplicationContext;
let _$context: LazyPromise<INestApplicationContext>;

export function setAppContext(ctx: INestApplicationContext) {
	_context = ctx;
	_$context?.resolve(ctx);
	setContextProvider((needle) => {
		const out = getAppContext().get(needle);
		if (!out) {
			log.warn(`getService(${String(needle)}) not found`);
		}
		return out as any;
	});
	log.log('setAppContext');
}

export function getAppContextAsync() {
	if (_context) {
		return Promise.resolve(_context);
	}
	return (_$context ||= createLazyPromise());
}

export function getAppContext() {
	if (!_context) {
		throw new Error('appContext is not ready');
	}

	return _context;
}
