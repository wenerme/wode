import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRelayTools } from './tools';

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
	server: McpServer;
	getClient: () => Promise<Client>;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

/**
 * Create an MCP server that relays requests to another MCP server.
 * This is useful for proxying MCP servers through a unified endpoint.
 */
export function createRelayMcpServer(options: CreateRelayMcpServerOptions) {
	const { url, transport = 'http', headers = {}, name = 'mcp-relay', version = '1.0.0' } = options;

	const server = new McpServer({ name, version });

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

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

	// =========================================================================
	// Register Tools
	// =========================================================================

	const ctx: RelayContext = { server, getClient, textResult, jsonResult };

	registerRelayTools(ctx);

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
