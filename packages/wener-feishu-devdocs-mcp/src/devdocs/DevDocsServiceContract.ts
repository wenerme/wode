import { oc } from '@orpc/contract';
import { McpMetaKey } from 'common/mcp';
import { z } from 'zod/v4';

/**
 * Feishu Developer Documentation MCP Service Contract
 * Defines the interface for developer documentation search and recall tools
 */

// Input schemas
const RecallQueryInputSchema = z.object({
	query: z.string().min(1).describe('Search query for developer documentation'),
});

// Output schemas
const RecallResultsSchema = z.object({
	results: z.array(z.string()).describe('Documentation search results'),
	query: z.string().describe('Original search query'),
	resultCount: z.number().describe('Number of results returned'),
});

const HealthCheckSchema = z.object({
	status: z.enum(['healthy', 'unhealthy']).describe('Health status'),
	service: z.string().describe('Service name'),
	version: z.string().describe('Service version'),
	timestamp: z.string().describe('Health check timestamp'),
	domain: z.string().describe('Feishu API domain being used'),
	connectivity: z.enum(['healthy', 'unhealthy']).optional().describe('API connectivity status'),
	error: z.string().optional().describe('Error message if unhealthy'),
});

export const FeishuDevDocsServiceContract = {
	health: oc.input(z.object({})).output(HealthCheckSchema),

	recallDeveloperDocuments: oc
		.input(RecallQueryInputSchema)
		.output(RecallResultsSchema)
		.route({
			description: 'Search and recall relevant content from Feishu/Lark Open Platform developer documentation',
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					name: 'lookup',
					readOnlyHint: true,
				},
			},
		}),
};
