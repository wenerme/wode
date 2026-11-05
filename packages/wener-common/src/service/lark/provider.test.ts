import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { LarkServiceOptionsSchema, LarkServiceProvider } from './index';

function runtime(options: Record<string, unknown>, readOnly = true, envs: Record<string, string> = {}) {
	const getEnv = vi.fn((name: string) => envs[name]);
	const fetch = vi.fn<FetchLike>(async () => Response.json({ code: 0, msg: 'success', data: {} }));
	const service = normalizeCliServices([{ name: 'default', type: 'lark', readOnly, options }]);
	const rt = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(LarkServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime: rt, fetch, getEnv };
}

describe('Lark service options schema', () => {
	it('rejects an app credential with only one half configured', () => {
		expect(LarkServiceOptionsSchema.safeParse({ appIdEnv: 'LARK_APP_ID' }).success).toBe(false);
		expect(LarkServiceOptionsSchema.safeParse({ appSecretEnv: 'LARK_APP_SECRET' }).success).toBe(false);
	});

	it('rejects configuration with neither app credential nor webhook', () => {
		expect(LarkServiceOptionsSchema.safeParse({}).success).toBe(false);
	});

	it('accepts an app credential pair alone', () => {
		expect(
			LarkServiceOptionsSchema.safeParse({ appIdEnv: 'LARK_APP_ID', appSecretEnv: 'LARK_APP_SECRET' }).success,
		).toBe(true);
	});

	it('accepts a webhook url alone', () => {
		expect(LarkServiceOptionsSchema.safeParse({ webhookUrlEnv: 'LARK_WEBHOOK_URL' }).success).toBe(true);
	});

	it('accepts both configured together', () => {
		expect(
			LarkServiceOptionsSchema.safeParse({
				appIdEnv: 'LARK_APP_ID',
				appSecretEnv: 'LARK_APP_SECRET',
				webhookUrlEnv: 'LARK_WEBHOOK_URL',
				webhookSecretEnv: 'LARK_WEBHOOK_SECRET',
			}).success,
		).toBe(true);
	});
});

describe('Lark service provider', () => {
	it('discovers a complete schema without env or network access', async () => {
		const test = runtime({ appIdEnv: 'LARK_APP_ID', appSecretEnv: 'LARK_APP_SECRET' });
		const schema = await test.runtime.getSchema({ params: { service: 'default' } });
		expect(Object.keys(schema.tools)).toEqual(['sendMessage', 'sendWebhook', 'request']);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('sends a message via app credential and resolves env only on dispatch', async () => {
		const test = runtime(
			{ appIdEnv: 'LARK_APP_ID', appSecretEnv: 'LARK_APP_SECRET' },
			false,
			{ LARK_APP_ID: 'cli_fixture', LARK_APP_SECRET: 'fixture-secret' },
		);
		const combinedFetch = vi.fn(async (url: any) => {
			const href = String(url);
			if (href.includes('tenant_access_token')) {
				return Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 });
			}
			return Response.json({ code: 0, msg: 'success', data: { message_id: 'om_1' } });
		});
		test.fetch.mockImplementation(combinedFetch);
		// getTenantAccessTokenInternal calls the module-level `request` helper with its own default
		// fetch (globalThis.fetch), not the FeishuClient instance's injected fetch; stub it too so
		// the token exchange does not hit the network in tests.
		vi.stubGlobal('fetch', combinedFetch);
		try {
			const result = await test.runtime.call({
				params: { service: 'default' },
				body: { toolName: 'sendMessage', input: { to: 'ou_abc', text: 'hello' } },
			});
			expect(result).toMatchObject({ data: { message_id: 'om_1' } });
			expect(test.getEnv).toHaveBeenCalledWith('LARK_APP_ID');
			expect(test.getEnv).toHaveBeenCalledWith('LARK_APP_SECRET');
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('rejects sendMessage when app credential is not configured', async () => {
		const test = runtime({ webhookUrlEnv: 'LARK_WEBHOOK_URL' }, false, { LARK_WEBHOOK_URL: 'https://example.test/hook' });
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendMessage', input: { to: 'ou_abc', text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('rejects request when app credential is not configured', async () => {
		const test = runtime({ webhookUrlEnv: 'LARK_WEBHOOK_URL' }, false, { LARK_WEBHOOK_URL: 'https://example.test/hook' });
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'request', input: { path: 'im/v1/messages' } } }),
		).rejects.toThrow();
	});

	it('rejects sendWebhook when webhook is not configured', async () => {
		const test = runtime(
			{ appIdEnv: 'LARK_APP_ID', appSecretEnv: 'LARK_APP_SECRET' },
			false,
			{ LARK_APP_ID: 'cli_fixture', LARK_APP_SECRET: 'fixture-secret' },
		);
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendWebhook', input: { text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('sends a webhook message using the service-configured url and secret', async () => {
		const test = runtime(
			{ webhookUrlEnv: 'LARK_WEBHOOK_URL', webhookSecretEnv: 'LARK_WEBHOOK_SECRET' },
			false,
			{ LARK_WEBHOOK_URL: 'https://open.feishu.cn/hook/fixture', LARK_WEBHOOK_SECRET: 'fixture-secret' },
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
			{ webhookUrlEnv: 'LARK_WEBHOOK_URL' },
			true,
			{ LARK_WEBHOOK_URL: 'https://example.test/hook' },
		);
		await expect(
			test.runtime.call({ params: { service: 'default' }, body: { toolName: 'sendWebhook', input: { text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});
});
