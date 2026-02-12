import { NodeSqliteDialect } from '@mikro-orm/sql';

/**
 * Create a Kysely SQLite dialect based on the current runtime.
 * - Bun: uses bun:sqlite via kysely-bun-sqlite
 * - Node.js 22.5+: uses node:sqlite via NodeSqliteDialect
 */
export async function createSqliteDialect(dbName: string) {
	if (typeof (globalThis as any).Bun !== 'undefined') {
		// @ts-ignore bun-only module
		const { BunSqliteDialect } = await import('kysely-bun-sqlite');
		// @ts-ignore bun-only module
		const { Database } = await import('bun:sqlite');
		return new BunSqliteDialect({ database: new Database(dbName) });
	}
	return new NodeSqliteDialect(dbName);
}
