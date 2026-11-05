import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { TelegramClient } from './index';

const FIXTURE_TOKEN = '123456789:AAFixtureTokenValueForTestsOnly12';

function response(value: unknown, init?: ResponseInit): Response {
	return Response.json(value, init);
}
function client(fetch: FetchLike, options: Partial<ConstructorParameters<typeof TelegramClient>[0]> = {}) {
	return new TelegramClient({ botToken: FIXTURE_TOKEN, fetch, ...options });
}

describe('TelegramClient', () => {
	it('calls getMe via POST /bot<token>/getMe', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true, result: { id: 1, is_bot: true, username: 'fixture_bot' } }));
		const test = client(fetch);
		const result = await test.getMe();
		expect(result).toEqual({ id: 1, is_bot: true, username: 'fixture_bot' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(url.toString()).toBe(`https://api.telegram.org/bot${FIXTURE_TOKEN}/getMe`);
		expect(init?.method).toBe('POST');
		await test.close();
	});

	it('sends a message via POST /sendMessage with a snake_case JSON body', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true, result: { message_id: 42 } }));
		const test = client(fetch);
		const result = await test.sendMessage({ chatId: 123, text: 'hello', disableNotification: true });
		expect(result).toEqual({ message_id: 42 });
		const [url, init] = fetch.mock.calls[0]!;
		expect(url.toString()).toBe(`https://api.telegram.org/bot${FIXTURE_TOKEN}/sendMessage`);
		expect(JSON.parse(init?.body as string)).toEqual({ chat_id: 123, text: 'hello', disable_notification: true });
		await test.close();
	});

	it('passes through a generic method request', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true, result: [] }));
		const test = client(fetch);
		const result = await test.request('getUpdates', { limit: 1 });
		expect(result).toEqual([]);
		const [url, init] = fetch.mock.calls[0]!;
		expect(url.toString()).toBe(`https://api.telegram.org/bot${FIXTURE_TOKEN}/getUpdates`);
		expect(JSON.parse(init?.body as string)).toEqual({ limit: 1 });
		await test.close();
	});

	it('rejects an invalid bot token format at construction', () => {
		expect(() => client(vi.fn<FetchLike>(), { botToken: 'not-a-token' })).toThrow();
		expect(() => client(vi.fn<FetchLike>(), { botToken: '123:short' })).toThrow();
	});

	it('rejects an invalid method name before any network access', async () => {
		const fetch = vi.fn<FetchLike>();
		const test = client(fetch);
		await expect(test.request('bad/method')).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
	});

	it('treats a server-level HTTP error and an ok:false payload as request failures', async () => {
		const http = client(vi.fn<FetchLike>(async () => response({ ok: false, description: 'boom' }, { status: 500 })));
		await expect(http.getMe()).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
		const authFailed = client(vi.fn<FetchLike>(async () => response({ ok: false, description: 'Unauthorized' }, { status: 401 })));
		await expect(authFailed.getMe()).rejects.toMatchObject({ code: 'AUTH_FAILED' });
		const logicalFailure = client(vi.fn<FetchLike>(async () => response({ ok: false, description: 'chat not found' })));
		await expect(logicalFailure.request('sendMessage', { chat_id: 1, text: 'x' })).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
	});

	it('honors an abort signal', async () => {
		const pending = vi.fn<FetchLike>((_url, init) => new Promise<Response>((_resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
		}));
		const test = client(pending);
		const controller = new AbortController();
		const aborted = test.getMe({ signal: controller.signal });
		controller.abort();
		await expect(aborted).rejects.toMatchObject({ code: 'ABORTED' });
		await test.close();
	});

	it('times out a request that never resolves', async () => {
		const pending = vi.fn<FetchLike>(() => new Promise<Response>(() => undefined));
		const test = client(pending, { timeoutMs: 10 });
		await expect(test.getMe()).rejects.toMatchObject({ code: 'TIMEOUT' });
		await test.close();
	});

	it('rejects pending and new requests once closed', async () => {
		const pending = vi.fn<FetchLike>(() => new Promise<Response>(() => undefined));
		const test = client(pending);
		const closing = test.getMe();
		await test.close();
		await expect(closing).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(test.getMe()).rejects.toMatchObject({ code: 'CLOSED' });
	});
});
