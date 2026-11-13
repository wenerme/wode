import {
	createServer,
	type IncomingHttpHeaders,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { resolveGrafanaAuthOptions } from '../grafana/auth';
import { GrafanaProxiedClient } from '../grafana/proxy/client';
import { createRelayMcpServer } from './server';

/**
 * 带凭据连上游 MCP 的出站连接（relay 的 Streamable HTTP / SSE、Grafana 数据源 MCP 代理）遇到重定向：
 * - 跨源 307/302：不跟随，连接以错误结束，目标源收不到任何请求（凭据、请求体都不会过去）；
 * - 同源且不改变方法（`/mcp` → `/mcp/` 的 307）：照常跟随，凭据只到同一个源。
 */
type Seen = { method: string; path: string; headers: IncomingHttpHeaders };
let upstream: Server;
let attacker: Server;
let upstreamUrl: string;
let attackerUrl: string;
const atUpstream: Seen[] = [];
const atAttacker: Seen[] = [];

function listen(server: Server): Promise<string> {
	return new Promise((resolve) =>
		server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)),
	);
}

function readBody(req: IncomingMessage): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

function createUpstreamMcpServer() {
	const server = new McpServer({ name: 'upstream', version: '1.0.0' });
	server.registerTool('ping', { description: 'ping' }, async () => ({ content: [{ type: 'text', text: 'pong' }] }));
	return server;
}

/** 把 node 请求交给 SDK 的 Web 标准 handler（每个请求一个 McpServer 实例）。 */
async function serveMcp(req: IncomingMessage, res: ServerResponse, body: Buffer) {
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === 'string') headers.set(key, value);
		else if (Array.isArray(value)) for (const item of value) headers.append(key, item);
	}
	const request = new Request(`http://${req.headers.host}${req.url}`, {
		method: req.method,
		headers,
		...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body: new Uint8Array(body) }),
	});
	const response = await createMcpHandler(() => createUpstreamMcpServer()).fetch(request);
	res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
	if (response.body) Readable.fromWeb(response.body as never).pipe(res);
	else res.end();
}

beforeAll(async () => {
	attacker = createServer(async (req, res) => {
		await readBody(req);
		atAttacker.push({ method: req.method ?? '', path: req.url ?? '', headers: req.headers });
		res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
	});
	attackerUrl = await listen(attacker);
	upstream = createServer(async (req, res) => {
		const body = await readBody(req);
		const path = req.url ?? '';
		atUpstream.push({ method: req.method ?? '', path, headers: req.headers });
		if (path.startsWith('/cross-307')) return res.writeHead(307, { location: `${attackerUrl}/stolen` }).end();
		if (path.startsWith('/cross-302')) return res.writeHead(302, { location: `${attackerUrl}/stolen` }).end();
		// 同源的尾斜杠重定向（常见于把 MCP 挂在子路径上的框架）。
		if (path === '/mcp') return res.writeHead(307, { location: '/mcp/' }).end();
		if (path === '/mcp/') return serveMcp(req, res, body);
		res.writeHead(404).end();
	});
	upstreamUrl = await listen(upstream);
});

afterAll(async () => {
	await Promise.all([upstream, attacker].map((server) => new Promise((resolve) => server.close(resolve))));
});

beforeEach(() => {
	atUpstream.length = 0;
	atAttacker.length = 0;
});

const RelayHeaders = { authorization: 'Bearer relay-secret', 'x-api-key': 'relay-api-key' };

describe('relay：上游跨源重定向不跟随', () => {
	test.each([
		['http', 307],
		['http', 302],
		['sse', 307],
		['sse', 302],
	] as const)('%s transport，上游回 %i 指向另一个源：连接报错，目标源收不到请求', async (transport, status) => {
		const relay = createRelayMcpServer({ url: `${upstreamUrl}/cross-${status}/mcp`, transport, headers: RelayHeaders });
		try {
			await expect(relay.getClient()).rejects.toThrow(/not followed/u);
			expect(atUpstream.length).toBeGreaterThan(0);
			expect(atUpstream[0]?.headers['x-api-key']).toBe('relay-api-key');
			expect(atAttacker).toHaveLength(0);
		} finally {
			await relay.close();
		}
	});

	test('同源 307（/mcp → /mcp/）照常跟随：经 relay 列出、调用上游工具，凭据只到上游', async () => {
		const relay = createRelayMcpServer({ url: `${upstreamUrl}/mcp`, headers: RelayHeaders });
		const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
		await relay.server.connect(serverTransport);
		const client = new Client({ name: 'relay-redirect-test', version: '1.0.0' });
		await client.connect(clientTransport);
		try {
			const { tools } = await client.listTools();
			expect(tools.map((tool) => tool.name)).toEqual(['ping']);
			expect(await client.callTool({ name: 'ping', arguments: {} })).toMatchObject({
				content: [{ type: 'text', text: 'pong' }],
			});
			const followed = atUpstream.filter((seen) => seen.path === '/mcp/');
			expect(followed.length).toBeGreaterThan(0);
			expect(followed[0]?.headers['x-api-key']).toBe('relay-api-key');
			expect(atAttacker).toHaveLength(0);
		} finally {
			await client.close();
			await relay.close();
		}
	});
});

describe('Grafana 数据源 MCP 代理：跨源重定向不跟随', () => {
	const createClient = (path: string) =>
		new GrafanaProxiedClient({
			name: 'tempo',
			datasourceUid: 'tempo-uid',
			datasourceType: 'tempo',
			endpoint: `${upstreamUrl}${path}`,
			auth: resolveGrafanaAuthOptions({
				url: upstreamUrl,
				serviceAccountToken: 'glsa_secret',
				extraHeaders: { 'x-grafana-extra': 'extra-secret' },
			}),
		});

	test.each([307, 302])('上游回 %i 指向另一个源：连接报错，目标源收不到请求', async (status) => {
		const client = createClient(`/cross-${status}/api/datasources/proxy/uid/tempo-uid/api/mcp`);
		try {
			await expect(client.listTools()).rejects.toThrow(/not followed/u);
			expect(atUpstream.length).toBeGreaterThan(0);
			expect(atUpstream[0]?.headers.authorization).toBe('Bearer glsa_secret');
			expect(atAttacker).toHaveLength(0);
		} finally {
			await client.close();
		}
	});

	test('同源 307 照常跟随：列出并调用代理的工具', async () => {
		const client = createClient('/mcp');
		try {
			expect((await client.listTools()).map((tool) => tool.name)).toEqual(['ping']);
			expect(await client.callTool('ping', {})).toMatchObject({ content: [{ type: 'text', text: 'pong' }] });
			expect(atUpstream.find((seen) => seen.path === '/mcp/')?.headers['x-grafana-extra']).toBe('extra-secret');
			expect(atAttacker).toHaveLength(0);
		} finally {
			await client.close();
		}
	});
});
