import { describe, expect, it, vi } from 'vitest';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { type ITelegramService, TelegramServiceProvider } from './index';
import { TelegramOperations } from './operations';

describe('Telegram registered operations', () => {
	it('covers every existing method with typed input and call options', async () => {
		const service: ITelegramService = {
			type: 'telegram', readOnly: true,
			getMe: vi.fn(async () => ({ id: 1, username: 'fixture_bot' })),
			sendMessage: vi.fn(async () => ({ message_id: 1 })),
			request: vi.fn(async () => ({ ok: true })),
			close: vi.fn(async () => {}),
			[Symbol.asyncDispose]: vi.fn(async () => {}),
		};
		const definition: ServiceProviderDefinition<ITelegramService> = { ...TelegramServiceProvider, create: () => ({ telegram: service }) };
		const registry = new ServiceRegistry({ context: { services: { bot: { provider: 'telegram', readOnly: true } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		for (const test of [
			{ operation: TelegramOperations.getMe, input: {}, invoke: service.getMe, args: [options] },
			{ operation: TelegramOperations.sendMessage, input: { chatId: 1, text: 'hi' }, invoke: service.sendMessage, args: [{ chatId: 1, text: 'hi' }, options] },
			{ operation: TelegramOperations.request, input: { method: 'getUpdates' }, invoke: service.request, args: ['getUpdates', undefined, options] },
		]) {
			await test.operation.execute(registry, 'bot', test.input, options);
			expect(test.invoke).toHaveBeenCalledExactlyOnceWith(...test.args);
		}
		const tools = createServiceProviderAdapter(definition).tools!;
		expect(Object.keys(tools)).toEqual(['getMe', 'sendMessage', 'request']);
		expect(Object.keys(TelegramOperations)).toEqual(Object.keys(tools));
		await registry.close();
		expect(service.close).toHaveBeenCalledTimes(1);
	});

	it.each(['unknown', 'input', 'cancelled'])('rejects %s before credentials or HTTP', async (kind) => {
		const config = { provider: 'telegram', readOnly: true, options: { botTokenEnv: 'TELEGRAM_TEST_TOKEN' } };
		const getEnv = vi.fn(() => '123456789:AAFixtureTokenValueForTestsOnly12');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(TelegramServiceProvider).create({
			name: 'bot', config, context: { services: { bot: config } }, fetch, getEnv,
		});
		const controller = new AbortController();
		if (kind === 'cancelled') controller.abort();
		await expect(client.call(kind === 'unknown' ? 'missing' : 'sendMessage', kind === 'input' ? { chatId: 1 } : { chatId: 1, text: 'hi' }, { signal: controller.signal })).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});

	it('rejects a write from a read-only configured service before HTTP', async () => {
		const config = { provider: 'telegram', readOnly: true, options: { botTokenEnv: 'TELEGRAM_TEST_TOKEN' } };
		const getEnv = vi.fn(() => '123456789:AAFixtureTokenValueForTestsOnly12');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const client = await createServiceProviderAdapter(TelegramServiceProvider).create({
			name: 'bot', config, context: { services: { bot: config } }, fetch, getEnv,
		});
		await expect(client.call('sendMessage', { chatId: 1, text: 'hi' })).rejects.toThrow('read-only');
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});
});
