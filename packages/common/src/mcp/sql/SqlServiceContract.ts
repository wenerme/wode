import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { oc } from '@orpc/contract';
import { z } from 'zod/v4';
import { McpMetaKey } from '../getToolDefinitionsFromContract';

/**
 * SQL Tools ORPC Contract
 * Defines the interface for SQL execution tools in MCP servers
 */

const SQLInputSchema = z.object({
	query: z.string().min(1).describe('The SQL to execute'),
});

// Input schemas
export const SQLQueryInputSchema = z.object({
	query: z.string().min(1).describe('The SQL query to execute'),
});

export const SQLDMLInputSchema = z.object({
	query: z.string().min(1).describe('The DML SQL query to execute (INSERT, UPDATE, DELETE, MERGE, REPLACE)'),
});

export const SqlDdlInputSchema = z.object({
	query: z.string().min(1).describe('The DDL SQL query to execute (CREATE, ALTER, DROP, TRUNCATE)'),
});

export const GetVersionInputSchema = z.object({});

// Output schemas
export const SQLQueryOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal('text'),
			text: z.string(),
		}),
	),
});

export const SqlDmlOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal('text'),
			text: z.string(),
		}),
	),
});

export const SqlDdlOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal('text'),
			text: z.string(),
		}),
	),
});

export const GetVersionOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal('text'),
			text: z.string(),
		}),
	),
});

// Resource schemas
export const SqlResourceSchema = z.object({
	uri: z.string().describe('Resource URI (e.g., mysql://table_name/data)'),
	name: z.string().describe('Human-readable resource name'),
	mimeType: z.string().default('text/plain'),
	description: z.string().describe('Resource description'),
});

export const ListResourcesOutputSchema = z.object({
	resources: z.array(SqlResourceSchema),
});

export const ReadResourceInputSchema = z.object({
	uri: z.string().describe('Resource URI to read'),
});

export const ReadResourceOutputSchema = z.object({
	contents: z.array(
		z.object({
			uri: z.string(),
			mimeType: z.string(),
			text: z.string(),
		}),
	),
});

// New schemas for listObject and describeObject
export const ListObjectsInputSchema = z.object({
	schema: z.string().optional().describe('Schema name to list objects from'),
});

export const ListObjectsOutputSchema = z.object({
	objects: z.array(
		z.object({
			name: z.string().describe('Object name'),
			type: z.string().describe('Object type (table, view, index, etc.)'),
			schema: z.string().optional().describe('Schema name'),
			description: z.string().optional().describe('Object description'),
		}),
	),
});

export const DescribeObjectInputSchema = z.object({
	object: z.string().describe('Object name to describe'),
	schema: z.string().optional().describe('Schema name'),
});

export const DescribeObjectOutputSchema = z.object({
	object: z.string().describe('Object name'),
	type: z.string().describe('Object type'),
	schema: z.string().optional().describe('Schema name'),
	columns: z.array(
		z.object({
			name: z.string().describe('Column name'),
			type: z.string().describe('Column data type'),
			nullable: z.boolean().describe('Whether column allows NULL'),
			default: z.string().optional().describe('Default value'),
			key: z.string().optional().describe('Key type (PRI, UNI, MUL)'),
			extra: z.string().optional().describe('Additional column information'),
		}),
	).optional(),
	indexes: z.array(
		z.object({
			name: z.string().describe('Index name'),
			columns: z.array(z.string()).describe('Column names in index'),
			unique: z.boolean().describe('Whether index is unique'),
			type: z.string().optional().describe('Index type'),
		}),
	).optional(),
	description: z.string().optional().describe('Object description'),
});

export const SqlServiceContract = {
	queryCsv: oc
		.input(SQLInputSchema)
		.output(CallToolResultSchema)
		// .output(
		// 	z.object({
		// 		format: z.literal('csv').default('csv'),
		// 		csv: z.string(),
		// 		message: z.string().optional(),
		// 		total: z.number().optional().describe('Total number of rows returned'),
		// 	}),
		// )
		.route({
			description: 'Execute read-only SQL queries and return results in CSV format',
			tags: ['sql', 'read-only', 'csv'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	queryJson: oc
		.input(SQLInputSchema)
		.output(CallToolResultSchema)
		// .output(
		// 	z.object({
		// 		format: z.literal('json').default('json'),
		// 		rows: z.record(z.string(), z.any()).array().default([]),
		// 		message: z.string().optional(),
		// 		total: z.number().optional().describe('Total number of rows returned'),
		// 	}),
		// )
		.route({
			description: 'Execute read-only SQL queries and return results in JSON format',
			tags: ['sql', 'read-only', 'json'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	// General SQL execution tool
	executeSql: oc
		.input(SQLInputSchema)
		.output(
			z.object({
				rows: z.record(z.string(), z.any()).array().default([]),
				message: z.string().optional(),
				total: z.number().optional().describe('Total number of rows affected or returned'),
				affectedRows: z.number().optional().describe('Number of rows affected (for write operations)'),
			}),
		)
		.route({
			description: 'Execute any SQL operation (requires readwrite mode for write operations)',
			tags: ['sql', 'any-operation', 'json'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	// DML (Data Manipulation Language) tool
	executeDml: oc
		.input(SQLInputSchema)
		.output(
			z.object({
				message: z.string().optional(),
				affectedRows: z.number().optional().describe('Number of rows affected (for write operations)'),
			}),
		)
		.route({
			description: 'Execute DML operations (INSERT, UPDATE, DELETE, MERGE, REPLACE)',
			tags: ['sql', 'dml', 'write'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	// DDL (Data Definition Language) tool
	executeDdl: oc
		.input(SQLInputSchema)
		.output(
			z.object({
				message: z.string().optional(),
			}),
		)
		.route({
			description: 'Execute DDL operations (CREATE, ALTER, DROP, TRUNCATE)',
			tags: ['sql', 'ddl', 'schema'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	// Version information tool
	getVersion: oc
		.input(z.object({}))
		.output(
			z.object({
				version: z.string().describe('Database server version string'),
				type: z.string().describe('Database type (e.g., PostgreSQL, MySQL, etc.)'),
			}),
		)
		.route({
			description: 'Get database server version information',
			tags: ['sql', 'info', 'version'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	// Resource management
	listResources: oc
		.input(z.object({}))
		.output(ListResourcesOutputSchema)
		.route({
			description: 'List available database resources (tables, views, etc.)',
			tags: ['sql', 'resources', 'list'],
		}),

	readResource: oc
		.input(ReadResourceInputSchema)
		.output(ReadResourceOutputSchema)
		.route({
			description: 'Read data from a specific database resource',
			tags: ['sql', 'resources', 'read'],
		}),

	// New object management tools
	listObjects: oc
		.input(ListObjectsInputSchema)
		.output(ListObjectsOutputSchema)
		.route({
			description: 'List database objects (tables, views, indexes, etc.)',
			tags: ['sql', 'objects', 'list'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),

	describeObject: oc
		.input(DescribeObjectInputSchema)
		.output(DescribeObjectOutputSchema)
		.route({
			description: 'Describe a specific database object structure',
			tags: ['sql', 'objects', 'describe'],
		})
		.meta({
			[McpMetaKey.tool]: {},
		}),
};