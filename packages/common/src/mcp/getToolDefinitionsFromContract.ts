import {
	type CallToolRequest,
	type CallToolResult,
	type ListResourcesRequest,
	type ListResourcesResult,
	type ListToolsRequest,
	type ListToolsResult,
	type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type { Implementer } from '@orpc/server';
import type { JsonSchemaDef } from '@wener/common/jsonschema';
import { snakeCase } from 'es-toolkit';
import { z } from 'zod';

export const McpMetaKey = {
	tool: 'McpTool',
} as const;

export function getToolDefinitionsFromContract(
	contract: Record<string, any>,
	{ prefix }: { prefix?: string } = {},
): Tool[] {
	return Object.entries(contract).flatMap(([k, v]) => {
		const tm = (v['~orpc'].meta as any)[McpMetaKey.tool] as ToolMeta;

		if (!tm) {
			return [];
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
			inputSchema: z.toJSONSchema(inputSchema) as JsonSchemaDef & { type: 'object' },
			outputSchema: outputSchema ? (z.toJSONSchema(outputSchema) as JsonSchemaDef & { type: 'object' }) : undefined,
		};
		return [tool];
	});
}

type ToolMeta = {
	name?: string;
	description?: string;
};

export function createMcpServerHandler<C extends Record<string, any>>(
	contract: C,
	impl: Partial<Implementer<C, any, any>>,
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
		const tool: Tool = {
			...tm,
			name,
			description,
			inputSchema: z.toJSONSchema(inputSchema) as JsonSchemaDef & { type: 'object' },
		};
		tools.push(tool);
		byToolName.set(tool.name, k);
	}

	return {
		tools,
		listTool: async (req: ListToolsRequest): Promise<ListToolsResult> => {
			return { tools };
		},
		listResources: async (req: ListResourcesRequest): Promise<ListResourcesResult> => {
			return { resources: [] };
		},
		callTool: async (req: CallToolRequest): Promise<CallToolResult> => {
			let fn = byToolName.get(req.method);
			let f = fn ? (impl as any)[fn] : undefined;
			if (!fn || !Object.hasOwn(impl, fn) || typeof f !== 'function') {
				return {
					content: [{ type: 'text', text: `Tool not found: ${req.method}` }],
					isError: true,
				};
			}
			return await f(req.params);
		},
	};
}