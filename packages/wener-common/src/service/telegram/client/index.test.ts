import { describe, expect, it, vi } from 'vitest';
import { TelegramServiceContract } from '../TelegramServiceContract';
import type { ServiceRuntimeClient } from '../../runtime/types';
import { createTelegramServiceToolClient } from './index';

function runtime(call: (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown = async () => ({ ok: true, result: {} })): ServiceRuntimeClient {
	return {
		getSchema: vi.fn(async () => ({
		tools: Object.fromEntries(Object.keys(TelegramServiceContract).map((name) => [name, { inputSchema: {} }])),
		})),
		call: vi.fn(async (input: unknown, options?: { signal?: AbortSignal }) => await call(input, options)),
	};
}

const envelope = (result: unknown) => ({ ok: true, result });

describe('createTelegramServiceToolClient', () => {
	it('adapts contract request input to the remote tool without changing method or params', async () => {
		const remote = runtime(async () => envelope({ updates: [] }));
		const service = await createTelegramServiceToolClient(remote, 'bot', { readOnly: true });
		await expect(service.request({ method: 'getChat', params: { chat_id: 1 } })).resolves.toEqual(envelope({ updates: [] }));
		expect(remote.call).toHaveBeenCalledWith(
			{ params: { service: 'bot' }, body: { toolName: 'request', input: { method: 'getChat', params: { chat_id: 1 } } } },
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		await service.close();
	});

	it('validates remote inputs and outputs against the contract', async () => {
		const remote = runtime();
		const service = await createTelegramServiceToolClient(remote, 'bot', { readOnly: false });
		await expect(service.request({ method: 'bad/method' })).rejects.toThrow('Invalid Telegram service input');
		const invalidOutput = runtime(async () => ({ result: {} }));
		const invalidService = await createTelegramServiceToolClient(invalidOutput, 'bot', { readOnly: false });
		await expect(invalidService.getMe({})).rejects.toThrow('Invalid Telegram service response');
		await service.close();
		await invalidService.close();
	});

	it('enforces the read-only guard while allowing a whitelisted request method', async () => {
		const remote = runtime();
		const service = await createTelegramServiceToolClient(remote, 'bot', { readOnly: true });
		await expect(service.request({ method: 'getChat' })).resolves.toEqual(envelope({}));
		await expect(service.request({ method: 'sendMessage', params: { chat_id: 1, text: 'x' } })).rejects.toThrow('read-only');
		await expect(service.request({ method: 'getUpdates' })).rejects.toThrow('read-only');
		await expect(service.requestRead({ method: 'getChat', params: { chat_id: 1 } })).resolves.toEqual(envelope({}));
		await expect(service.requestRead({ method: 'getUpdates' })).rejects.toThrow('not read-only');
		await expect(service.sendMessage({ chatId: 1, text: 'x' })).rejects.toThrow('read-only');
		await service.close();
	});

	it('round-trips native binary inputs and outputs through the remote wire contract', async () => {
		const remote = runtime(async (input) => {
			const request = input as { body: { toolName: string; input: { photo?: { base64?: string; byteLength?: number }; document?: { base64?: string; byteLength?: number } } } };
			if (request.body.toolName === 'downloadFile') return { base64: 'AQID', byteLength: 3, filePath: 'docs/a.bin' };
			return envelope(request.body.input);
		});
		const service = await createTelegramServiceToolClient(remote, 'bot', { readOnly: false });
		await expect(service.sendPhoto({ chatId: 1, photo: { bytes: new Uint8Array([1, 2, 3]), filename: 'a.jpg' } })).resolves.toMatchObject({ ok: true });
		const downloaded = await service.downloadFile({ filePath: 'docs/a.bin' });
		expect(downloaded.bytes).toEqual(new Uint8Array([1, 2, 3]));
		expect(downloaded.byteLength).toBe(3);
		await service.close();
	});

	it('honors timeout, abort and close for remote calls', async () => {
		const pending = runtime((_input, options) => new Promise<never>((_resolve, reject) => {
			options?.signal?.addEventListener('abort', () => reject(options.signal?.reason));
		}));
		const service = await createTelegramServiceToolClient(pending, 'bot');
		await expect(service.getMe({}, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		const controller = new AbortController();
		const aborted = service.getMe({}, { signal: controller.signal });
		controller.abort(new Error('caller aborted'));
		await expect(aborted).rejects.toThrow('caller aborted');
		const closing = service.getMe({});
		await service.close();
		await expect(closing).rejects.toThrow('closed');
		await expect(service.close()).resolves.toBeUndefined();
		await expect(service.getMe({})).rejects.toThrow('closed');
	});

	it('settles active calls before close completes even when the transport ignores cancellation', async () => {
		const remote = runtime(() => new Promise(() => undefined));
		const service = await createTelegramServiceToolClient(remote, 'bot');
		let settled = false;
		const pending = service.whoami({}).catch(() => { settled = true; });
		await service.close();
		expect(settled).toBe(true);
		await pending;
	});

	it('does not dispatch after the client-level signal has been aborted', async () => {
		const remote = runtime();
		const controller = new AbortController();
		const service = await createTelegramServiceToolClient(remote, 'bot', { signal: controller.signal });
		controller.abort();
		await expect(service.whoami({})).rejects.toThrow();
		expect(remote.call).not.toHaveBeenCalled();
		await service.close();
	});
});
