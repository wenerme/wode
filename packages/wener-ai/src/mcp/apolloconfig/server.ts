import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApolloConfigClient, type ApolloConfigClientInit } from '@wener/client/apolloconfig';
import consola from 'consola';
import { registerTools } from './tools';

const log = consola.withTag('apollo-mcp');

export interface CreateApolloConfigMcpServerOptions extends ApolloConfigClientInit {
	name?: string;
	version?: string;
}

export interface ApolloConfigContext {
	server: McpServer;
	client: ApolloConfigClient;
	log: typeof log;
}

export function createApolloConfigMcpServer({
	name = 'apolloconfig',
	version = '1.0.0',
	...clientInit
}: CreateApolloConfigMcpServerOptions) {
	const server = new McpServer({ name, version });
	const client = new ApolloConfigClient(clientInit);

	const ctx: ApolloConfigContext = { server, client, log };
	registerTools(ctx);

	return {
		server,
		client,
		async close() {
			await server.close();
		},
	};
}
