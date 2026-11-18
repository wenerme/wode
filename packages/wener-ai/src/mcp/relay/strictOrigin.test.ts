import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchWithStrictOrigin } from '../client/fetchWithStrictOrigin';
import { resolveGrafanaAuthOptions } from '../grafana/auth';
import { GrafanaProxiedClient } from '../grafana/proxy/client';
import { createRelayMcpServer } from './server';

afterEach(() => vi.unstubAllGlobals());

const Consumers = ['relay-http', 'relay-sse-get', 'relay-sse-post', 'grafana'] as const;
const StrictPolicyError = /not followed: strict same-origin policy/u;

describe.each(Consumers)('%s：应用层严格同源策略', (consumer) => {
	test.each([
		['默认端口升级', 'http://upstream.test', 'https://upstream.test/mcp'],
		['显式默认端口升级', 'http://upstream.test:80', 'https://upstream.test:443/mcp'],
		['协议降级', 'https://upstream.test', 'http://upstream.test/mcp'],
		['只改协议', 'http://upstream.test:8443', 'https://upstream.test:8443/mcp'],
		['只改主机', 'http://upstream.test', 'http://other.test/mcp'],
		['只改端口', 'http://upstream.test', 'http://upstream.test:8080/mcp'],
	])('%s：目标未收到请求或凭据', async (_label, origin, target) => {
		await assertBlocked(origin, target, 307);
	});

	test.each([301, 302, 303, 308])('%i 默认端口升级也被应用层拒绝', async (status) => {
		await assertBlocked('http://upstream.test', 'https://upstream.test/mcp', status);
	});

	test('同源第一跳后的默认端口升级仍被拒绝', async () => {
		await assertBlocked('http://upstream.test', 'https://upstream.test/mcp', 307, true);
	});

	async function assertBlocked(origin: string, target: string, status: number, chain = false) {
		const seen: Request[] = [];
		// 使用真实 SDK transport，只替换最底层网络，避免依赖本机 80/443 和 TLS 证书。
		// 无守卫时 SDK 会跟随默认端口升级，记录的目标请求会直接揭示凭据外发。
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>(async (input, init) => {
				const request = new Request(input, init);
				seen.push(request);
				const url = new URL(request.url);
				if (url.origin !== new URL(origin).origin) return new Response('unexpected target request', { status: 418 });
				if (consumer === 'relay-sse-post' && request.method === 'GET') {
					return new Response(
						new ReadableStream<Uint8Array>({
							start(controller) {
								controller.enqueue(new TextEncoder().encode('event: endpoint\ndata: /messages\n\n'));
								request.signal.addEventListener('abort', () => controller.close(), { once: true });
							},
						}),
						{ headers: { 'content-type': 'text/event-stream' } },
					);
				}
				return new Response(null, {
					status,
					headers: { location: chain && url.pathname !== '/hop' ? '/hop' : target },
				});
			}),
		);

		const grafana =
			consumer === 'grafana'
				? new GrafanaProxiedClient({
						name: 'tempo',
						datasourceUid: 'tempo-uid',
						datasourceType: 'tempo',
						endpoint: `${origin}/mcp`,
						auth: resolveGrafanaAuthOptions({ url: origin, serviceAccountToken: 'secret' }),
					})
				: undefined;
		const relay = grafana
			? undefined
			: createRelayMcpServer({
					url: `${origin}/mcp`,
					transport: consumer === 'relay-http' ? 'http' : 'sse',
					headers: { authorization: 'Bearer secret' },
				});
		try {
			// 校验应用自己的错误，SDK 默认拒绝跨源不足以让此回归测试通过。
			await expect(grafana ? grafana.connect() : relay!.getClient()).rejects.toThrow(StrictPolicyError);
			expect(seen).toHaveLength(1 + Number(consumer === 'relay-sse-post') + Number(chain));
			expect(seen.every((request) => new URL(request.url).origin === new URL(origin).origin)).toBe(true);
			expect(seen.every((request) => request.headers.get('authorization') === 'Bearer secret')).toBe(true);
			expect(seen.every((request) => request.redirect === 'manual')).toBe(true);
			expect(seen.at(-1)?.method).toBe(consumer === 'relay-sse-get' ? 'GET' : 'POST');
		} finally {
			await grafana?.close();
			await relay?.close();
		}
	}
});

test.each([
	'http://upstream.test:80/path',
	new URL('http://upstream.test:80/path'),
	new Request('http://upstream.test:80/path', { redirect: 'follow' }),
])('守卫规范化默认端口，允许同源路径且强制 manual：%s', async (input) => {
	const response = new Response(null, { status: 307, headers: { location: 'http://upstream.test/next' } });
	const network = vi.fn<typeof fetch>().mockResolvedValue(response);
	vi.stubGlobal('fetch', network);
	expect(await fetchWithStrictOrigin(input, { redirect: 'follow' })).toBe(response);
	expect(network).toHaveBeenCalledWith(input, { redirect: 'manual' });
});

test('拒绝跨源时取消响应体', async () => {
	const cancel = vi.fn();
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>().mockResolvedValue(
			new Response(new ReadableStream({ cancel }), {
				status: 307,
				headers: { location: 'https://upstream.test/path' },
			}),
		),
	);
	await expect(fetchWithStrictOrigin('http://upstream.test/path')).rejects.toThrow(StrictPolicyError);
	expect(cancel).toHaveBeenCalledOnce();
});
