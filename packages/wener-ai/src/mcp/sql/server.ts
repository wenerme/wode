import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Kysely } from 'kysely';
import { registerMetadataTools, registerQueryTools } from './tools';
import { createKyselyInstance, type Dialect, detectDialect } from './utils';

export interface CreateSqlMcpServerOptions {
	/** Database connection URL (mysql://, postgres://, sqlite://, mssql://) */
	url?: string;
	/** Database URL for read operations (overrides url for reads) */
	readUrl?: string;
	/** Database URL for write operations (overrides url for writes) */
	writeUrl?: string;
	/** When true, only register read-only tools (query_json, exec_query, get_version, list_objects, describe_object). Defaults to true when writeUrl is not provided. */
	readOnly?: boolean;
	/** Server name */
	name?: string;
	/** Server version */
	version?: string;
}

export interface SqlContext {
	server: McpServer;
	readOnly: boolean;
	getDb: () => Promise<{ db: Kysely<any>; dialect: Dialect }>;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

/**
 * Create an MCP server for database operations using Kysely.
 * Uses the high-level McpServer API with zod schema validation.
 *
 * @example
 * ```ts
 * // With URL
 * const { server, close } = createSqlMcpServer({ url: 'postgres://localhost/mydb' });
 *
 * // Connect to transport
 * await server.connect(transport);
 * ```
 */
export function createSqlMcpServer(options: CreateSqlMcpServerOptions) {
	const { name = 'sql-mcp-server', version = '1.0.0' } = options;

	let _db: Kysely<any> | undefined;
	let _dialect: Dialect | undefined;
	let _ownsConnection = false;
	let _loadPromise: Promise<{ db: Kysely<any>; dialect: Dialect }> | undefined;

	const server = new McpServer({ name, version });

	// Lazy load kysely - cached promise
	const getDb = async (): Promise<{ db: Kysely<any>; dialect: Dialect }> => {
		if (_db && _dialect) {
			return { db: _db, dialect: _dialect };
		}
		if (!_loadPromise) {
			_loadPromise = (async () => {
				const url = options.url;
				if (!url) {
					throw new Error('Database URL must be provided');
				}
				const dialect = detectDialect(url);
				const result = await createKyselyInstance(url, dialect);
				_db = result.db;
				_dialect = dialect;
				_ownsConnection = result.ownsConnection;
				return { db: result.db, dialect };
			})();
		}
		return _loadPromise;
	};

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

	// =========================================================================
	// Register Tools
	// =========================================================================

	const readOnly = options.readOnly ?? false;
	const ctx: SqlContext = { server, readOnly, getDb, textResult, jsonResult };

	registerQueryTools(ctx);
	registerMetadataTools(ctx);

	return {
		server,

		/**
		 * Get the detected dialect (available after first tool call)
		 */
		get dialect() {
			return _dialect;
		},

		/**
		 * Lazy load database connection
		 */
		loadDb: getDb,

		/**
		 * Close the database connection (if owned by this server)
		 */
		async close() {
			if (_ownsConnection && _db) {
				await _db.destroy();
			}
			await server.close();
			_db = undefined;
			_dialect = undefined;
			_loadPromise = undefined;
		},
	};
}
