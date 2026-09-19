import pino from 'pino';
import type { Logger } from '@wener/utils';
import { SQLiteStorage, type SQLiteStorageOptions } from './SQLiteStorage';
import { type InitUnpkgOptions, Unpkg } from './Unpkg';

export interface CreateUnpkgOptions extends Partial<InitUnpkgOptions> {
	sqlite?: SQLiteStorageOptions;
}

export async function createUnpkg(o: CreateUnpkgOptions = {}) {
	const pinoLogger =
		process.env.NODE_ENV === 'development'
			? pino(pino({ name: 'Unpkg', transport: { target: 'pino-pretty', level: 'trace' } }))
			: pino(pino({ name: 'Unpkg' }));
	const logger: Logger = {
		log: pinoLogger.info.bind(pinoLogger),
		info: pinoLogger.info.bind(pinoLogger),
		warn: pinoLogger.warn.bind(pinoLogger),
		error: pinoLogger.error.bind(pinoLogger),
		debug: pinoLogger.debug.bind(pinoLogger),
		trace: pinoLogger.trace.bind(pinoLogger),
	};

	const unpkg = new Unpkg({ logger, storage: new SQLiteStorage(o.sqlite), ...o });
	await unpkg.init();
	return unpkg;
}
