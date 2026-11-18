import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { FeishuServiceContract, FeishuServiceOptionsSchema, FeishuServiceProvider } from './index';

function runtime(options: Record<string, unknown>, readOnly = true, envs: Record<string, string> = {}) {
	const getEnv = vi.fn((name: string) => envs[name]);
	const fetch = vi.fn<FetchLike>(async () => Response.json({ code: 0, msg: 'success', data: {} }));
	const service = normalizeCliServices([{ name: 'default', type: 'feishu', readOnly, options }]);
	const rt = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(FeishuServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime: rt, fetch, getEnv };
}

describe('Feishu service options schema', () => {
	it('rejects an app credential with only one half configured', () => {
		expect(FeishuServiceOptionsSchema.safeParse({ appIdEnv: 'FEISHU_APP_ID' }).success).toBe(false);
		expect(FeishuServiceOptionsSchema.safeParse({ appSecretEnv: 'FEISHU_APP_SECRET' }).success).toBe(false);
	});

	it('rejects configuration with neither app credential nor webhook', () => {
		expect(FeishuServiceOptionsSchema.safeParse({}).success).toBe(false);
	});

	it('accepts an app credential pair alone', () => {
		expect(
			FeishuServiceOptionsSchema.safeParse({ appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' }).success,
		).toBe(true);
	});

	it('accepts a webhook url alone', () => {
		expect(FeishuServiceOptionsSchema.safeParse({ webhookUrlEnv: 'FEISHU_WEBHOOK_URL' }).success).toBe(true);
	});

	it('accepts both configured together', () => {
		expect(
			FeishuServiceOptionsSchema.safeParse({
				appIdEnv: 'FEISHU_APP_ID',
				appSecretEnv: 'FEISHU_APP_SECRET',
				webhookUrlEnv: 'FEISHU_WEBHOOK_URL',
				webhookSecretEnv: 'FEISHU_WEBHOOK_SECRET',
			}).success,
		).toBe(true);
	});
});

describe('Feishu service provider', () => {
	it.each(['sendMessage', 'request'] as const)('%s deadline includes a delayed tenant token exchange', async (method) => {
		vi.useFakeTimers();
		let exchangeSignal: AbortSignal | undefined;
		const apiFetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ code: 0, data: {} }));
		const tokenFetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
			exchangeSignal = init?.signal ?? undefined;
			await new Promise<void>((resolve) => setTimeout(resolve, 100));
			return Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 });
		});
		const fetch = vi.fn<typeof globalThis.fetch>((url, init) => String(url).includes('tenant_access_token') ? tokenFetch(url, init) : apiFetch(url, init));
		const config = {
			provider: 'feishu', readOnly: false,
			options: { appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET', timeoutMs: 500 },
		};
		const { feishu } = FeishuServiceProvider.create({
			name: 'default', config, context: { services: { default: config } }, fetch,
			getEnv: (name) => name === 'FEISHU_APP_ID' ? 'cli_fixture' : name === 'FEISHU_APP_SECRET' ? 'fixture-secret' : undefined,
		});
		try {
			const started = Date.now();
			const options = { context: { timeoutMs: 20 } };
			const pending = method === 'sendMessage'
				? feishu.sendMessage({ to: 'oc_fixture', text: 'hello' }, options)
				: feishu.request({ path: 'im/v1/messages' }, options);
			let settledAt: number | undefined;
			void pending.catch(() => { settledAt = Date.now() - started; });
			const rejected = expect(pending).rejects.toMatchObject({
				name: 'FeishuServiceError', code: 'OPERATION_FAILED', message: 'Feishu request timed out',
			});
			await vi.advanceTimersByTimeAsync(19);
			expect(tokenFetch).toHaveBeenCalledTimes(1);
			expect(String(tokenFetch.mock.calls[0]![0])).toContain('tenant_access_token/internal');
			expect(settledAt).toBeUndefined();
			await vi.advanceTimersByTimeAsync(1);
			await rejected;
			expect(settledAt).toBe(20);
			expect(apiFetch).not.toHaveBeenCalled();
			// The deadline physically aborts the exchange, and no API request follows.
			expect(exchangeSignal?.aborted).toBe(true);
			await vi.advanceTimersByTimeAsync(100);
			expect(apiFetch).not.toHaveBeenCalled();
		} finally {
			await feishu.close();
			vi.clearAllTimers();
			vi.useRealTimers();
			vi.unstubAllGlobals();
		}
	});

	it('discovers a complete schema without env or network access', async () => {
		const test = runtime({ appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' });
		const schema = await test.runtime.getSchema({ params: { service: 'default' } });
		expect(Object.keys(schema.tools)).toEqual(Object.keys(FeishuServiceContract));
		expect(Object.keys(schema.tools).slice(0, 3)).toEqual(['sendMessage', 'sendWebhook', 'request']);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('sends a message via app credential and resolves env only on dispatch', async () => {
		const test = runtime(
			{ appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' },
			false,
			{ FEISHU_APP_ID: 'cli_fixture', FEISHU_APP_SECRET: 'fixture-secret' },
		);
		const combinedFetch = vi.fn(async (url: any) => {
			const href = String(url);
			if (href.includes('tenant_access_token')) {
				return Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 });
			}
			return Response.json({ code: 0, msg: 'success', data: { message_id: 'om_1' } });
		});
		test.fetch.mockImplementation(combinedFetch);
		// The token exchange must use the injected fetch, never the global one.
		vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('global fetch must not be used'); }));
		try {
			const result = await test.runtime.call({
				params: { service: 'default' },
				body: { toolName: 'sendMessage', input: { to: 'ou_abc', text: 'hello' } },
			});
			expect(result).toMatchObject({ data: { message_id: 'om_1' } });
			expect(test.getEnv).toHaveBeenCalledWith('FEISHU_APP_ID');
			expect(test.getEnv).toHaveBeenCalledWith('FEISHU_APP_SECRET');
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('rejects sendMessage when app credential is not configured', async () => {
		const test = runtime({ webhookUrlEnv: 'FEISHU_WEBHOOK_URL' }, false, { FEISHU_WEBHOOK_URL: 'https://example.test/hook' });
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendMessage', input: { to: 'ou_abc', text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('rejects request when app credential is not configured', async () => {
		const test = runtime({ webhookUrlEnv: 'FEISHU_WEBHOOK_URL' }, false, { FEISHU_WEBHOOK_URL: 'https://example.test/hook' });
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'request', input: { path: 'im/v1/messages' } } }),
		).rejects.toThrow();
	});

	it('rejects sendWebhook when webhook is not configured', async () => {
		const test = runtime(
			{ appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' },
			false,
			{ FEISHU_APP_ID: 'cli_fixture', FEISHU_APP_SECRET: 'fixture-secret' },
		);
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendWebhook', input: { text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('sends a webhook message using the service-configured url and secret', async () => {
		const test = runtime(
			{ webhookUrlEnv: 'FEISHU_WEBHOOK_URL', webhookSecretEnv: 'FEISHU_WEBHOOK_SECRET' },
			false,
			{ FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/hook/fixture', FEISHU_WEBHOOK_SECRET: 'fixture-secret' },
		);
		const result = await test.runtime.call({
			params: { service: 'default' },
			body: { toolName: 'sendWebhook', input: { text: 'hello' } },
		});
		expect(result).toMatchObject({ code: 0 });
		expect(test.fetch).toHaveBeenCalledWith('https://open.feishu.cn/hook/fixture', expect.any(Object));
	});

	it('rejects writes when the service is read-only', async () => {
		const test = runtime(
			{ webhookUrlEnv: 'FEISHU_WEBHOOK_URL' },
			true,
			{ FEISHU_WEBHOOK_URL: 'https://example.test/hook' },
		);
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendWebhook', input: { text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('propagates the runtime operation signal through the provider to webhook HTTP', async () => {
		const test = runtime({ webhookUrlEnv: 'FEISHU_WEBHOOK_URL' }, false, { FEISHU_WEBHOOK_URL: 'https://example.test/hook' });
		test.fetch.mockImplementation(() => new Promise(() => {}));
		const controller = new AbortController();
		const pending = test.runtime.call({
			params: { service: 'default' }, body: { toolName: 'sendWebhook', input: { text: 'hi' } },
		}, { signal: controller.signal });
		const rejected = expect(pending).rejects.toThrow('cancelled');
		await vi.waitFor(() => expect(test.fetch).toHaveBeenCalledTimes(1));
		controller.abort(new Error('cancelled'));
		await rejected;
		expect(test.fetch.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await test.runtime.close();
	});
});
