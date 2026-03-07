import {
	CallToolInputSchema,
	ListResourcesInputSchema,
	ListToolsInputSchema,
	ReadResourceInputSchema,
} from '../schemas';
import type { RelayContext } from '../server';

export function registerRelayTools(ctx: RelayContext) {
	const { server, getClient, textResult, jsonResult } = ctx;

	// Tool to list available tools on the target server
	server.registerTool(
		'list_tools',
		{
			description: 'List available tools on the target MCP server',
			inputSchema: ListToolsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
				const client = await getClient();
				const result = await client.listTools();
				return jsonResult(result.tools);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	// Tool to call a tool on the target server
	server.registerTool(
		'call_tool',
		{
			description: 'Call a tool on the target MCP server',
			inputSchema: CallToolInputSchema,
		},
		async ({ name: toolName, arguments: toolArgs }) => {
			try {
				const client = await getClient();
				const result = await client.callTool({
					name: toolName,
					arguments: toolArgs,
				});
				return { content: result.content as any };
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	// Tool to list resources
	server.registerTool(
		'list_resources',
		{
			description: 'List available resources on the target MCP server',
			inputSchema: ListResourcesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
				const client = await getClient();
				const result = await client.listResources();
				return jsonResult(result.resources);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	// Tool to read a resource
	server.registerTool(
		'read_resource',
		{
			description: 'Read a resource from the target MCP server',
			inputSchema: ReadResourceInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ uri }) => {
			try {
				const client = await getClient();
				const result = await client.readResource({ uri });
				return { content: result.contents as any };
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);
}
