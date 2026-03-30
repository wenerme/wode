import { NodeSqliteDialect } from '@mikro-orm/sql';
import { SqliteDialect } from 'kysely';

type SqliteUdf = Record<string, (...args: unknown[]) => unknown>;

export interface CreateSqliteDialectOptions {
	functions?: SqliteUdf;
}

/**
 * Create a Kysely SQLite dialect based on the current runtime.
 * - Bun: uses bun:sqlite via kysely-bun-sqlite
 * - Node.js 22.5+: uses node:sqlite via NodeSqliteDialect
 */
export async function createSqliteDialect(dsn: string, { functions = {} }: CreateSqliteDialectOptions = {}) {
	if (typeof (globalThis as any).Bun !== 'undefined') {
		// @ts-expect-error bun-only module
		const { BunSqliteDialect } = await import('kysely-bun-sqlite');
		// @ts-expect-error bun-only module
		const { Database } = await import('bun:sqlite');
		const db = new Database(dsn);
		for (const [name, fn] of Object.entries(functions)) {
			db.function(name, fn as (...args: any[]) => any);
		}
		return new BunSqliteDialect({ database: db });
	}

	if (Object.keys(functions).length > 0) {
		const { DatabaseSync } = await import('node:sqlite');
		const db = new DatabaseSync(dsn);
		for (const [name, fn] of Object.entries(functions)) {
			db.function(name, fn as (...args: any[]) => any);
		}
		return new SqliteDialect({ database: db as any });
	}

	return new NodeSqliteDialect(dsn);
}
