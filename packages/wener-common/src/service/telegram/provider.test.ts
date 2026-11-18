import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { TelegramServiceOptionsSchema, TelegramServiceProvider } from './index';
import { TelegramOperations } from './operations';

const FIXTURE_TOKEN = '123456789:AAFixtureTokenValueForTestsOnly12';

function runtime(options: Record<string, unknown> = { botTokenEnv: 'TELEGRAM_FIXTURE_TOKEN' }, readOnly = true) {
	const getEnv = vi.fn((name: string) => name === 'TELEGRAM_FIXTURE_TOKEN' ? FIXTURE_TOKEN : undefined);
	const fetch = vi.fn<FetchLike>(async () => Response.json({ ok: true, result: { id: 1, username: 'fixture_bot' } }));
	const service = normalizeCliServices([{ name: 'bot', type: 'telegram', readOnly, options }]);
	const runtime = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(TelegramServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime, fetch, getEnv };
}

describe('Telegram service options schema', () => {
	it('requires botTokenEnv and rejects inline botToken', () => {
		expect(TelegramServiceOptionsSchema.safeParse({ botTokenEnv: 'TELEGRAM_BOT_TOKEN' }).success).toBe(true);
		expect(TelegramServiceOptionsSchema.safeParse({}).success).toBe(false);
		expect(TelegramServiceOptionsSchema.safeParse({ botToken: FIXTURE_TOKEN }).success).toBe(false);
		expect(TelegramServiceOptionsSchema.safeParse({ botTokenEnv: 'TELEGRAM_BOT_TOKEN', botToken: FIXTURE_TOKEN }).success).toBe(false);
	});
});

describe('Telegram service provider', () => {
	it('discovers a complete schema without env or network access', async () => {
		const test = runtime();
		const schema = await test.runtime.getSchema({ params: { service: 'bot' } });
		expect(Object.keys(schema.tools)).toEqual(Object.keys(TelegramOperations));
		expect(schema.tools.getMe.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.sendMessage.annotations?.readOnlyHint).toBe(false);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves env only on dispatch and routes the typed operation', async () => {
		const test = runtime();
		const result = await test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'getMe', input: {} } });
		expect(result).toMatchObject({ ok: true, result: { id: 1, username: 'fixture_bot' } });
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('TELEGRAM_FIXTURE_TOKEN');
		const url = test.fetch.mock.calls[0]?.[0];
		expect(url?.toString()).toBe(`https://api.telegram.org/bot${FIXTURE_TOKEN}/getMe`);
		await test.runtime.close();
	});

	it('allows reads but rejects writes when the service is read-only', async () => {
		const test = runtime(undefined, true);
		await expect(
			test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'sendMessage', input: { chatId: 1, text: 'hi' } } }),
		).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('allows writes when the service is configured writable', async () => {
		const test = runtime(undefined, false);
		const fetch = vi.fn<FetchLike>(async () => Response.json({ ok: true, result: { message_id: 1 } }));
		test.fetch.mockImplementation(fetch);
		const result = await test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'sendMessage', input: { chatId: 1, text: 'hi' } } });
		expect(result).toMatchObject({ ok: true, result: { message_id: 1 } });
		await test.runtime.close();
	});

	it('keeps getUpdates and raw writes behind the read-only guard before credentials', async () => {
		const test = runtime(undefined, true);
		await expect(test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'getUpdates', input: {} } })).rejects.toThrow('read-only');
		await expect(test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'request', input: { method: 'sendMessage' } } })).rejects.toThrow('read-only');
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('allows requestRead for a whitelisted method and resolves credentials only on dispatch', async () => {
		const test = runtime(undefined, true);
		await expect(test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'requestRead', input: { method: 'getChat', params: { chat_id: 1 } } } })).resolves.toMatchObject({ ok: true, result: { id: 1 } });
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('TELEGRAM_FIXTURE_TOKEN');
		expect(test.fetch).toHaveBeenCalledOnce();
		await test.runtime.close();
	});

	it('does not resolve credentials when a lazy provider is closed before first use', async () => {
		const test = runtime();
		await test.runtime.close();
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('rejects a request method with an unsafe name before credentials or HTTP', async () => {
		const test = runtime(undefined, false);
		await expect(
			test.runtime.call({ params: { service: 'bot' }, body: { toolName: 'request', input: { method: 'bad/method' } } }),
		).rejects.toThrow();
		expect(test.getEnv).not.toHaveBeenCalled();
	});

	it('validates file paths and webhook secrets before resolving credentials', async () => {
		const test = runtime(undefined, false);
		for (const [toolName, input] of [
			['downloadFile', { filePath: 'docs/%252e%252e/token' }],
			['setWebhook', { url: 'https://example.com/webhook', secretToken: 'invalid secret' }],
			['getChat', { chatId: '   ' }],
			['sendMessage', { chatId: 1, text: 'hello', parseMode: 'HTML\n' }],
			['getMyCommands', { languageCode: 'en\n' }],
		] as const) await expect(test.runtime.call({ params: { service: 'bot' }, body: { toolName, input } })).rejects.toThrow();
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});
});
