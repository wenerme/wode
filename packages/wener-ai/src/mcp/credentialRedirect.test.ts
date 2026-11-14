import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createFeishuMcpServer } from './feishu/server';
import { createGeminiToolsMcpServer } from './gemini-tools/server';
import { resolveGrafanaAuthOptions } from './grafana/auth';
import { GrafanaApiClient } from './grafana/client';
import { GrafanaProxiedClient } from './grafana/proxy/client';
import { createPrometheusMcpServer } from './prometheus/server';

/**
 * @wener/ai 带凭据的出站调用遇到 3xx 不跟随（包含 Grafana MCP proxy 的同源跳转）。
 * upstream 对所有路径回 307 指向 attacker（跨源，要求重放请求体），attacker 应当收到 0 次请求。
 */
type Seen = { path: string; headers: IncomingHttpHeaders; body: string };
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

function recorder(target: Seen[], respond: (res: import('node:http').ServerResponse) => void) {
	return createServer((req, res) => {
		let body = '';
		req.on('data', (chunk) => (body += chunk));
		req.on('end', () => {
			target.push({ path: req.url ?? '', headers: req.headers, body });
			respond(res);
		});
	});
}

beforeAll(async () => {
	attacker = recorder(atAttacker, (res) => res.writeHead(200, { 'content-type': 'application/json' }).end('{}'));
	attackerUrl = await listen(attacker);
	upstream = recorder(atUpstream, (res) => res.writeHead(307, { location: `${attackerUrl}/stolen` }).end());
	upstreamUrl = await listen(upstream);
});

afterAll(async () => {
	await Promise.all([upstream, attacker].map((server) => new Promise((resolve) => server.close(resolve))));
});

beforeEach(() => {
	atUpstream.length = 0;
	atAttacker.length = 0;
});

async function callTool(
	instance: { server: { connect(transport: unknown): Promise<void> } },
	name: string,
	args: Record<string, unknown>,
) {
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	await instance.server.connect(serverTransport);
	const client = new Client({ name: 'test', version: '1.0.0' });
	await client.connect(clientTransport);
	try {
		return await client.callTool({ name, arguments: args });
	} finally {
		await client.close();
	}
}

describe('gemini-tools（x-goog-api-key）', () => {
	test.each<[string, Record<string, unknown>]>([
		['web_search', { query: 'hi' }],
		['code_execution', { prompt: 'print(1)' }],
	])(
		'%s：上游 3xx 不跟随',
		async (tool, args) => {
			const instance = createGeminiToolsMcpServer({ apiKey: 'goog-key', baseUrl: `${upstreamUrl}/v1beta` });
			const result = await callTool(instance as never, tool, args);
			expect(result.isError).toBe(true);
			expect(atUpstream.length).toBeGreaterThan(0);
			expect(atUpstream[0]!.headers['x-goog-api-key']).toBe('goog-key');
			expect(atAttacker).toHaveLength(0);
			// AI SDK 默认对网络错误重试 2 次（指数退避），每次都打到 upstream、都不跟随。
		},
		30_000,
	);
});

test('feishu MCP：换 tenant token 的请求体带 appSecret，3xx 不跟随', async () => {
	const instance = createFeishuMcpServer({ appId: 'cli_x', appSecret: 'app-secret', domain: upstreamUrl });
	const lark = await instance.getClient();
	await lark.im.message.list({ params: { container_id_type: 'chat', container_id: 'oc_x' } }).catch(() => undefined);
	expect(atUpstream.length).toBeGreaterThan(0);
	expect(atUpstream[0]!.body).toContain('app-secret');
	expect(atAttacker).toHaveLength(0);
});

test('prometheus MCP：Basic Auth 请求遇到 3xx 不跟随，工具返回错误', async () => {
	const instance = createPrometheusMcpServer({ url: upstreamUrl, username: 'prom', password: 'prom-secret' });
	const result = await callTool(instance, 'query', { expr: 'up' });
	expect(result.isError).toBe(true);
	expect(atUpstream.length).toBeGreaterThan(0);
	expect(atUpstream[0]!.headers.authorization).toBe(`Basic ${Buffer.from('prom:prom-secret').toString('base64')}`);
	expect(atAttacker).toHaveLength(0);
});

test('grafana client：带 service account token 的请求遇到 3xx 不跟随，直接报错', async () => {
	const client = new GrafanaApiClient(
		resolveGrafanaAuthOptions({ url: upstreamUrl, serviceAccountToken: 'glsa_secret', timeoutMs: 5_000 }),
	);
	await expect(client.request({ path: '/api/health' })).rejects.toThrow();
	await expect(client.request({ path: '/api/ds/query', method: 'POST', body: { queries: [] } })).rejects.toThrow();
	expect(atUpstream).toHaveLength(2);
	expect(atUpstream[0]!.headers.authorization).toBe('Bearer glsa_secret');
	expect(atAttacker).toHaveLength(0);
});

function grafanaProxy(endpoint: string) {
	return new GrafanaProxiedClient({
		name: 'test',
		datasourceUid: 'test',
		datasourceType: 'test',
		endpoint,
		auth: resolveGrafanaAuthOptions({ url: endpoint, serviceAccountToken: 'glsa_secret' }),
	});
}

test.each([301, 302, 303, 307, 308])('grafana MCP proxy：同源 %s 不重放凭据或请求体', async (status) => {
	const seen: Seen[] = [];
	const server = recorder(seen, (res) => {
		if (JSON.parse(seen.at(-1)!.body || '{}').method === 'server/discover') {
			// 走真实 legacy 初始化，确保覆盖 transport 的 POST，而不仅是版本探测。
			res.writeHead(404).end();
		} else if (res.req.url === '/mcp') {
			res.writeHead(status, { location: '/stolen' }).end();
		} else {
			res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
		}
	});
	const url = await listen(server);
	const client = grafanaProxy(`${url}/mcp`);
	try {
		await expect(client.connect()).rejects.toThrow();
		expect(seen.map(({ path }) => path)).toEqual(['/mcp', '/mcp']);
		for (const request of seen) {
			expect(request.headers.authorization).toBe('Bearer glsa_secret');
		}
		expect(JSON.parse(seen[0]!.body).method).toBe('server/discover');
		expect(JSON.parse(seen[1]!.body).method).toBe('initialize');
	} finally {
		await client.close();
		await new Promise<void>((resolve) => server.close(() => resolve()));
	}
});

test('grafana MCP proxy：跨源 307 不重放凭据或请求体', async () => {
	const client = grafanaProxy(`${upstreamUrl}/mcp`);
	try {
		await expect(client.connect()).rejects.toThrow();
		expect(atUpstream).toHaveLength(1);
		expect(atUpstream[0]!.headers.authorization).toBe('Bearer glsa_secret');
		expect(atAttacker).toHaveLength(0);
	} finally {
		await client.close();
	}
});
