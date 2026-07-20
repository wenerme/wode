import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';
import { resolveGrafanaAuthOptions, type GrafanaAuthOptions } from './auth';
import { grafanaClientCache } from './cache';
import { registerProxiedDatasourceTools } from './proxy/registry';
import { registerGrafanaToolGroups } from './tools';

const log = consola.withTag('grafana-mcp');

export type CreateGrafanaMcpServerOptions = GrafanaAuthOptions & {
	name?: string;
	version?: string;
	writeEnabled?: boolean;
	enableProxiedTools?: boolean;
	enabledToolGroups?: string[];
	disabledToolGroups?: string[];
};

export type GrafanaContext = {
	server: McpServer;
	client: ReturnType<typeof grafanaClientCache.getOrCreate>;
	log: typeof log;
	textResult: (text: string, isError?: boolean) => { content: { type: 'text'; text: string }[]; isError?: boolean };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
	enableProxiedTools: boolean;
	writeEnabled: boolean;
	enabledToolGroups?: Set<string>;
	disabledToolGroups?: Set<string>;
};

export function createGrafanaMcpServer({
	name = 'grafana',
	version = '1.0.0',
	writeEnabled = true,
	enableProxiedTools = true,
	enabledToolGroups,
	disabledToolGroups,
	...authOptions
}: CreateGrafanaMcpServerOptions) {
	const server = new McpServer({ name, version });
	const client = grafanaClientCache.getOrCreate(resolveGrafanaAuthOptions(authOptions));

	const textResult = (text: string, isError?: boolean) => ({
		content: [{ type: 'text' as const, text }],
		...(isError ? { isError } : {}),
	});

	const jsonResult = (data: unknown) => ({
		content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
	});

	const ctx: GrafanaContext = {
		server,
		client,
		log,
		textResult,
		jsonResult,
		enableProxiedTools,
		writeEnabled,
		enabledToolGroups: enabledToolGroups?.length
			? new Set(enabledToolGroups.map((item) => item.toLowerCase()))
			: undefined,
		disabledToolGroups: disabledToolGroups?.length
			? new Set(disabledToolGroups.map((item) => item.toLowerCase()))
			: undefined,
	};

	registerGrafanaToolGroups(ctx);
	const initialization = registerProxiedDatasourceTools(ctx);

	return {
		server,
		request: client.request.bind(client),
		client,
		async initialize() {
			const proxiedClients = await initialization;
			return { proxiedClients };
		},
		async close() {
			await server.close();
		},
	};
}
