import {
	type CallToolRequest,
	type CallToolResult,
	type ListResourcesRequest,
	type ListResourcesResult,
	type ListResourceTemplatesRequest,
	type ListResourceTemplatesResult,
	type ListToolsRequest,
	type ListToolsResult,
	type ReadResourceRequest,
	type ReadResourceResult,
	type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type { ProcedureClient } from '@orpc/server';
import type { JsonSchemaDef } from '@wener/common/jsonschema';
import { toJsonSchema } from '@wener/common/schema';
import { snakeCase } from 'es-toolkit';
import { z } from 'zod';

export const McpMetaKey = {
	tool: 'McpTool',
} as const;
type ToolMeta = {
	name?: string;
	description?: string;
	annotations?: {
		readOnlyHint?: boolean;
		idempotentHint?: boolean;
		destructiveHint?: boolean;
		openWorldHint?: boolean;
	};
};

/**
 * Create MCP server handler from contract and implementation
 */
export function createMcpServerHandler<C extends Record<string, any>>(
	contract: C,
	impl: ProcedureClient<any, any, any, any>,
	{ prefix }: { prefix?: string } = {},
) {
	const tools: Tool[] = [];
	const byToolName = new Map<string, string>();
	for (const [k, v] of Object.entries(contract)) {
		const tm = (v['~orpc'].meta as any)[McpMetaKey.tool] as ToolMeta;

		if (!tm) {
			continue;
		}

		let name = tm.name || snakeCase(k);
		if (prefix) {
			name = `${prefix}_${name}`;
		}
		let description = tm.description || (v['~orpc'].route as any).description || '';
		let inputSchema = v['~orpc'].inputSchema as z.ZodTypeAny;
		let outputSchema = v['~orpc'].outputSchema as z.ZodTypeAny;
		const tool: Tool = {
			...tm,
			name,
			description,
			inputSchema: toJsonSchema(inputSchema) as JsonSchemaDef & { type: 'object' },
		};
		if (outputSchema && outputSchema['~standard'].vendor !== 'custom') {
			tool.outputSchema = toJsonSchema(outputSchema) as Tool['outputSchema'];
			if (tool.outputSchema?.type !== 'object') {
				console.error(`tool [${tool.name}] Invalid Output Schema`, tool.outputSchema, outputSchema);
			}
		}
		tools.push(tool);
		byToolName.set(tool.name, k);
	}

	return {
		tools,
		listTool: async (req: ListToolsRequest): Promise<ListToolsResult> => {
			return { tools };
		},
		listResources: async (req: ListResourcesRequest): Promise<ListResourcesResult> => {
			// Check if impl has listResources method
			const fn = (impl as any)['listResources'];
			if (typeof fn === 'function') {
				return await fn(req);
			}
			return { resources: [] };
		},
		readResource: async (req: ReadResourceRequest): Promise<ReadResourceResult> => {
			// Check if impl has readResource method
			const fn = (impl as any)['readResource'];
			if (typeof fn === 'function') {
				return await fn(req);
			}
			throw new Error('readResource not implemented');
		},
		listResourceTemplate: async (req: ListResourceTemplatesRequest): Promise<ListResourceTemplatesResult> => {
			const fn = (impl as any)['listResourceTemplate'];
			if (typeof fn === 'function') {
				return await fn(req);
			}
			return { resourceTemplates: [] };
		},
		callTool: async (req: CallToolRequest): Promise<CallToolResult> => {
			const toolName = req.params.name;
			const tool = tools.find((t) => t.name === toolName);
			let fn = byToolName.get(toolName);
			if (!fn || !tool) {
				return {
					content: [{ type: 'text', text: `Tool not found: ${toolName}` }],
					isError: true,
				};
			}
			try {
				let out = await (impl as any)[fn](req.params.arguments || {});
				if (!tool.outputSchema) {
					return out;
				}
				return {
					structuredContent: out,
					isError: false,
					content: [
						{
							type: 'text',
							text: JSON.stringify(out),
						},
					],
				};
			} catch (e) {
				return {
					isError: true,
					structuredContent: {},
					content: [
						{
							type: 'text',
							text: String(e),
						},
					],
				};
			}
		},
	};
}
