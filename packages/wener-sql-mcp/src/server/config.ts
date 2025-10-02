import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import type { Knex } from 'knex';
import { z } from 'zod';

/**
 * Supported database types
 */
export enum DatabaseType {
	PostgreSQL = 'PostgreSQL',
	MySQL = 'MySQL',
	SQLite = 'SQLite',
	MSSQL = 'MSSQL',
}

/**
 * Database type configuration
 */
export interface DatabaseTypeConfig {
	/** Knex driver name */
	driver: string;
	/** Default port number */
	port: number;
	/** Whether this database uses connection pooling */
	usesPooling: boolean;
	/** Whether this database requires useNullAsDefault */
	useNullAsDefault?: boolean;
}

/**
 * Mapping from database type to configuration
 */
export const DATABASE_TYPE_CONFIG: Record<DatabaseType, DatabaseTypeConfig> = {
	[DatabaseType.PostgreSQL]: {
		driver: 'pg',
		port: 5432,
		usesPooling: true,
	},
	[DatabaseType.MySQL]: {
		driver: 'mysql2',
		port: 3306,
		usesPooling: true,
	},
	[DatabaseType.SQLite]: {
		driver: 'better-sqlite3',
		port: 0, // Not applicable
		usesPooling: false,
		useNullAsDefault: true,
	},
	[DatabaseType.MSSQL]: {
		driver: 'mssql',
		port: 1433,
		usesPooling: true,
	},
};

/**
 * Extract database type from connection URL protocol
 * @param url - Database connection URL
 * @returns DatabaseType or null if cannot be determined
 */
export function extractDatabaseTypeFromUrl(url: string): DatabaseType | null {
	try {
		const protocol = url.split('://')[0]?.toLowerCase();
		if (!protocol) return null;

		// Handle special protocols that don't match driver names
		if (protocol === 'file') {
			return DatabaseType.SQLite;
		}
		if (protocol === 'tedious') {
			return DatabaseType.MSSQL;
		}

		// Try to resolve using existing driver resolution logic
		try {
			return resolveDatabaseType(protocol);
		} catch {
			return null;
		}
	} catch {
		return null;
	}
}

/**
 * Resolve driver name or alias to database type
 */
export function resolveDatabaseType(driver: string): DatabaseType {
	const normalized = driver.toLowerCase().trim();

	switch (normalized) {
		// PostgreSQL aliases
		case 'pg':
		case 'postgres':
		case 'postgresql':
			return DatabaseType.PostgreSQL;

		// MySQL aliases
		case 'mysql':
		case 'mysql2':
			return DatabaseType.MySQL;

		// SQLite aliases
		case 'sqlite':
		case 'sqlite3':
		case 'better-sqlite3':
			return DatabaseType.SQLite;

		// MSSQL aliases
		case 'mssql':
		case 'sqlserver':
		case 'sql-server':
		case 'ms-sql':
			return DatabaseType.MSSQL;

		default:
			throw new Error(
				`Invalid database driver: "${driver}". Valid drivers: pg, postgres, postgresql, mysql, mysql2, sqlite, sqlite3, better-sqlite3, mssql, sqlserver, sql-server, ms-sql`,
			);
	}
}

const SqlConfigConnectionSchema = z.union([
	z.string().url(),
	z.object({
		host: z.string(),
		port: z.number().int().positive(),
		user: z.string(),
		password: z.string(),
		database: z.string(),
	}),
	z.object({
		filename: z.string(),
	}),
]);

export const SqlConfigSchema = z
	.object({
		client: z.enum(DatabaseType),
		connection: SqlConfigConnectionSchema,
		readonly: z.boolean().default(false),
	})
	.strict();

export type SqlConfig = z.infer<typeof SqlConfigSchema>;

/**
 * Get SQL configuration from environment variables
 */
export function getSqlConfig({
	logger = consola.withTag('sql-config'),
}: {
	logger?: ConsolaInstance;
} = {}): SqlConfig {
	const dbUrl = process.env.DB_URL;
	const dbDriver = process.env.DB_DRIVER;
	const readonly = process.env.DB_READONLY === 'true' || process.env.DB_READONLY === '1';

	// Try to detect database type from URL first
	let client: DatabaseType | null = null;

	if (dbUrl) {
		client = extractDatabaseTypeFromUrl(dbUrl);
		if (client && consola.level > 0) {
			logger.info(`Auto-detected database type from URL: ${client}`);
		}
	}

	// Fall back to DB_DRIVER if URL detection failed
	if (!client) {
		if (!dbDriver) {
			throw new Error(
				'Unable to determine database type. Please provide either:\n'
					+ '  1. DB_URL with protocol (e.g., postgresql://...)\n'
					+ '  2. DB_DRIVER (e.g., pg, mysql2, sqlite, mssql)',
			);
		}
		client = resolveDatabaseType(dbDriver);
		if (consola.level > 0) {
			logger.info(`Using database type from DB_DRIVER: ${client}`);
		}
	}

	let rawConfig: any;

	// For SQLite, handle file path or :memory:
	if (client === DatabaseType.SQLite) {
		const filename = dbUrl
			? dbUrl.replace(/^sqlite:\/\//, '').replace(/^file:\/\//, '')
			: process.env.DB_FILE || ':memory:';
		rawConfig = {
			client,
			connection: { filename },
			readonly,
		};
	}
	// For other databases, prefer DB_URL
	else if (dbUrl) {
		rawConfig = {
			client,
			connection: dbUrl,
			readonly,
		};
	}
	// Fall back to individual connection parameters
	else {
		const host = process.env.DB_HOST || 'localhost';
		const dbConfig = DATABASE_TYPE_CONFIG[client];
		const port = parseInt(process.env.DB_PORT || String(dbConfig.port));
		const user = process.env.DB_USER || process.env.DB_USERNAME;
		const password = process.env.DB_PASSWORD || process.env.DB_PASS;
		const database = process.env.DB_DATABASE || process.env.DB_NAME;

		if (!user) {
			throw new Error('DB_USER (or DB_USERNAME) is required when DB_URL is not provided');
		}

		if (!database) {
			throw new Error('DB_DATABASE (or DB_NAME) is required when DB_URL is not provided');
		}

		rawConfig = {
			client,
			connection: {
				host,
				port,
				user,
				password: password || '',
				database: database as string,
			},
			readonly,
		};
	}

	// Parse and validate configuration using Zod schema
	const config = SqlConfigSchema.parse(rawConfig);

	logger.info('SQL configuration loaded', {
		client: config.client,
		readonly: config.readonly,
		connectionType: typeof config.connection === 'string' ? 'url' : 'config',
	});

	return config;
}

/**
 * Get database type configuration
 */
export function getDatabaseConfig(type: DatabaseType): DatabaseTypeConfig {
	return DATABASE_TYPE_CONFIG[type];
}

/**
 * Get Knex driver name for a database type
 */
export function getDatabaseDriver(type: DatabaseType): string {
	return getDatabaseConfig(type).driver;
}

/**
 * Get default port for a database type
 */
export function getDatabasePort(type: DatabaseType): number {
	return getDatabaseConfig(type).port;
}

/**
 * Create Knex configuration from SQL config
 */
export function createKnexConfig(config: SqlConfig): Knex.Config {
	const dbConfig = getDatabaseConfig(config.client);

	const knexConfig: Knex.Config = {
		client: dbConfig.driver,
		connection: config.connection,
	};

	// Database-specific options
	if (dbConfig.useNullAsDefault) {
		knexConfig.useNullAsDefault = true;
	}

	if (dbConfig.usesPooling) {
		knexConfig.pool = {
			min: 2,
			max: 10,
		};
	}

	return knexConfig;
}
