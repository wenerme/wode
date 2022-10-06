import pino from 'pino';
import { SQLiteStorage, SQLiteStorageOptions } from './SQLiteStorage';
import { InitUnpkgOptions, Unpkg } from './Unpkg';

export interface CreateUnpkgOptions extends Partial<InitUnpkgOptions> {
  sqlite?: SQLiteStorageOptions;
}

export async function createUnpkg(o: CreateUnpkgOptions = {}) {
  const logger =
    process.env.NODE_ENV === 'development'
      ? pino(pino({ name: 'Unpkg', transport: { target: 'pino-pretty', level: 'trace' } }))
      : pino(pino({ name: 'Unpkg' }));

  const unpkg = new Unpkg({
    logger,
    storage: new SQLiteStorage(o.sqlite),
    ...o,
  });
  await unpkg.init();
  return unpkg;
}
