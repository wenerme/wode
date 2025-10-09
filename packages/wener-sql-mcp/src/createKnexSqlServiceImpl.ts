import type { Knex } from 'knex';
import { SqlServiceContract } from '@wener/common/mcp/sql/SqlServiceContract';
import type { Implementer } from '@orpc/server';

export interface KnexSqlServiceConfig {
	/**
	 * Maximum number of rows to return in queries (default: 1000)
	 */
	maxRows?: number;
	/**
	 * Whether to enable read-only mode (default: false)
	 */
	readOnly?: boolean;
	/**
	 * Custom error handler
	 */
	onError?: (error: Error, context: string) => void;
}

export function createKnexSqlServiceImpl(
	knex: Knex,
	config: KnexSqlServiceConfig = {}
): Partial<Implementer<typeof SqlServiceContract, any, any>> {
	const { maxRows = 1000, readOnly = false, onError } = config;

	const handleError = (error: Error, context: string) => {
		if (onError) {
			onError(error, context);
		}
		console.error(`SQL Error in ${context}:`, error);
		throw error;
	};

	const formatRowsAsCsv = (rows: any[]): string => {
		if (rows.length === 0) return '';
		
		const headers = Object.keys(rows[0]);
		const csvRows = rows.map(row => 
			headers.map(header => {
				const value = row[header];
				if (value === null || value === undefined) return '';
				const str = String(value);
				// Escape quotes and wrap in quotes if contains comma, quote, or newline
				if (str.includes(',') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			}).join(',')
		);
		
		return [headers.join(','), ...csvRows].join('\n');
	};

	const formatRowsAsJson = (rows: any[]): any[] => {
		return rows.map(row => {
			const result: any = {};
			for (const [key, value] of Object.entries(row)) {
				// Convert dates to ISO strings
				if (value instanceof Date) {
					result[key] = value.toISOString();
				} else {
					result[key] = value;
				}
			}
			return result;
		});
	};

	const executeQuery = async (query: string, limit?: number) => {
		try {
			let builder = knex.raw(query);
			
			if (limit && limit > 0) {
				// For raw queries, we need to add LIMIT manually
				// This is a simplified approach - in practice, you might want to parse the SQL
				if (!query.toLowerCase().includes('limit')) {
					builder = knex.raw(`${query} LIMIT ${limit}`);
				}
			}

			const result = await builder;
			
			// Handle different result formats based on database type
			if (Array.isArray(result)) {
				// PostgreSQL returns array of rows
				return {
					rows: result.slice(0, limit || maxRows),
					total: result.length,
					affectedRows: result.length
				};
			} else if (result.rows) {
				// Some databases return { rows: [...] }
				return {
					rows: result.rows.slice(0, limit || maxRows),
					total: result.rows.length,
					affectedRows: result.rows.length
				};
			} else if (result[0]) {
				// MySQL returns array of arrays
				const rows = Array.isArray(result[0]) ? result[0] : [result[0]];
				return {
					rows: rows.slice(0, limit || maxRows),
					total: rows.length,
					affectedRows: rows.length
				};
			} else {
				return {
					rows: [],
					total: 0,
					affectedRows: 0
				};
			}
		} catch (error) {
			handleError(error as Error, 'executeQuery');
		}
	};

	const getDatabaseInfo = async () => {
		try {
			const client = knex.client.config.client;
			let versionQuery = '';
			let type = '';

			switch (client) {
				case 'mysql':
				case 'mysql2':
					versionQuery = 'SELECT VERSION() as version';
					type = 'MySQL';
					break;
				case 'pg':
					versionQuery = 'SELECT version() as version';
					type = 'PostgreSQL';
					break;
				case 'sqlite3':
					versionQuery = 'SELECT sqlite_version() as version';
					type = 'SQLite';
					break;
				default:
					versionQuery = 'SELECT 1 as version';
					type = 'Unknown';
			}

			const result = await knex.raw(versionQuery);
			const version = Array.isArray(result) ? result[0]?.version : result.rows?.[0]?.version || 'Unknown';
			
			return { version, type };
		} catch (error) {
			handleError(error as Error, 'getDatabaseInfo');
		}
	};

	const listDatabaseObjects = async (schema?: string) => {
		try {
			const client = knex.client.config.client;
			let query = '';

			switch (client) {
				case 'mysql':
				case 'mysql2':
					query = `
						SELECT 
							TABLE_NAME as name,
							TABLE_TYPE as type,
							TABLE_SCHEMA as schema,
							TABLE_COMMENT as description
						FROM information_schema.TABLES 
						WHERE TABLE_SCHEMA = ? OR ? IS NULL
						ORDER BY TABLE_TYPE, TABLE_NAME
					`;
					break;
				case 'pg':
					query = `
						SELECT 
							tablename as name,
							CASE 
								WHEN schemaname = 'pg_catalog' THEN 'system table'
								WHEN schemaname = 'information_schema' THEN 'system view'
								ELSE 'table'
							END as type,
							schemaname as schema,
							obj_description(c.oid) as description
						FROM pg_tables t
						LEFT JOIN pg_class c ON c.relname = t.tablename
						WHERE schemaname = ? OR ? IS NULL
						UNION ALL
						SELECT 
							viewname as name,
							'view' as type,
							schemaname as schema,
							obj_description(c.oid) as description
						FROM pg_views v
						LEFT JOIN pg_class c ON c.relname = v.viewname
						WHERE schemaname = ? OR ? IS NULL
						ORDER BY type, name
					`;
					break;
				case 'sqlite3':
					query = `
						SELECT 
							name,
							type,
							'sqlite' as schema,
							NULL as description
						FROM sqlite_master 
						WHERE type IN ('table', 'view', 'index')
						ORDER BY type, name
					`;
					break;
				default:
					return { objects: [] };
			}

			const result = await knex.raw(query, schema ? [schema, schema, schema, schema] : [null, null, null, null]);
			const rows = Array.isArray(result) ? result : result.rows || [];
			
			return {
				objects: rows.map((row: any) => ({
					name: row.name,
					type: row.type,
					schema: row.schema,
					description: row.description || undefined
				}))
			};
		} catch (error) {
			handleError(error as Error, 'listDatabaseObjects');
		}
	};

	const describeDatabaseObject = async (object: string, schema?: string) => {
		try {
			const client = knex.client.config.client;
			let query = '';
			let columnQuery = '';
			let indexQuery = '';

			switch (client) {
				case 'mysql':
				case 'mysql2':
					columnQuery = `
						SELECT 
							COLUMN_NAME as name,
							DATA_TYPE as type,
							IS_NULLABLE = 'YES' as nullable,
							COLUMN_DEFAULT as default,
							COLUMN_KEY as key,
							EXTRA as extra
						FROM information_schema.COLUMNS 
						WHERE TABLE_NAME = ? AND (TABLE_SCHEMA = ? OR ? IS NULL)
						ORDER BY ORDINAL_POSITION
					`;
					indexQuery = `
						SELECT 
							INDEX_NAME as name,
							GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
							NON_UNIQUE = 0 as unique,
							INDEX_TYPE as type
						FROM information_schema.STATISTICS 
						WHERE TABLE_NAME = ? AND (TABLE_SCHEMA = ? OR ? IS NULL)
						GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE
						ORDER BY INDEX_NAME
					`;
					break;
				case 'pg':
					columnQuery = `
						SELECT 
							column_name as name,
							data_type as type,
							is_nullable = 'YES' as nullable,
							column_default as default,
							CASE 
								WHEN pk.column_name IS NOT NULL THEN 'PRI'
								WHEN uk.column_name IS NOT NULL THEN 'UNI'
								WHEN fk.column_name IS NOT NULL THEN 'MUL'
							END as key,
							NULL as extra
						FROM information_schema.columns c
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = ?
						) pk ON c.column_name = pk.column_name
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = ?
						) uk ON c.column_name = uk.column_name
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ?
						) fk ON c.column_name = fk.column_name
						WHERE c.table_name = ? AND (c.table_schema = ? OR ? IS NULL)
						ORDER BY c.ordinal_position
					`;
					indexQuery = `
						SELECT 
							indexname as name,
							array_to_string(array_agg(attname ORDER BY attnum), ',') as columns,
							NOT indisunique as unique,
							indexdef as type
						FROM pg_index i
						JOIN pg_class c ON c.oid = i.indexrelid
						JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
						WHERE i.indrelid = (
							SELECT oid FROM pg_class WHERE relname = ? AND (relnamespace = (
								SELECT oid FROM pg_namespace WHERE nspname = ? OR ? IS NULL
							))
						)
						GROUP BY indexname, indisunique, indexdef
						ORDER BY indexname
					`;
					break;
				case 'sqlite3':
					columnQuery = `
						PRAGMA table_info(?)
					`;
					indexQuery = `
						PRAGMA index_list(?)
					`;
					break;
				default:
					return {
						object,
						type: 'unknown',
						schema,
						description: 'Unknown database type'
					};
			}

			// Get columns
			const columnResult = await knex.raw(columnQuery, 
				client === 'sqlite3' ? [object] : 
				client === 'pg' ? [object, object, object, object, schema, schema] :
				[object, schema, schema]
			);
			const columns = Array.isArray(columnResult) ? columnResult : columnResult.rows || [];

			// Get indexes
			const indexResult = await knex.raw(indexQuery, 
				client === 'sqlite3' ? [object] :
				client === 'pg' ? [object, schema, schema] :
				[object, schema, schema]
			);
			const indexes = Array.isArray(indexResult) ? indexResult : indexResult.rows || [];

			// Get object type
			const typeResult = await knex.raw(`
				SELECT 
					CASE 
						WHEN type = 'table' THEN 'table'
						WHEN type = 'view' THEN 'view'
						ELSE type
					END as type
				FROM sqlite_master 
				WHERE name = ?
			`, [object]);

			const objectType = Array.isArray(typeResult) ? typeResult[0]?.type : typeResult.rows?.[0]?.type || 'table';

			return {
				object,
				type: objectType,
				schema,
				columns: columns.map((col: any) => ({
					name: col.name,
					type: col.type,
					nullable: col.nullable,
					default: col.default,
					key: col.key,
					extra: col.extra
				})),
				indexes: indexes.map((idx: any) => ({
					name: idx.name,
					columns: idx.columns.split(',').map((c: string) => c.trim()),
					unique: idx.unique,
					type: idx.type
				}))
			};
		} catch (error) {
			handleError(error as Error, 'describeDatabaseObject');
		}
	};

	return {
		queryCsv: async ({ query }) => {
			const result = await executeQuery(query);
			const csv = formatRowsAsCsv(result.rows);
			return {
				content: [{ type: 'text' as const, text: csv }]
			};
		},

		queryJson: async ({ query }) => {
			const result = await executeQuery(query);
			const json = formatRowsAsJson(result.rows);
			return {
				content: [{ type: 'text' as const, text: JSON.stringify(json, null, 2) }]
			};
		},

		executeSql: async ({ query }) => {
			if (readOnly && /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|MERGE|REPLACE)/i.test(query)) {
				throw new Error('Write operations are not allowed in read-only mode');
			}
			
			const result = await executeQuery(query);
			return {
				rows: formatRowsAsJson(result.rows),
				total: result.total,
				affectedRows: result.affectedRows
			};
		},

		executeDml: async ({ query }) => {
			if (readOnly) {
				throw new Error('DML operations are not allowed in read-only mode');
			}
			
			const result = await executeQuery(query);
			return {
				message: `Operation completed successfully`,
				affectedRows: result.affectedRows
			};
		},

		executeDdl: async ({ query }) => {
			if (readOnly) {
				throw new Error('DDL operations are not allowed in read-only mode');
			}
			
			await executeQuery(query);
			return {
				message: `DDL operation completed successfully`
			};
		},

		getVersion: async () => {
			return await getDatabaseInfo();
		},

		listObjects: async ({ schema }) => {
			return await listDatabaseObjects(schema);
		},

		describeObject: async ({ object, schema }) => {
			return await describeDatabaseObject(object, schema);
		}
	};
}