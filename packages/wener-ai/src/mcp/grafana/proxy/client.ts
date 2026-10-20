import type { Tool, Transport } from '@modelcontextprotocol/client';
import { type Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { connectMcpClient } from '../../client';
import type { ResolvedGrafanaAuthOptions } from '../auth';
import { buildGrafanaHeaders } from '../auth';

export type GrafanaProxiedClientOptions = {
	name: string;
	datasourceUid: string;
	datasourceType: string;
	endpoint: string;
	auth: ResolvedGrafanaAuthOptions;
};

export class GrafanaProxiedClient {
	readonly datasourceUid: string;
	readonly datasourceType: string;
	readonly endpoint: string;
	#transport?: Transport;
	#client?: Client;
	#tools: Tool[] = [];

	constructor(private readonly options: GrafanaProxiedClientOptions) {
		this.datasourceUid = options.datasourceUid;
		this.datasourceType = options.datasourceType;
		this.endpoint = options.endpoint;
	}

	async connect() {
		if (this.#client) return this.#client;

		const headers = Object.fromEntries(buildGrafanaHeaders(this.options.auth).entries());
		const { client, transport } = await connectMcpClient({
			createTransport: () => new StreamableHTTPClientTransport(new URL(this.endpoint), { requestInit: { headers } }),
			clientInfo: { name: `grafana-proxy-${this.options.datasourceType}`, version: '1.0.0' },
			clientOptions: { capabilities: {} },
		});
		const listed = await client.listTools();
		this.#transport = transport;
		this.#client = client;
		this.#tools = listed.tools;
		return client;
	}

	async listTools() {
		await this.connect();
		return this.#tools.slice();
	}

	async callTool(name: string, arguments_: Record<string, unknown>) {
		const client = await this.connect();
		return client.callTool({
			name,
			arguments: arguments_,
		});
	}

	async close() {
		await this.#transport?.close();
		this.#transport = undefined;
		this.#client = undefined;
		this.#tools = [];
	}
}
