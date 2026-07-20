import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { GrafanaProxiedClient } from './client';
import { discoverProxiedDatasources } from './discovery';
import { createProxiedToolHandler, createProxiedToolName } from './handler';

export async function registerProxiedDatasourceTools(ctx: GrafanaContext) {
	if (!ctx.enableProxiedTools) return [];

	const discovered = await discoverProxiedDatasources(ctx.client);
	const proxiedClients: GrafanaProxiedClient[] = [];

	for (const datasource of discovered) {
		try {
			const client = new GrafanaProxiedClient({
				name: datasource.name,
				datasourceUid: datasource.uid,
				datasourceType: datasource.type,
				endpoint: datasource.endpoint,
				auth: ctx.client.options,
			});
			const tools = await client.listTools();
			for (const tool of tools) {
				const proxiedName = createProxiedToolName(datasource.type, tool.name);
				ctx.server.registerTool(
					proxiedName,
					{
						description: `${tool.description ?? ''}\n\nProxied from datasource ${datasource.name} (${datasource.uid}). Pass remote tool arguments inside "arguments".`,
						inputSchema: z.object({
							datasourceUid: z.string().describe(`Datasource UID, expected ${datasource.uid}`),
							arguments: z
								.record(z.string(), z.unknown())
								.default({})
								.describe('Arguments forwarded to the remote MCP tool'),
						}),
					},
					async (input) => {
						const result = await createProxiedToolHandler(client, tool)(input);
						if (result && typeof result === 'object' && 'content' in result) {
							return result as any;
						}
						if (result && typeof result === 'object' && 'toolResult' in result) {
							return {
								content: [
									{
										type: 'text' as const,
										text: JSON.stringify((result as { toolResult: unknown }).toolResult, null, 2),
									},
								],
							};
						}
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(result, null, 2),
								},
							],
						};
					},
				);
			}
			proxiedClients.push(client);
		} catch (error) {
			ctx.log.warn(
				`Failed to register proxied datasource ${datasource.uid}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return proxiedClients;
}
