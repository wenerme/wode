import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sql';
import { createSqliteDialect } from '../../orm/createSqliteDialect';
import { FileNodeContentEntity, FileNodeMetaEntity } from './createDatabaseFileSystem';

export async function loadTestDatabase() {
	const orm = await MikroORM.init({
		driver: SqliteDriver,
		dbName: ':memory:',
		entities: [FileNodeContentEntity, FileNodeMetaEntity],
		driverOptions: await createSqliteDialect(':memory:'),
	});

	await orm.schema.create();

	return {
		orm,
		em: orm.em.fork(),
	};
}
