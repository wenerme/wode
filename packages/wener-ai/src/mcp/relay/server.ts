import { type Client, SSEClientTransport, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { type McpServer, Server } from '@modelcontextprotocol/server';
import { connectMcpClient } from '../client';

/**
 * 带着调用方的 `headers`（通常是凭据）连上游 MCP：只跟随同源且不改变方法的重定向（如 `/mcp` → `/mcp/`），
 * 跨源重定向不跟随、连接报错，凭据与请求体不会发到别的源。这是 SDK 的默认值，这里显式写出来，
 * 避免 SDK 升级改变默认值后悄悄变成跨源跟随。
 */
const UpstreamRedirectPolicy = 'same-origin' as const;

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

		// Streamable HTTP 先按 2026-07-28 探测，不是新协议再回退 2025；SSE 只讲 2025。
		const connected = await connectMcpClient({
			createTransport: () =>
				transport === 'sse'
					? new SSEClientTransport(new URL(url), { requestInit: { headers }, redirectPolicy: UpstreamRedirectPolicy })
					: new StreamableHTTPClientTransport(new URL(url), {
							requestInit: { headers },
							redirectPolicy: UpstreamRedirectPolicy,
						}),
			clientInfo: { name: `${name}-client`, version },
			clientOptions: { capabilities: {} },
		});
		_transport = connected.transport as SSEClientTransport | StreamableHTTPClientTransport;
		_client = connected.client;
		return _client;
	};

	// 逐页透传（与 v1 一致）：SDK v2 的 listTools()/listResources() 不带 cursor 时会自动聚合所有页。
	server.setRequestHandler('tools/list', async (request) => {
		const client = await getClient();
		return client.request({ method: 'tools/list', params: request.params ?? {} });
	});

	server.setRequestHandler('tools/call', async (request) => {
		const client = await getClient();
		return client.callTool({
			name: request.params.name,
			arguments: request.params.arguments,
		});
	});

	server.setRequestHandler('resources/list', async (request) => {
		try {
			const client = await getClient();
			return client.request({ method: 'resources/list', params: request.params ?? {} });
		} catch {
			return { resources: [] };
		}
	});

	server.setRequestHandler('resources/read', async (request) => {
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
