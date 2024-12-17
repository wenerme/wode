import type { EntityManager, MikroORM, Options } from '@mikro-orm/better-sqlite';

async function createLocalDatabase(options: Partial<Options>): LocalDatabase {
  // https://github.com/nalgeon/sqlean
  const { defineConfig, MikroORM } = await import('@mikro-orm/better-sqlite');
  // ~/.local/state/wener/wode.local.db
  const orm = await MikroORM.init(
    defineConfig({
      // dbName: 'wode.local.db',
      dbName: os.homedir() + '/.local/state/wener/wode.local.db',
      entities: [],
      ...options,
    }),
  );
  const em = orm;
  return {
    orm,
    em,
  };
}

type LocalDatabase = {
  orm: MikroORM;
  em: EntityManager;
};

let _localDatabase: LocalDatabase | undefined;

export async function loadLocalDatabase(options: Partial<Options>) {
  if (_localDatabase) {
    throw new Error('Local database already loaded');
  }
  _localDatabase = {
    get orm() {
      throw new Error('Local database not loaded');
    },
    get em() {
      throw new Error('Local database not loaded');
    },
  };
  try {
    _localDatabase = await createLocalDatabase(options);
  } catch (e) {
    _localDatabase = undefined;
    throw e;
  }
}

export function getLocalDatabase() {
  if (_localDatabase) {
    throw new Error('Local database already loaded');
  }
  throw new Error('Local database not loaded');
}
