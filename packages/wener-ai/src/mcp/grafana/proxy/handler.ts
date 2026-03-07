import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GrafanaProxiedClient } from './client';

export function createProxiedToolName(datasourceType: string, toolName: string) {
	return `${datasourceType}_${toolName}`;
}

export function createProxiedToolHandler(client: GrafanaProxiedClient, tool: Tool) {
	return async ({ datasourceUid, arguments: forwardedArguments = {} }: { datasourceUid: string; arguments?: Record<string, unknown> }) => {
		if (datasourceUid !== client.datasourceUid) {
			throw new Error(`Datasource ${datasourceUid} is not available for proxied tool ${tool.name}`);
		}
		return client.callTool(tool.name, forwardedArguments);
	};
}
