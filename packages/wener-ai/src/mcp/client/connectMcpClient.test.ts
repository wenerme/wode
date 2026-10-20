import { SdkHttpError, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { describe, expect, test } from 'vitest';
import { connectMcpClient } from './connectMcpClient';

const Url = 'http://mcp.test/mcp';

function createServer() {
	const server = new McpServer({ name: 'probe', version: '1.0.0' });
	server.registerTool('ping', { description: 'ping' }, async () => ({ content: [{ type: 'text', text: 'pong' }] }));
	return server;
}

type Fetch = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** 双代服务端（与生产入口一致：每请求一个实例）。 */
const dualEra: Fetch = (url, init) => createMcpHandler(() => createServer()).fetch(new Request(url, init));

/** 只讲 2025 的服务端：先按 `badDiscover` 回应 server/discover 探测，其它请求走 2025 无状态处理。 */
function legacyOnly(badDiscover: (body: any) => Response | undefined): Fetch {
	return async (url, init) => {
		const request = new Request(url, init);
		if (request.method === 'POST') {
			const body = await request
				.clone()
				.json()
				.catch(() => undefined);
			const reply = body?.method === 'server/discover' ? badDiscover(body) : undefined;
			if (reply) return reply;
		}
		return createMcpHandler(() => createServer(), {}).fetch(request);
	};
}

const connect = (fetch: Fetch, mode?: 'auto' | 'legacy') =>
	connectMcpClient({
		createTransport: () => new StreamableHTTPClientTransport(new URL(Url), { fetch }),
		clientInfo: { name: 'test', version: '1.0.0' },
		versionNegotiation: mode,
	});

describe('connectMcpClient', () => {
	test('默认 auto：双代服务端走 2026-07-28', async () => {
		const { client } = await connect(dualEra);
		expect(client.getProtocolEra()).toBe('modern');
		expect(await client.callTool({ name: 'ping', arguments: {} })).toMatchObject({ content: [{ text: 'pong' }] });
		await client.close();
	});

	test('legacy：始终 initialize', async () => {
		const { client } = await connect(dualEra, 'legacy');
		expect(client.getProtocolEra()).toBe('legacy');
		await client.close();
	});

	test('第三方只讲 2025、对 server/discover 回 -32601：SDK 自己回退 initialize', async () => {
		const fetch = legacyOnly(
			(body) =>
				new Response(
					JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'Method not found' } }),
					{
						status: 400,
						headers: { 'content-type': 'application/json' },
					},
				),
		);
		const { client } = await connect(fetch);
		expect(client.getProtocolEra()).toBe('legacy');
		await client.close();
	});

	test('第三方对 server/discover 回 500：再用 legacy 重连一次（v1 时可用的服务不能因为探测而失效）', async () => {
		const fetch = legacyOnly(() => new Response('boom', { status: 500 }));
		const { client } = await connect(fetch);
		expect(client.getProtocolEra()).toBe('legacy');
		expect(await client.callTool({ name: 'ping', arguments: {} })).toMatchObject({ content: [{ text: 'pong' }] });
		await client.close();
	});

	test('401/403 不回退：只发一次请求', async () => {
		let calls = 0;
		const fetch: Fetch = async () => {
			calls++;
			return new Response('denied', { status: 401 });
		};
		await expect(connect(fetch)).rejects.toSatisfy(
			(error: unknown) => error instanceof SdkHttpError || (error instanceof Error && /401|auth/iu.test(error.message)),
		);
		expect(calls).toBe(1);
	});

	test('fetch 抛错（网络不通、地址守卫拒绝、宿主把 401 转成异常）不回退：只尝试一次', async () => {
		let calls = 0;
		const fetch: Fetch = async () => {
			calls++;
			throw new Error('MCP relay URL resolved to a private address');
		};
		await expect(connect(fetch)).rejects.toThrow();
		expect(calls).toBe(1);
	});

	test('探测拿到无法识别的 2xx（如 HTML）：再用 legacy 重连一次', async () => {
		let calls = 0;
		const fetch = legacyOnly(() => {
			calls++;
			return new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } });
		});
		const { client } = await connect(fetch);
		expect(client.getProtocolEra()).toBe('legacy');
		expect(calls).toBe(1);
		await client.close();
	});
});
