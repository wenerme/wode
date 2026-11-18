import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeishuServiceProvider, sanitizeFeishuOutput } from './index';
import type { ServiceProviderContext } from '../runtime/types';
import type { FeishuServiceCallOptions } from './FeishuServiceContract';

const environment: Record<string, string> = {
	APP: 'cli_fixture', SECRET: 'fixture-app-secret', URL: 'https://example.test/hook', HOOK_SECRET: 'fixture-hook-secret',
};
async function fixture(readOnly = false) {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ code: 0, data: {} }));
	const getEnv = vi.fn((name: string) => environment[name]);
	const config = { provider: 'feishu', readOnly, options: { appIdEnv: 'APP', appSecretEnv: 'SECRET', webhookUrlEnv: 'URL', webhookSecretEnv: 'HOOK_SECRET' } };
	const context: ServiceProviderContext = { name: 'fixture', config, context: { services: { fixture: config } }, fetch, getEnv };
	return { ...(await FeishuServiceProvider.create(context)), fetch, getEnv };
}

const routed = async (url: unknown) => String(url).includes('tenant_access_token')
	? Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 })
	: Response.json({ code: 0, msg: 'success', data: { message_id: 'om_fixture' } });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Feishu options and lifecycle adapter', () => {
	it('routes sendMessage and request through the shared OpenAPI client and token', async () => {
		const test = await fixture();
		test.fetch.mockImplementation(routed);
		const controller = new AbortController();
		await expect(test.feishu.sendMessage({ to: 'ou_fixture', text: 'hello' }, { signal: controller.signal, context: { timeoutMs: 123 } }))
			.resolves.toMatchObject({ code: 0, data: { message_id: 'om_fixture' } });
		await test.feishu.request({ path: 'im/v1/messages', method: 'PATCH', body: { future: true }, params: { page_size: '10' } }, { signal: controller.signal });
		await test.feishu.listChat({}, { signal: controller.signal });
		const calls = test.fetch.mock.calls.map(([url, init]) => [new URL(String(url)), init!] as const);
		// One token exchange for legacy and typed operations alike.
		expect(calls.filter(([url]) => url.pathname.includes('tenant_access_token'))).toHaveLength(1);
		const [sendUrl, sendInit] = calls[1]!;
		expect(sendUrl.searchParams.get('receive_id_type')).toBe('open_id');
		expect(JSON.parse(String(sendInit.body))).toEqual({ receive_id: 'ou_fixture', msg_type: 'text', content: JSON.stringify({ text: 'hello' }) });
		expect(new Headers(sendInit.headers).get('authorization')).toBe('Bearer fixture-token');
		const [requestUrl, requestInit] = calls[2]!;
		expect(requestInit.method).toBe('PATCH');
		expect(requestUrl.searchParams.get('page_size')).toBe('10');
		expect(JSON.parse(String(requestInit.body))).toEqual({ future: true });
		controller.abort();
		expect(sendInit.signal?.aborted).toBe(true);
		expect(requestInit.signal?.aborted).toBe(true);
		await expect(test.feishu.sendMessage({ to: 'cli_unknown', text: 'x' })).rejects.toThrow('Unknown Feishu receive id type');
		await test.feishu.close();
	});

	it.each(['sendMessage', 'request'] as const)('%s success and cancellation leave no deadline timers', async (method) => {
		vi.useFakeTimers();
		const test = await fixture();
		test.fetch.mockImplementation(routed);
		const invoke = (options: FeishuServiceCallOptions) => method === 'sendMessage'
			? test.feishu.sendMessage({ to: 'oc_fixture', text: 'hello' }, options)
			: test.feishu.request({ path: 'im/v1/messages' }, options);
		try {
			await expect(invoke({ context: { timeoutMs: 20 } })).resolves.toMatchObject({ code: 0 });
			expect(vi.getTimerCount()).toBe(0);
			test.fetch.mockImplementationOnce((_url, init) => new Promise<Response>((_resolve, reject) => {
				const signal = init!.signal!;
				signal.addEventListener('abort', () => reject(signal.reason), { once: true });
			}));
			const controller = new AbortController();
			const cancelled = invoke({ signal: controller.signal, context: { timeoutMs: 100 } });
			const rejected = expect(cancelled).rejects.toThrow('cancelled');
			await vi.advanceTimersByTimeAsync(0);
			expect(test.fetch).toHaveBeenCalledTimes(3);
			expect(vi.getTimerCount()).toBe(1);
			controller.abort(new Error('cancelled'));
			await rejected;
			expect(test.fetch.mock.calls[2]![1]?.signal?.aborted).toBe(true);
			expect(vi.getTimerCount()).toBe(0);
		} finally {
			await test.feishu.close();
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	});

	it('injects signal without changing webhook URL, signature, markdown card or HTTP method', async () => {
		const test = await fixture();
		const controller = new AbortController();
		await test.feishu.sendWebhook({ markdown: '**hello**' }, { signal: controller.signal });
		const [url, init] = test.fetch.mock.calls[0]!;
		expect(url).toBe(environment.URL);
		expect(init?.method).toBe('POST');
		expect(JSON.parse(String(init?.body))).toMatchObject({
			msg_type: 'interactive', timestamp: expect.any(String), sign: expect.any(String),
			card: { elements: [{ tag: 'div', text: { content: '**hello**', tag: 'lark_md' } }] },
		});
		controller.abort();
		expect(init?.signal?.aborted).toBe(true);
		await expect(test.feishu.sendWebhook({ text: 'hi' }, { context: { timeoutMs: 10 } })).rejects.toMatchObject({ code: 'INVALID_CONFIG' });
		expect(test.fetch).toHaveBeenCalledTimes(1);
		await test.feishu.close();
	});

	it('rejects every read-only method before any HTTP request', async () => {
		const test = await fixture(true);
		await expect(test.feishu.sendMessage({ to: 'oc_fixture', text: 'hi' })).rejects.toMatchObject({ code: 'READ_ONLY' });
		await expect(test.feishu.sendWebhook({ text: 'hi' })).rejects.toMatchObject({ code: 'READ_ONLY' });
		await expect(test.feishu.request({ path: 'im/v1/messages' })).rejects.toMatchObject({ code: 'READ_ONLY' });
		expect(test.fetch).not.toHaveBeenCalled();
		await test.feishu[Symbol.asyncDispose]();
	});

	it('prevents pre-aborted calls and physically aborts a pending token exchange', async () => {
		const test = await fixture();
		test.fetch.mockImplementation((_url, init) => new Promise<Response>((_resolve, reject) => {
			init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
		}));
		const controller = new AbortController();
		const pending = test.feishu.request({ path: 'im/v1/messages' }, { signal: controller.signal });
		const rejected = expect(pending).rejects.toThrow('cancelled');
		await vi.waitFor(() => expect(test.fetch).toHaveBeenCalledTimes(1));
		controller.abort(new Error('cancelled'));
		await rejected;
		expect(test.fetch.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await expect(test.feishu.sendMessage({ to: 'oc_fixture', text: 'hi' }, { signal: controller.signal })).rejects.toThrow('cancelled');
		expect(test.fetch).toHaveBeenCalledTimes(1);
		await test.feishu.close();
	});

	it('carries the Feishu log_id on the service error', async () => {
		const test = await fixture();
		test.fetch.mockImplementation(async (url) => String(url).includes('tenant_access_token')
			? Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 })
			: Response.json({ code: 230002, msg: 'bot not in chat', error: { log_id: 'log_fixture_9' } }, { status: 400 }));
		await expect(test.feishu.sendMessage({ to: 'oc_fixture', text: 'hi' })).rejects.toMatchObject({
			name: 'FeishuServiceError', code: 'OPERATION_FAILED', logId: 'log_fixture_9', message: expect.stringContaining('log_id=log_fixture_9'),
		});
		await test.feishu.close();
	});

	it('aborts in-flight webhook waits, supports repeated close/dispose and rejects calls after close', async () => {
		const test = await fixture();
		test.fetch.mockImplementation(() => new Promise(() => {}));
		const pending = test.feishu.sendWebhook({ text: 'hi' });
		const rejected = expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		await vi.waitFor(() => expect(test.fetch).toHaveBeenCalledTimes(1));
		const first = test.feishu.close();
		expect(test.feishu.close()).toBe(first);
		await test.feishu[Symbol.asyncDispose]();
		await rejected;
		expect(test.fetch.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await expect(test.feishu.request({ path: 'im/v1/messages' })).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('redacts upstream errors and preserves output secret redaction', async () => {
		const test = await fixture();
		test.fetch.mockRejectedValue(Object.assign(new Error('Bearer fixture-token fixture-app-secret'), { payload: { secret: 'fixture-hook-secret' } }));
		await expect(test.feishu.sendWebhook({ text: 'hi' })).rejects.toMatchObject({ code: 'OPERATION_FAILED', message: 'Feishu service operation failed' });
		try { await test.feishu.sendWebhook({ text: 'hi' }); } catch (error) {
			expect(JSON.stringify(error)).not.toContain('fixture-token');
			expect(error).not.toHaveProperty('cause');
			expect(error).not.toHaveProperty('payload');
		}
		expect(sanitizeFeishuOutput({ app_secret: 'a', secret: 'b', access_token: 'c', nested: ['Bearer fixture-token'] })).toEqual({
			app_secret: '<redacted>', secret: '<redacted>', access_token: '<redacted>', nested: ['Bearer <redacted>'],
		});
		await test.feishu.close();
	});
});
