import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';
import { PROMQL_GUIDE } from './guides';
import { registerMetadataTools, registerQueryTools } from './tools';

const log = consola.withTag('prom-mcp');

export interface CreatePrometheusMcpServerOptions {
	url: string;
	username?: string;
	password?: string;
	name?: string;
	version?: string;
}

export interface PrometheusContext {
	server: McpServer;
	request: (options: RequestOptions) => Promise<any>;
	log: typeof log;
}

export interface RequestOptions {
	path: string;
	method?: string;
	params?: Record<string, unknown>;
	body?: Record<string, unknown>;
}

export function createPrometheusMcpServer({
	url,
	username,
	password,
	name = 'prometheus',
	version = '1.0.0',
}: CreatePrometheusMcpServerOptions) {
	const server = new McpServer({ name, version });

	const baseUrl = url.replace(/\/$/, '');
	const authHeaders: HeadersInit = {};
	if (username && password) {
		authHeaders.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
	}

	const request = async ({ path, method = 'GET', params, body }: RequestOptions) => {
		const u = new URL(baseUrl + path);
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				if (v === undefined || v === null) continue;
				if (Array.isArray(v)) {
					for (const item of v) u.searchParams.append(k, String(item));
				} else {
					u.searchParams.append(k, String(v));
				}
			}
		}

		const headers: HeadersInit = { ...authHeaders };
		let bodyContent: BodyInit | undefined;

		if (body) {
			if (method === 'POST') {
				headers['Content-Type'] = 'application/x-www-form-urlencoded';
				const fd = new URLSearchParams();
				for (const [k, v] of Object.entries(body)) {
					if (v === undefined || v === null) continue;
					if (Array.isArray(v)) {
						for (const item of v) fd.append(k, String(item));
					} else {
						fd.append(k, String(v));
					}
				}
				bodyContent = fd;
			}
		}

		log.debug(`${method} ${u.toString()}`);
		const startTime = Date.now();

		const res = await fetch(u, {
			method,
			headers,
			body: bodyContent,
		});

		const duration = Date.now() - startTime;
		log.debug(`${method} ${u.pathname} ${res.status} ${duration}ms`);

		if (!res.ok) {
			const text = await res.text();
			log.error(`Prometheus API error ${res.status}: ${text}`);
			throw new Error(`Prometheus API error ${res.status}: ${text}`);
		}
		return res.json();
	};

	// =========================================================================
	// Guide Resources
	// =========================================================================

	server.resource(
		'promql-guide',
		'prometheus://promql-guide',
		{
			description: 'PromQL syntax guide with examples and common patterns',
			mimeType: 'text/markdown',
		},
		async () => ({
			contents: [{ uri: 'prometheus://promql-guide', mimeType: 'text/markdown', text: PROMQL_GUIDE }],
		}),
	);

	// =========================================================================
	// Register Tools
	// =========================================================================

	const ctx: PrometheusContext = { server, request, log };

	registerQueryTools(ctx);
	registerMetadataTools(ctx);

	return {
		server,
		request,
		async close() {
			await server.close();
		},
	};
}
