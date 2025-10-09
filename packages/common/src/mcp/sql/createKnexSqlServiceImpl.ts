import type { Knex } from 'knex';
import { z } from 'zod';
import { SqlServiceContract } from './SqlServiceContract';

export interface KnexSqlServiceConfig {
	knex: Knex;
	readonly?: boolean;
}

export function createKnexSqlServiceImpl(config: KnexSqlServiceConfig) {
	const { knex, readonly = false } = config;

	// Helper function to execute SQL and return results
	async function executeQuery(sql: string, params: any[] = []) {
		try {
			const result = await knex.raw(sql, params);
			
			// Handle different database result formats
			if (Array.isArray(result)) {
				// PostgreSQL returns array of results
				if (result.length === 1 && result[0].rows) {
					return {
						rows: result[0].rows,
						rowCount: result[0].rowCount || result[0].rows.length,
					};
				}
				// MySQL returns array of rows
				return {
					rows: result,
					rowCount: result.length,
				};
			}
			
			// Single result object
			if (result.rows) {
				return {
					rows: result.rows,
					rowCount: result.rowCount || result.rows.length,
				};
			}
			
			// Direct array result
			if (Array.isArray(result)) {
				return {
					rows: result,
					rowCount: result.length,
				};
			}
			
			return {
				rows: [],
				rowCount: 0,
			};
		} catch (error) {
			throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Helper function to check if query is read-only
	function isReadOnlyQuery(sql: string): boolean {
		const trimmed = sql.trim().toLowerCase();
		const readOnlyKeywords = ['select', 'show', 'describe', 'desc', 'explain', 'with'];
		const writeKeywords = ['insert', 'update', 'delete', 'create', 'alter', 'drop', 'truncate', 'replace', 'merge'];
		
		for (const keyword of readOnlyKeywords) {
			if (trimmed.startsWith(keyword)) {
				return true;
			}
		}
		
		for (const keyword of writeKeywords) {
			if (trimmed.startsWith(keyword)) {
				return false;
			}
		}
		
		// Default to read-only for safety
		return true;
	}

	// Helper function to convert rows to CSV
	function rowsToCsv(rows: Record<string, any>[]): string {
		if (rows.length === 0) {
			return '';
		}
		
		const headers = Object.keys(rows[0]);
		const csvRows = [headers.join(',')];
		
		for (const row of rows) {
			const values = headers.map(header => {
				const value = row[header];
				if (value === null || value === undefined) {
					return '';
				}
				const stringValue = String(value);
				// Escape quotes and wrap in quotes if contains comma, quote, or newline
				if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
					return `"${stringValue.replace(/"/g, '""')}"`;
				}
				return stringValue;
			});
			csvRows.push(values.join(','));
		}
		
		return csvRows.join('\n');
	}

	// Helper function to get database version info
	async function getDatabaseInfo() {
		try {
			const client = knex.client.config.client;
			let versionQuery = '';
			
			switch (client) {
				case 'mysql':
				case 'mysql2':
					versionQuery = 'SELECT VERSION() as version';
					break;
				case 'pg':
				case 'postgresql':
					versionQuery = 'SELECT version() as version';
					break;
				case 'sqlite3':
					versionQuery = 'SELECT sqlite_version() as version';
					break;
				default:
					versionQuery = 'SELECT 1 as version';
			}
			
			const result = await executeQuery(versionQuery);
			const version = result.rows[0]?.version || 'Unknown';
			
			return {
				version,
				type: client.toUpperCase(),
			};
		} catch (error) {
			return {
				version: 'Unknown',
				type: 'Unknown',
			};
		}
	}

	// Helper function to list database objects
	async function listDatabaseObjects(pattern?: string) {
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
							TABLE_SCHEMA as schema
						FROM information_schema.TABLES 
						WHERE TABLE_SCHEMA = DATABASE()
						${pattern ? 'AND TABLE_NAME LIKE ?' : ''}
						ORDER BY TABLE_NAME
					`;
					break;
				case 'pg':
				case 'postgresql':
					query = `
						SELECT 
							tablename as name,
							'TABLE' as type,
							schemaname as schema
						FROM pg_tables 
						WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
						${pattern ? 'AND tablename LIKE ?' : ''}
						UNION ALL
						SELECT 
							viewname as name,
							'VIEW' as type,
							schemaname as schema
						FROM pg_views 
						WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
						${pattern ? 'AND viewname LIKE ?' : ''}
						ORDER BY name
					`;
					break;
				case 'sqlite3':
					query = `
						SELECT 
							name,
							type,
							'main' as schema
						FROM sqlite_master 
						WHERE type IN ('table', 'view', 'index')
						${pattern ? 'AND name LIKE ?' : ''}
						ORDER BY name
					`;
					break;
				default:
					return { objects: [] };
			}
			
			const params = pattern ? [pattern] : [];
			const result = await executeQuery(query, params);
			
			return {
				objects: result.rows.map((row: any) => ({
					name: row.name,
					type: row.type,
					schema: row.schema,
				})),
			};
		} catch (error) {
			throw new Error(`Failed to list database objects: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Helper function to describe a database object
	async function describeDatabaseObject(name: string, schema?: string) {
		try {
			const client = knex.client.config.client;
			let query = '';
			let params: any[] = [];
			
			switch (client) {
				case 'mysql':
				case 'mysql2':
					query = `
						SELECT 
							COLUMN_NAME as name,
							DATA_TYPE as type,
							IS_NULLABLE as nullable,
							COLUMN_DEFAULT as default_value,
							COLUMN_KEY as key_type,
							COLUMN_COMMENT as comment
						FROM information_schema.COLUMNS 
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
						ORDER BY ORDINAL_POSITION
					`;
					params = [name];
					break;
				case 'pg':
				case 'postgresql':
					const schemaName = schema || 'public';
					query = `
						SELECT 
							column_name as name,
							data_type as type,
							is_nullable as nullable,
							column_default as default_value,
							CASE 
								WHEN pk.column_name IS NOT NULL THEN 'PRI'
								WHEN uk.column_name IS NOT NULL THEN 'UNI'
								WHEN fk.column_name IS NOT NULL THEN 'MUL'
								ELSE NULL
							END as key_type,
							col_description(c.oid, ordinal_position) as comment
						FROM information_schema.columns c
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = ? AND tc.table_schema = ?
						) pk ON c.column_name = pk.column_name
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = ? AND tc.table_schema = ?
						) uk ON c.column_name = uk.column_name
						LEFT JOIN (
							SELECT ku.column_name
							FROM information_schema.table_constraints tc
							JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
							WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ? AND tc.table_schema = ?
						) fk ON c.column_name = fk.column_name
						WHERE c.table_name = ? AND c.table_schema = ?
						ORDER BY c.ordinal_position
					`;
					params = [name, schemaName, name, schemaName, name, schemaName, name, schemaName];
					break;
				case 'sqlite3':
					query = `PRAGMA table_info(?)`;
					params = [name];
					break;
				default:
					throw new Error(`Unsupported database client: ${client}`);
			}
			
			const result = await executeQuery(query, params);
			
			// Get table info
			const tableInfoQuery = client === 'sqlite3' 
				? `SELECT name, type FROM sqlite_master WHERE name = ? AND type IN ('table', 'view')`
				: `
					SELECT 
						TABLE_NAME as name,
						TABLE_TYPE as type,
						TABLE_SCHEMA as schema
					FROM information_schema.TABLES 
					WHERE TABLE_NAME = ? ${schema ? 'AND TABLE_SCHEMA = ?' : 'AND TABLE_SCHEMA = DATABASE()'}
				`;
			
			const tableParams = schema ? [name, schema] : [name];
			const tableResult = await executeQuery(tableInfoQuery, tableParams);
			
			if (tableResult.rows.length === 0) {
				throw new Error(`Object '${name}' not found`);
			}
			
			const tableInfo = tableResult.rows[0];
			
			// Format columns for different databases
			const columns = result.rows.map((row: any) => {
				if (client === 'sqlite3') {
					return {
						name: row.name,
						type: row.type,
						nullable: !row.notnull,
						default: row.dflt_value || undefined,
						key: row.pk ? 'PRI' : undefined,
						comment: undefined,
					};
				}
				
				return {
					name: row.name,
					type: row.type,
					nullable: row.nullable === 'YES',
					default: row.default_value || undefined,
					key: row.key_type || undefined,
					comment: row.comment || undefined,
				};
			});
			
			return {
				object: {
					name: tableInfo.name,
					type: tableInfo.type,
					schema: tableInfo.schema,
					columns,
				},
			};
		} catch (error) {
			throw new Error(`Failed to describe object '${name}': ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Helper function to list resources
	async function listResources() {
		try {
			const objects = await listDatabaseObjects();
			return {
				resources: objects.objects.map(obj => ({
					uri: `${knex.client.config.client}://${obj.schema || 'default'}/${obj.name}/data`,
					name: obj.name,
					mimeType: 'text/plain',
					description: `${obj.type} in ${obj.schema || 'default'} schema`,
				})),
			};
		} catch (error) {
			return { resources: [] };
		}
	}

	// Helper function to read resource
	async function readResource(uri: string) {
		try {
			// Parse URI: client://schema/table/data
			const match = uri.match(/^(\w+):\/\/([^\/]+)\/([^\/]+)\/data$/);
			if (!match) {
				throw new Error(`Invalid resource URI: ${uri}`);
			}
			
			const [, , schema, table] = match;
			const query = `SELECT * FROM ${schema}.${table} LIMIT 100`;
			const result = await executeQuery(query);
			
			return {
				contents: [{
					uri,
					mimeType: 'application/json',
					text: JSON.stringify(result.rows, null, 2),
				}],
			};
		} catch (error) {
			throw new Error(`Failed to read resource '${uri}': ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	return {
		// Query tools
		async queryCsv(input: z.infer<typeof SqlServiceContract.queryCsv.input>) {
			if (!isReadOnlyQuery(input.query)) {
				throw new Error('Only read-only queries are allowed in queryCsv');
			}
			
			const result = await executeQuery(input.query);
			const csv = rowsToCsv(result.rows);
			
			return {
				content: [{
					type: 'text' as const,
					text: csv,
				}],
			};
		},

		async queryJson(input: z.infer<typeof SqlServiceContract.queryJson.input>) {
			if (!isReadOnlyQuery(input.query)) {
				throw new Error('Only read-only queries are allowed in queryJson');
			}
			
			const result = await executeQuery(input.query);
			
			return {
				content: [{
					type: 'text' as const,
					text: JSON.stringify({
						rows: result.rows,
						total: result.rowCount,
					}, null, 2),
				}],
			};
		},

		// General SQL execution
		async executeSql(input: z.infer<typeof SqlServiceContract.executeSql.input>) {
			if (readonly && !isReadOnlyQuery(input.query)) {
				throw new Error('Write operations are not allowed in readonly mode');
			}
			
			const result = await executeQuery(input.query);
			
			return {
				rows: result.rows,
				total: result.rowCount,
				message: `Query executed successfully. ${result.rowCount} rows affected.`,
			};
		},

		// DML operations
		async executeDml(input: z.infer<typeof SqlServiceContract.executeDml.input>) {
			if (readonly) {
				throw new Error('DML operations are not allowed in readonly mode');
			}
			
			if (isReadOnlyQuery(input.query)) {
				throw new Error('Only DML queries are allowed in executeDml');
			}
			
			const result = await executeQuery(input.query);
			
			return {
				message: `DML operation executed successfully. ${result.rowCount} rows affected.`,
				affectedRows: result.rowCount,
			};
		},

		// DDL operations
		async executeDdl(input: z.infer<typeof SqlServiceContract.executeDdl.input>) {
			if (readonly) {
				throw new Error('DDL operations are not allowed in readonly mode');
			}
			
			const result = await executeQuery(input.query);
			
			return {
				message: `DDL operation executed successfully.`,
			};
		},

		// Version information
		async getVersion() {
			const info = await getDatabaseInfo();
			return info;
		},

		// Object management
		async listObjects(input: z.infer<typeof SqlServiceContract.listObjects.input>) {
			return await listDatabaseObjects(input.pattern);
		},

		async describeObject(input: z.infer<typeof SqlServiceContract.describeObject.input>) {
			return await describeDatabaseObject(input.name, input.schema);
		},

		// Resource management
		async listResources() {
			return await listResources();
		},

		async readResource(input: z.infer<typeof SqlServiceContract.readResource.input>) {
			return await readResource(input.uri);
		},
	};
}