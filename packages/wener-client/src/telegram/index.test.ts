import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { TELEGRAM_MAX_PHOTO_BYTES, TelegramClient } from './index';

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

	it('maps common operation fields to Telegram wire names', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true, result: {} }));
		const test = client(fetch);
		await test.getChatMember({ chatId: -100, userId: 7 });
		await test.getUpdates({ offset: 3, limit: 10, timeout: 5, allowedUpdates: ['message'] });
		await test.editMessageText({ chatId: 1, messageId: 2, text: 'updated', replyMarkup: { inline_keyboard: [] } });
		expect(JSON.parse(fetch.mock.calls[0]![1]?.body as string)).toEqual({ chat_id: -100, user_id: 7 });
		expect(JSON.parse(fetch.mock.calls[1]![1]?.body as string)).toEqual({ offset: 3, limit: 10, timeout: 5, allowed_updates: ['message'] });
		expect(JSON.parse(fetch.mock.calls[2]![1]?.body as string)).toEqual({ chat_id: 1, message_id: 2, text: 'updated', reply_markup: { inline_keyboard: [] } });
		await test.close();
	});

	it('uses JSON for file references and FormData for native media uploads', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true, result: { message_id: 1 } }));
		const test = client(fetch);
		await test.sendPhoto({ chatId: 1, photo: 'file-id', caption: 'photo\nsecond line' });
		await test.sendDocument({ chatId: 1, document: { bytes: new Uint8Array([1, 2, 3]), filename: 'a.bin', contentType: 'application/octet-stream' } });
		expect(JSON.parse(fetch.mock.calls[0]![1]?.body as string)).toEqual({ chat_id: 1, photo: 'file-id', caption: 'photo\nsecond line' });
		const form = fetch.mock.calls[1]![1]?.body as FormData;
		expect(form).toBeInstanceOf(FormData);
		expect(form.get('chat_id')).toBe('1');
		expect(form.get('document')).toBeInstanceOf(Blob);
		expect((form.get('document') as File).name).toBe('a.bin');
		expect(new Uint8Array(await (form.get('document') as Blob).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
		await test.close();
	});

	it('enforces native media limits before network access', async () => {
		const fetch = vi.fn<FetchLike>();
		const test = client(fetch);
		await expect(test.sendPhoto({ chatId: 1, photo: { bytes: new Uint8Array(TELEGRAM_MAX_PHOTO_BYTES + 1), filename: 'large.jpg' } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(fetch).not.toHaveBeenCalled();
	});

	it('downloads only confined Telegram file paths and never exposes the token in output', async () => {
		const fetch = vi.fn<FetchLike>(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }));
		const test = client(fetch);
		const result = await test.downloadFile({ filePath: 'photos/file_1.jpg' });
		expect(result).toEqual({ bytes: new Uint8Array([1, 2, 3]), byteLength: 3, filePath: 'photos/file_1.jpg', contentType: 'image/jpeg' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(url.toString()).toBe('https://api.telegram.org/file/bot123456789:AAFixtureTokenValueForTestsOnly12/photos/file_1.jpg');
		expect(init?.redirect).toBe('error');
		expect(JSON.stringify(result)).not.toContain(FIXTURE_TOKEN);
		for (const filePath of ['/absolute/file', '../secret', 'photos/../secret', 'photos/%2e%2e/secret', 'https://evil.test/a', 'photos//file', 'photos\\file', 'photos/file?x=1']) {
			await expect(test.downloadFile({ filePath })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		}
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
		const logicalFailure = client(vi.fn<FetchLike>(async () => response({ ok: false, error_code: 400, description: 'chat not found', parameters: { retry_after: 3 } })));
		await expect(logicalFailure.request('sendMessage', { chat_id: 1, text: 'x' })).rejects.toMatchObject({ code: 'REQUEST_FAILED', apiCode: 400, retryAfter: 3 });
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

	it.each([
		['download', 'timeout'], ['download', 'close'], ['json', 'timeout'], ['json', 'close'],
	] as const)('cancels a late %s response body after %s even when fetch ignores abort', async (kind, stop) => {
		let resolve!: (response: Response) => void;
		const fetch = vi.fn<FetchLike>(() => new Promise<Response>((done) => { resolve = done; }));
		const test = client(fetch, { timeoutMs: stop === 'timeout' ? 5 : 30_000 });
		const pending = kind === 'download' ? test.downloadFile({ filePath: 'docs/a.bin' }) : test.getMe();
		const failed = expect(pending).rejects.toMatchObject({ code: stop === 'timeout' ? 'TIMEOUT' : 'CLOSED' });
		if (stop === 'close') await test.close();
		await failed;
		await test.close();
		const cancel = vi.fn();
		resolve(new Response(new ReadableStream<Uint8Array>({ cancel })));
		await Promise.resolve();
		await Promise.resolve();
		expect(cancel).toHaveBeenCalledOnce();
	});
});
