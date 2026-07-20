import { oc } from '@orpc/contract';
import { z } from 'zod';

// Server info schema
export const ServerInfoSchema = z.object({
	name: z.string(),
	type: z.string(),
	disabled: z.boolean().optional(),
});
export type ServerInfo = z.infer<typeof ServerInfoSchema>;

// Server type info schema
export const ServerTypeInfoSchema = z.object({
	type: z.string(),
	description: z.string(),
	dynamicEndpoint: z.string(),
});
export type ServerTypeInfo = z.infer<typeof ServerTypeInfoSchema>;

// Model info schema
export const ModelInfoSchema = z.object({
	name: z.string(),
	adapter: z.string().nullish(),
	baseUrl: z.string().nullish(),
	contextWindow: z.number().nullish(),
	maxInputTokens: z.number().nullish(),
	maxOutputTokens: z.number().nullish(),
});
export type ModelInfo = z.infer<typeof ModelInfoSchema>;

// Service overview schema
export const ServiceOverviewSchema = z.object({
	name: z.string(),
	version: z.string(),
	servers: z.array(ServerInfoSchema),
	serverTypes: z.array(ServerTypeInfoSchema),
	models: z.array(ModelInfoSchema),
	endpoints: z.array(z.string()),
});
export type ServiceOverview = z.infer<typeof ServiceOverviewSchema>;

// Request stats schema
export const RequestStatsSchema = z.object({
	totalRequests: z.number(),
	totalErrors: z.number(),
	avgDurationMs: z.number(),
	byServer: z.array(
		z.object({
			name: z.string(),
			count: z.number(),
		}),
	),
	byMethod: z.array(
		z.object({
			method: z.string(),
			count: z.number(),
		}),
	),
	byEndpoint: z.array(
		z.object({
			endpoint: z.string(),
			count: z.number(),
		}),
	),
});
export type RequestStats = z.infer<typeof RequestStatsSchema>;

// Tool parameter schema
export const ToolParameterSchema = z.object({
	name: z.string(),
	type: z.string(),
	description: z.string().nullish(),
	required: z.boolean(),
});
export type ToolParameter = z.infer<typeof ToolParameterSchema>;

// Tool info schema for display
export const ToolInfoSchema = z.object({
	name: z.string(),
	description: z.string().nullish(),
	serverName: z.string(),
	serverType: z.string(),
	parameters: z.array(ToolParameterSchema),
	inputSchemaCompact: z.string().nullish(), // Compact TS-like schema representation
});
export type ToolInfo = z.infer<typeof ToolInfoSchema>;

// MCPS Contract
export const McpsContract = oc.prefix('/mcps').router({
	// Get service overview
	overview: oc
		.input(z.object({}))
		.output(ServiceOverviewSchema)
		.route({ method: 'GET', path: '/overview', summary: 'Get service overview' }),

	// Get request statistics
	stats: oc
		.input(
			z.object({
				from: z.string().nullish(),
				to: z.string().nullish(),
			}),
		)
		.output(RequestStatsSchema)
		.route({ method: 'GET', path: '/stats', summary: 'Get request statistics' }),

	// List configured servers
	servers: oc
		.input(z.object({}))
		.output(
			z.object({
				servers: z.array(ServerInfoSchema),
			}),
		)
		.route({ method: 'GET', path: '/servers', summary: 'List configured servers' }),

	// List configured models
	models: oc
		.input(z.object({}))
		.output(
			z.object({
				models: z.array(ModelInfoSchema),
			}),
		)
		.route({ method: 'GET', path: '/models', summary: 'List configured models' }),

	// List tools from all servers
	tools: oc
		.input(
			z.object({
				server: z.string().nullish(), // Filter by server name
				filter: z.string().nullish(), // Glob pattern filter (like X-MCP-Include)
			}),
		)
		.output(
			z.object({
				tools: z.array(ToolInfoSchema),
			}),
		)
		.route({ method: 'GET', path: '/tools', summary: 'List tools from MCP servers' }),
});
