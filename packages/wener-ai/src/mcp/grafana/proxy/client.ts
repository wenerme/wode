import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
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
	#transport?: StreamableHTTPClientTransport;
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
		const transport = new StreamableHTTPClientTransport(new URL(this.endpoint), {
			requestInit: { headers },
		});
		const client = new Client(
			{
				name: `grafana-proxy-${this.options.datasourceType}`,
				version: '1.0.0',
			},
			{
				capabilities: {},
			},
		);

		await client.connect(transport);
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
