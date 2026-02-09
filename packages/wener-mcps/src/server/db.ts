import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { MikroORM, type Options } from '@mikro-orm/core';
import { ChatRequestEntity } from '../entities/ChatRequestEntity';
import { McpRequestEntity } from '../entities/McpRequestEntity';
import { RequestLogEntity } from '../entities/RequestLogEntity';
import { ResponseEntity } from '../entities/ResponseEntity';
import type { DbConfig } from './schema';

let orm: MikroORM<BetterSqliteDriver> | null = null;
let initPromise: Promise<MikroORM<BetterSqliteDriver>> | null = null;
let storedDbConfig: DbConfig | undefined;

/**
 * Get MikroORM configuration
 */
export function getOrmConfig(dbConfig?: DbConfig): Options<BetterSqliteDriver> {
	const dbPath = dbConfig?.path || '.mcps.db';

	return {
		driver: BetterSqliteDriver,
		dbName: dbPath,
		entities: [ChatRequestEntity, McpRequestEntity, RequestLogEntity, ResponseEntity],
		// Enable debug in development
		debug: process.env.NODE_ENV === 'development',
		// Allow global context for simpler usage
		allowGlobalContext: true,
	};
}

/**
 * Initialize MikroORM and sync schema
 */
export async function initializeDb(dbConfig?: DbConfig): Promise<MikroORM<BetterSqliteDriver>> {
	if (orm) {
		return orm;
	}

	// If already initializing, wait for the existing promise
	if (initPromise) {
		return initPromise;
	}

	storedDbConfig = dbConfig;

	initPromise = (async () => {
		const config = getOrmConfig(dbConfig);
		orm = await MikroORM.init(config);

		// Sync schema (create tables if not exist)
		const generator = orm.getSchemaGenerator();
		await generator.updateSchema();

		return orm;
	})();

	try {
		return await initPromise;
	} catch (e) {
		// Reset on failure so retry is possible
		initPromise = null;
		throw e;
	}
}

/**
 * Configure DB for lazy initialization (stores config without initializing)
 */
export function configureDb(dbConfig?: DbConfig): void {
	storedDbConfig = dbConfig;
}

/**
 * Ensure DB is initialized (lazy init on first call)
 * Returns the ORM instance, initializing if needed
 */
export async function ensureDbInitialized(): Promise<MikroORM<BetterSqliteDriver>> {
	if (orm) {
		return orm;
	}
	return initializeDb(storedDbConfig);
}

/**
 * Get MikroORM instance (must be initialized first)
 */
export function getOrm(): MikroORM<BetterSqliteDriver> {
	if (!orm) {
		throw new Error('Database not initialized. Call initializeDb() first.');
	}
	return orm;
}

/**
 * Get EntityManager
 */
export function getEntityManager() {
	return getOrm().em;
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
	if (orm) {
		await orm.close();
		orm = null;
		initPromise = null;
	}
}

/**
 * Check if database is initialized
 */
export function isDbInitialized(): boolean {
	return orm !== null;
}
