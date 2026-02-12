import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import consola from 'consola';

const log = consola.withTag('mcp-relay');

export interface CreateRelayMcpServerOptions {
	/** Target MCP server URL */
	url: string;
	/** Transport type: http (streamable HTTP) or sse */
	transport?: 'http' | 'sse';
	/** Additional headers for the target server */
	headers?: Record<string, string>;
	/** Server name */
	name?: string;
	/** Server version */
	version?: string;
}

export interface RelayContext {
	server: Server;
	getClient: () => Promise<Client>;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

export function createRelayMcpServer(options: CreateRelayMcpServerOptions) {
	const { url, transport = 'http', headers = {}, name = 'mcp-relay', version = '1.0.0' } = options;

	const server = new Server(
		{ name, version },
		{
			capabilities: {
				tools: {},
				resources: {},
			},
		},
	);

	let _client: Client | undefined;
	let _transport: SSEClientTransport | StreamableHTTPClientTransport | undefined;

	const getClient = async (): Promise<Client> => {
		if (_client) return _client;

		const clientTransport =
			transport === 'sse'
				? new SSEClientTransport(new URL(url), {
						requestInit: { headers },
					})
				: new StreamableHTTPClientTransport(new URL(url), {
						requestInit: { headers },
					});

		_transport = clientTransport;
		_client = new Client(
			{
				name: `${name}-client`,
				version,
			},
			{
				capabilities: {},
			},
		);

		await _client.connect(clientTransport);
		return _client;
	};

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		const client = await getClient();
		return client.listTools();
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const client = await getClient();
		return client.callTool({
			name: request.params.name,
			arguments: request.params.arguments,
		});
	});

	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		try {
			const client = await getClient();
			return client.listResources();
		} catch {
			return { resources: [] };
		}
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		const client = await getClient();
		return client.readResource({ uri: request.params.uri });
	});

	return {
		server,
		getClient,
		async close() {
			if (_transport) {
				await _transport.close();
			}
			await server.close();
			_client = undefined;
			_transport = undefined;
		},
	};
}
