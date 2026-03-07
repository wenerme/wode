import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export type Dialect = 'mysql' | 'postgres' | 'sqlite' | 'mssql';

export function detectDialect(url: string): Dialect {
	if (url.startsWith('mysql://') || url.startsWith('mysql2://')) {
		return 'mysql';
	}
	if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
		return 'postgres';
	}
	if (url.startsWith('mssql://') || url.startsWith('sqlserver://')) {
		return 'mssql';
	}
	if (
		url.startsWith('sqlite://') ||
		url.startsWith('sqlite//') ||
		url.startsWith('file:') ||
		url.endsWith('.db') ||
		url.endsWith('.sqlite') ||
		url === ':memory:'
	) {
		return 'sqlite';
	}
	throw new Error(`Unsupported database URL: ${url}`);
}

export async function createKyselyInstance(
	url: string,
	dialect: Dialect,
): Promise<{ db: Kysely<any>; ownsConnection: boolean }> {
	const { Kysely } = await import('kysely');
	let db: Kysely<any>;

	switch (dialect) {
		case 'postgres': {
			const { Pool } = await import('pg');
			const { PostgresDialect } = await import('kysely');
			const pool = new Pool({
				connectionString: url,
				connectionTimeoutMillis: 30000,
				idleTimeoutMillis: 30000,
				max: 10,
				statement_timeout: 120_000,
				query_timeout: 120_000,
			});
			pool.on('error', (err) => {
				console.error('[pg] Pool client error:', err.message);
			});
			db = new Kysely({
				dialect: new PostgresDialect({ pool }),
			});
			break;
		}
		case 'mysql': {
			const mysql = await import('mysql2');
			const { MysqlDialect } = await import('kysely');
			db = new Kysely({
				dialect: new MysqlDialect({
					pool: mysql.createPool({
						uri: url,
						connectTimeout: 30000, // 30 seconds (default is 10s)
						waitForConnections: true,
						connectionLimit: 10,
						queueLimit: 0,
					}),
				}),
			});
			break;
		}
		case 'sqlite': {
			const BetterSqlite3 = (await import('better-sqlite3')).default;
			const { SqliteDialect } = await import('kysely');
			let filename = url;
			if (filename.startsWith('sqlite://')) {
				filename = filename.replace(/^sqlite:\/\//, '');
			} else if (filename.startsWith('sqlite//')) {
				filename = filename.replace(/^sqlite\/\//, '');
			}
			db = new Kysely({
				dialect: new SqliteDialect({
					database: new BetterSqlite3(filename),
				}),
			});
			break;
		}
		case 'mssql': {
			const tarn = await import('tarn');
			const tedious = await import('tedious');
			const { MssqlDialect } = await import('kysely');

			// Parse connection string to config
			const urlObj = new URL(url.replace(/^mssql:\/\//, 'http://').replace(/^sqlserver:\/\//, 'http://'));
			const config = {
				server: urlObj.hostname,
				authentication: {
					type: 'default' as const,
					options: {
						userName: urlObj.username,
						password: urlObj.password,
					},
				},
				options: {
					database: urlObj.pathname.slice(1),
					port: parseInt(urlObj.port, 10) || 1433,
					trustServerCertificate: true,
				},
			};

			db = new Kysely({
				dialect: new MssqlDialect({
					tarn: {
						...tarn,
						options: {
							min: 0,
							max: 10,
						},
					},
					tedious: {
						...tedious,
						connectionFactory: () => new tedious.Connection(config as any),
					},
				}),
			});
			break;
		}
		default:
			throw new Error(`Unsupported dialect: ${dialect}`);
	}

	// Test connection
	await sql`SELECT 1`.execute(db);

	return { db, ownsConnection: true };
}

export async function getVersion(db: Kysely<any>, dialect: Dialect): Promise<string> {
	switch (dialect) {
		case 'mysql': {
			const result = await sql<{ version: string }>`SELECT VERSION() as version`.execute(db);
			return `MySQL ${result.rows[0]?.version ?? 'unknown'}`;
		}
		case 'postgres': {
			const result = await sql<{ version: string }>`SELECT version()`.execute(db);
			return result.rows[0]?.version ?? 'PostgreSQL unknown';
		}
		case 'sqlite': {
			const result = await sql<{ version: string }>`SELECT sqlite_version() as version`.execute(db);
			return `SQLite ${result.rows[0]?.version ?? 'unknown'}`;
		}
		case 'mssql': {
			const result = await sql<{ version: string }>`SELECT @@VERSION as version`.execute(db);
			return result.rows[0]?.version ?? 'SQL Server unknown';
		}
	}
}

export async function listObjects(
	db: Kysely<any>,
	dialect: Dialect,
	type: string,
	schema?: string,
): Promise<{ name: string; type: string; schema?: string }[]> {
	switch (dialect) {
		case 'mysql': {
			let dbName = schema;
			if (!dbName) {
				const dbResult = await sql<{ db: string }>`SELECT DATABASE() as db`.execute(db);
				dbName = dbResult.rows[0]?.db;
			}
			let query = sql<{ name: string; type: string }>`
				SELECT TABLE_NAME as name, TABLE_TYPE as type
				FROM information_schema.TABLES
				WHERE TABLE_SCHEMA = ${dbName}
			`;
			if (type === 'table') {
				query = sql`${query} AND TABLE_TYPE = 'BASE TABLE'`;
			} else if (type === 'view') {
				query = sql`${query} AND TABLE_TYPE = 'VIEW'`;
			}
			const result = await query.execute(db);
			return result.rows;
		}
		case 'postgres': {
			const schemaName = schema ?? 'public';
			let query = sql<{ name: string; type: string }>`
				SELECT table_name as name, table_type as type
				FROM information_schema.tables
				WHERE table_schema = ${schemaName}
			`;
			if (type === 'table') {
				query = sql`${query} AND table_type = 'BASE TABLE'`;
			} else if (type === 'view') {
				query = sql`${query} AND table_type = 'VIEW'`;
			}
			const result = await query.execute(db);
			return result.rows;
		}
		case 'sqlite': {
			let typeFilter = '';
			if (type === 'table') {
				typeFilter = "type = 'table'";
			} else if (type === 'view') {
				typeFilter = "type = 'view'";
			} else {
				typeFilter = "type IN ('table', 'view')";
			}
			const result = await sql<{ name: string; type: string }>`
				SELECT name, type FROM sqlite_master
				WHERE ${sql.raw(typeFilter)} AND name NOT LIKE 'sqlite_%'
			`.execute(db);
			return result.rows;
		}
		case 'mssql': {
			const schemaName = schema ?? 'dbo';
			let query = sql<{ name: string; type: string }>`
				SELECT TABLE_NAME as name, TABLE_TYPE as type
				FROM INFORMATION_SCHEMA.TABLES
				WHERE TABLE_SCHEMA = ${schemaName}
			`;
			if (type === 'table') {
				query = sql`${query} AND TABLE_TYPE = 'BASE TABLE'`;
			} else if (type === 'view') {
				query = sql`${query} AND TABLE_TYPE = 'VIEW'`;
			}
			const result = await query.execute(db);
			return result.rows;
		}
	}
}

export async function describeObject(
	db: Kysely<any>,
	dialect: Dialect,
	objectName: string,
	schema?: string,
): Promise<{ columns: unknown[]; indexes?: unknown[] }> {
	switch (dialect) {
		case 'mysql': {
			let dbName = schema;
			if (!dbName) {
				const dbResult = await sql<{ db: string }>`SELECT DATABASE() as db`.execute(db);
				dbName = dbResult.rows[0]?.db;
			}
			const colResult = await sql`
				SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as nullable,
				       COLUMN_KEY as \`key\`, COLUMN_DEFAULT as default_value, EXTRA as extra
				FROM information_schema.COLUMNS
				WHERE TABLE_SCHEMA = ${dbName} AND TABLE_NAME = ${objectName}
				ORDER BY ORDINAL_POSITION
			`.execute(db);
			const idxResult = await sql`
				SELECT INDEX_NAME as name, COLUMN_NAME as column_name, NON_UNIQUE as non_unique
				FROM information_schema.STATISTICS
				WHERE TABLE_SCHEMA = ${dbName} AND TABLE_NAME = ${objectName}
			`.execute(db);
			return {
				columns: colResult.rows,
				indexes: idxResult.rows,
			};
		}
		case 'postgres': {
			const schemaName = schema ?? 'public';
			const colResult = await sql`
				SELECT column_name as name, data_type as type, is_nullable as nullable,
				       column_default as default_value
				FROM information_schema.columns
				WHERE table_schema = ${schemaName} AND table_name = ${objectName}
				ORDER BY ordinal_position
			`.execute(db);
			const idxResult = await sql`
				SELECT indexname as name, indexdef as definition
				FROM pg_indexes
				WHERE schemaname = ${schemaName} AND tablename = ${objectName}
			`.execute(db);
			return {
				columns: colResult.rows,
				indexes: idxResult.rows,
			};
		}
		case 'sqlite': {
			const colResult = await sql.raw(`PRAGMA table_info('${objectName}')`).execute(db);
			const idxResult = await sql.raw(`PRAGMA index_list('${objectName}')`).execute(db);
			return {
				columns: colResult.rows,
				indexes: idxResult.rows,
			};
		}
		case 'mssql': {
			const schemaName = schema ?? 'dbo';
			const colResult = await sql`
				SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as nullable,
				       COLUMN_DEFAULT as default_value
				FROM INFORMATION_SCHEMA.COLUMNS
				WHERE TABLE_SCHEMA = ${schemaName} AND TABLE_NAME = ${objectName}
				ORDER BY ORDINAL_POSITION
			`.execute(db);
			const idxResult = await sql`
				SELECT i.name, c.name as column_name, i.is_unique
				FROM sys.indexes i
				JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
				JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
				WHERE i.object_id = OBJECT_ID(${`${schemaName}.${objectName}`})
			`.execute(db);
			return {
				columns: colResult.rows,
				indexes: idxResult.rows,
			};
		}
	}
}

export function formatTable(rows: unknown[]): string {
	if (!rows.length) return '(no results)';
	const arr = rows as Record<string, unknown>[];
	const keys = Object.keys(arr[0]);
	const widths = keys.map((k) => Math.max(k.length, ...arr.map((r) => String(r[k] ?? '').length)));

	const header = keys.map((k, i) => k.padEnd(widths[i])).join(' | ');
	const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
	const body = arr.map((row) => keys.map((k, i) => String(row[k] ?? '').padEnd(widths[i])).join(' | ')).join('\n');

	return `${header}\n${separator}\n${body}`;
}
