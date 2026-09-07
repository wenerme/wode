import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sql';
import { createSqliteDialect } from '@wener/server/mikro-orm';
import type { DbConfig } from '../../server/schema';
import { ChatRequestEntity } from '../entities/ChatRequestEntity';
import { McpRequestEntity } from '../entities/McpRequestEntity';
import { RequestLogEntity } from '../entities/RequestLogEntity';
import { ResponseEntity } from '../entities/ResponseEntity';

export { RequestLogEntity };

let orm: MikroORM<SqliteDriver> | null = null;
let initPromise: Promise<MikroORM<SqliteDriver>> | null = null;

async function getOrmConfig(dbConfig?: DbConfig) {
	const dbPath = dbConfig?.path || '.mcps.db';
	return {
		driver: SqliteDriver,
		dbName: dbPath,
		entities: [ChatRequestEntity, McpRequestEntity, RequestLogEntity, ResponseEntity],
		driverOptions: await createSqliteDialect(dbPath),
		debug: process.env.NODE_ENV === 'development',
		allowGlobalContext: true,
	};
}

export async function ensureDbInitialized(dbConfig?: DbConfig): Promise<MikroORM<SqliteDriver>> {
	if (orm) return orm;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const config = await getOrmConfig(dbConfig);
		const initializedOrm = await MikroORM.init<SqliteDriver>(config as any);
		await initializedOrm.schema.update();
		orm = initializedOrm;
		return initializedOrm;
	})();

	try {
		return await initPromise;
	} catch (e) {
		initPromise = null;
		throw e;
	}
}

export function getOrm(): MikroORM<SqliteDriver> {
	if (!orm) throw new Error('Database not initialized');
	return orm;
}

export function getEntityManager() {
	return getOrm().em;
}

export async function closeDb(): Promise<void> {
	if (orm) {
		await orm.close();
		orm = null;
		initPromise = null;
	}
}

export function isDbInitialized(): boolean {
	return orm !== null;
}
