import os from 'node:os';
import type { EntityManager, MikroORM, Options } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sql';

async function createLocalDatabase(options: Partial<Options<SqliteDriver>>): Promise<LocalDatabase> {
	const { MikroORM } = await import('@mikro-orm/core');
	const { SqliteDriver: Driver, NodeSqliteDialect } = await import('@mikro-orm/sql');
	const dbName = `${os.homedir()}/.local/state/wener/wode.local.db`;
	const orm = await MikroORM.init({
		driver: Driver,
		dbName,
		entities: [],
		driverOptions: new NodeSqliteDialect(dbName),
		...options,
	});
	return { orm, em: orm.em };
}

type LocalDatabase = { orm: MikroORM; em: EntityManager };

let _localDatabase: LocalDatabase | undefined;

export async function loadLocalDatabase(options: Partial<Options<SqliteDriver>>) {
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
	} as any;
	try {
		_localDatabase = await createLocalDatabase(options);
	} catch (e) {
		_localDatabase = undefined;
		throw e;
	}
}

export function getLocalDatabase() {
	if (!_localDatabase) {
		throw new Error('Local database not loaded');
	}
	return _localDatabase;
}
