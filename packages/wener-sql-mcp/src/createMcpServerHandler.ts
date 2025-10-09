import type { Knex } from 'knex';
import {
	type CallToolRequest,
	type CallToolResult,
	type ListResourcesRequest,
	type ListResourcesResult,
	type ListToolsRequest,
	type ListToolsResult,
	type Resource,
	type ReadResourceRequest,
	type ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { SqlServiceContract } from '@wener/common/mcp/sql/SqlServiceContract';
import { createMcpServerHandler as createBaseHandler } from '@wener/common/mcp/getToolDefinitionsFromContract';
import { createKnexSqlServiceImpl, type KnexSqlServiceConfig } from './createKnexSqlServiceImpl';

export interface McpSqlServerConfig extends KnexSqlServiceConfig {
	/**
	 * Database connection name for resource URIs
	 */
	databaseName?: string;
	/**
	 * Whether to include database objects as resources
	 */
	includeObjectsAsResources?: boolean;
}

export function createMcpServerHandler(
	knex: Knex,
	config: McpSqlServerConfig = {}
) {
	const {
		databaseName = 'database',
		includeObjectsAsResources = true,
		...serviceConfig
	} = config;

	const service = createKnexSqlServiceImpl(knex, serviceConfig);
	const baseHandler = createBaseHandler(SqlServiceContract, service);

	// Get database objects for resource listing
	const getDatabaseObjects = async (): Promise<Resource[]> => {
		if (!includeObjectsAsResources) {
			return [];
		}

		try {
			const result = await service.listObjects?.({});
			if (!result?.objects) {
				return [];
			}

			return result.objects.map(obj => ({
				uri: `${knex.client.config.client}://${databaseName}/${obj.schema ? `${obj.schema}.` : ''}${obj.name}`,
				name: obj.name,
				mimeType: 'application/sql',
				description: obj.description || `${obj.type} in ${obj.schema || 'default schema'}`
			}));
		} catch (error) {
			console.error('Error listing database objects:', error);
			return [];
		}
	};

	// Read resource content
	const readResourceContent = async (uri: string): Promise<ReadResourceResult> => {
		try {
			// Parse URI: client://database/schema.object or client://database/object
			const uriMatch = uri.match(/^(\w+):\/\/([^\/]+)\/(.+)$/);
			if (!uriMatch) {
				throw new Error(`Invalid resource URI format: ${uri}`);
			}

			const [, client, db, objectPath] = uriMatch;
			const [schema, object] = objectPath.includes('.') ? objectPath.split('.') : [undefined, objectPath];

			// Get object description
			const describeResult = await service.describeObject?.({ object, schema });
			if (!describeResult) {
				throw new Error(`Object not found: ${objectPath}`);
			}

			// Format the description as SQL DDL
			let content = `-- ${describeResult.type.toUpperCase()}: ${objectPath}\n`;
			if (describeResult.schema) {
				content += `-- Schema: ${describeResult.schema}\n`;
			}
			content += `-- Database: ${client}\n\n`;

			if (describeResult.columns && describeResult.columns.length > 0) {
				content += `-- Columns:\n`;
				describeResult.columns.forEach(col => {
					content += `--   ${col.name}: ${col.type}`;
					if (!col.nullable) content += ` NOT NULL`;
					if (col.default) content += ` DEFAULT ${col.default}`;
					if (col.key === 'PRI') content += ` PRIMARY KEY`;
					if (col.key === 'UNI') content += ` UNIQUE`;
					if (col.extra) content += ` (${col.extra})`;
					content += `\n`;
				});
				content += `\n`;
			}

			if (describeResult.indexes && describeResult.indexes.length > 0) {
				content += `-- Indexes:\n`;
				describeResult.indexes.forEach(idx => {
					content += `--   ${idx.name}: ${idx.columns.join(', ')}`;
					if (idx.unique) content += ` (UNIQUE)`;
					if (idx.type) content += ` (${idx.type})`;
					content += `\n`;
				});
				content += `\n`;
			}

			// Add sample query
			content += `-- Sample query:\n`;
			content += `SELECT * FROM ${schema ? `${schema}.` : ''}${object} LIMIT 10;\n`;

			return {
				contents: [{
					uri,
					mimeType: 'application/sql',
					text: content
				}]
			};
		} catch (error) {
			console.error('Error reading resource:', error);
			return {
				contents: [{
					uri,
					mimeType: 'text/plain',
					text: `Error reading resource: ${error instanceof Error ? error.message : 'Unknown error'}`
				}]
			};
		}
	};

	return {
		...baseHandler,
		
		listResources: async (req: ListResourcesRequest): Promise<ListResourcesResult> => {
			const objects = await getDatabaseObjects();
			return { resources: objects };
		},

		readResource: async (req: ReadResourceRequest): Promise<ReadResourceResult> => {
			return await readResourceContent(req.uri);
		}
	};
}