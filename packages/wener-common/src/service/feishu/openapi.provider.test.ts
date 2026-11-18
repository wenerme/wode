import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import type { ServiceProviderContext } from '../runtime/types';
import { FeishuServiceProvider } from './index';
import { decodeFeishuResource, encodeFeishuUploadImage } from './transport';

const TOKEN = 't-fixture-tenant-token-value';
const env: Record<string, string> = { APP: 'cli_fixture', SECRET: 'fixture-app-secret-value' };

type Route = (url: URL, init: RequestInit) => Response | Promise<Response>;
const ok = (data: unknown) => Response.json({ code: 0, msg: 'success', data });

function router(routes: Record<string, Route>) {
	return vi.fn(async (input: unknown, init: RequestInit = {}) => {
		const url = new URL(String(input));
		if (url.pathname.endsWith('/auth/v3/tenant_access_token/internal'))
			return routes.token ? routes.token(url, init) : Response.json({ code: 0, tenant_access_token: TOKEN, expire: 7200 });
		const key = `${init.method ?? 'GET'} ${url.pathname.replace('/open-apis/', '')}`;
		const route = routes[key];
		if (!route) throw new Error(`Unexpected request ${key}`);
		return route(url, init);
	});
}

function local(routes: Record<string, Route>, readOnly = false, options: Record<string, string> = { appIdEnv: 'APP', appSecretEnv: 'SECRET' }) {
	const fetch = router(routes);
	const config = { provider: 'feishu', readOnly, options };
	const context: ServiceProviderContext = {
		name: 'fixture', config, context: { services: { fixture: config } },
		fetch: fetch as unknown as typeof globalThis.fetch, getEnv: (name) => env[name],
	};
	const { feishu } = FeishuServiceProvider.create(context);
	const tokens = () => fetch.mock.calls.filter(([url]) => String(url).includes('tenant_access_token')).length;
	return { feishu, fetch, tokens };
}

function remote(routes: Record<string, Route>, readOnly = true) {
	const fetch = router(routes);
	const services = normalizeCliServices([{ name: 'im', type: 'feishu', readOnly, options: { appIdEnv: 'APP', appSecretEnv: 'SECRET' } }]);
	const runtime = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(FeishuServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv: (name) => env[name],
	});
	const call = (toolName: string, input: unknown, signal?: AbortSignal) =>
		runtime.call({ params: { service: 'im' }, body: { toolName, input } }, signal ? { signal } : undefined);
	return { runtime, fetch, call };
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('Feishu IM/contact operations (local service)', () => {
	it('resolves a user by email with one token exchange and injected fetch only', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('global fetch must not be used'); }));
		const { feishu, fetch, tokens } = local({
			'POST contact/v3/users/batch_get_id': (url) => {
				expect(url.searchParams.get('user_id_type')).toBe('union_id');
				return ok({ user_list: [{ email: 'a@example.test', user_id: 'on_fixture' }] });
			},
			'GET contact/v3/users/on_fixture': (url) => {
				expect(url.searchParams.get('user_id_type')).toBe('union_id');
				return ok({ user: { union_id: 'on_fixture', name: 'Fixture', future: 1 } });
			},
		});
		await expect(feishu.getUser({ email: 'a@example.test', userIdType: 'union_id' })).resolves.toEqual({ union_id: 'on_fixture', name: 'Fixture', future: 1 });
		expect(tokens()).toBe(1);
		expect(fetch).toHaveBeenCalledTimes(3);
		await feishu.close();
	});

	it('reports an unknown email without a second request', async () => {
		const { feishu, fetch } = local({ 'POST contact/v3/users/batch_get_id': () => ok({ user_list: [{ email: 'a@example.test' }] }) });
		await expect(feishu.getUser({ email: 'a@example.test' })).rejects.toMatchObject({ code: 'OPERATION_FAILED', message: 'Feishu user not found' });
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('paginates chats and messages through pageToken and maps chatId to the chat container', async () => {
		const { feishu, tokens } = local({
			'GET im/v1/chats': (url) => ok(url.searchParams.get('page_token') === 'p2'
				? { items: [{ chat_id: 'oc_2' }], has_more: false }
				: { items: [{ chat_id: 'oc_1' }], has_more: true, page_token: 'p2' }),
			'GET im/v1/messages': (url) => {
				expect(Object.fromEntries(url.searchParams)).toEqual({
					container_id_type: 'chat', container_id: 'oc_1', sort_type: 'ByCreateTimeDesc', page_size: '10',
				});
				return ok({ items: [{ message_id: 'om_1', body: { content: '{"text":"x"}' } }], has_more: false });
			},
		});
		const first = await feishu.listChat();
		expect(first).toEqual({ items: [{ chat_id: 'oc_1' }], hasMore: true, pageToken: 'p2' });
		await expect(feishu.listChat({ pageToken: first.pageToken })).resolves.toEqual({ items: [{ chat_id: 'oc_2' }], hasMore: false });
		await expect(feishu.listMessage({ chatId: 'oc_1', sortType: 'ByCreateTimeDesc', pageSize: 10 })).resolves.toMatchObject({ hasMore: false });
		expect(tokens()).toBe(1);
	});

	it('allows reads on a read-only service and rejects every write before HTTP', async () => {
		const { feishu, fetch } = local({ 'GET im/v1/chats/oc_1': () => ok({ name: 'n' }) }, true);
		await expect(feishu.getChat({ chatId: 'oc_1' })).resolves.toEqual({ chat_id: 'oc_1', name: 'n' });
		const calls = fetch.mock.calls.length;
		for (const run of [
			() => feishu.replyMessage({ messageId: 'om_1', text: 'hi' }),
			() => feishu.deleteMessage({ messageId: 'om_1' }),
			() => feishu.addMessageReaction({ messageId: 'om_1', emojiType: 'OK' }),
			() => feishu.deleteMessageReaction({ messageId: 'om_1', reactionId: 'r' }),
			() => feishu.uploadImage({ image: new Uint8Array([1]) }),
			() => feishu.uploadFile({ file: new Uint8Array([1]), fileType: 'stream', fileName: 'a' }),
		]) await expect(run()).rejects.toMatchObject({ code: 'READ_ONLY' });
		expect(fetch.mock.calls.length).toBe(calls);
	});

	it('maps text replies to a text content JSON and raw content as given', async () => {
		const bodies: unknown[] = [];
		const { feishu } = local({
			'POST im/v1/messages/om_1/reply': (_url, init) => { bodies.push(JSON.parse(String(init.body))); return ok({ message_id: 'om_2' }); },
		});
		await expect(feishu.replyMessage({ messageId: 'om_1', text: 'hi "there"', replyInThread: true })).resolves.toEqual({ message_id: 'om_2' });
		await feishu.replyMessage({ messageId: 'om_1', msgType: 'post', content: '{"zh_cn":{}}' });
		expect(bodies).toEqual([
			{ msg_type: 'text', content: JSON.stringify({ text: 'hi "there"' }), reply_in_thread: true },
			{ msg_type: 'post', content: '{"zh_cn":{}}' },
		]);
	});

	it('returns a deletion marker for message recall', async () => {
		const { feishu } = local({ 'DELETE im/v1/messages/om_1': () => ok({}) });
		await expect(feishu.deleteMessage({ messageId: 'om_1' })).resolves.toEqual({ messageId: 'om_1', deleted: true });
	});

	it('bounds token exchange and API with one deadline and physically aborts the token fetch', async () => {
		vi.useFakeTimers();
		let tokenSignal: AbortSignal | undefined;
		const { feishu, fetch } = local({
			token: (_url, init) => new Promise<Response>((_resolve, reject) => {
				tokenSignal = init.signal!;
				tokenSignal.addEventListener('abort', () => reject(tokenSignal!.reason), { once: true });
			}),
		});
		const pending = feishu.listChat({}, { context: { timeoutMs: 20 } });
		const rejected = expect(pending).rejects.toMatchObject({ code: 'OPERATION_FAILED', message: 'Feishu request timed out' });
		await vi.advanceTimersByTimeAsync(20);
		await rejected;
		expect(tokenSignal?.aborted).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
		await feishu.close();
	});

	it('surfaces scrubbed API errors and requires app credentials and an open service', async () => {
		const { feishu } = local({
			'GET im/v1/chats/oc_1': () => Response.json({ code: 232011, msg: `no permission ${TOKEN}` }, { status: 400 }),
		});
		const error = await feishu.getChat({ chatId: 'oc_1' }).catch((e: unknown) => e as Error);
		expect(error).toMatchObject({ name: 'FeishuServiceError', code: 'OPERATION_FAILED' });
		expect(error.message).toContain('code=232011');
		expect(error.message).not.toContain(TOKEN);
		await feishu.close();
		await expect(feishu.listChat()).rejects.toMatchObject({ code: 'CLOSED' });

		const webhookOnly = local({}, false, { webhookUrlEnv: 'URL' });
		await expect(webhookOnly.feishu.listChat()).rejects.toMatchObject({ code: 'MISSING_APP_CREDENTIAL' });
		await expect(webhookOnly.feishu.getChat({ chatId: '' })).rejects.toMatchObject({ code: 'MISSING_APP_CREDENTIAL' });
		expect(webhookOnly.fetch).not.toHaveBeenCalled();
	});

	it('rejects invalid input before any request', async () => {
		const { feishu, fetch } = local({});
		await expect(feishu.getUser({} as never)).rejects.toMatchObject({ message: 'Invalid Feishu service input' });
		await expect(feishu.listMessage({ chatId: 'oc', pageSize: 51 })).rejects.toMatchObject({ message: 'Invalid Feishu service input' });
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('Feishu IM/contact operations (runtime wire)', () => {
	it('serves reads on a read-only configured service and blocks writes', async () => {
		const { call, fetch, runtime } = remote({ 'GET im/v1/chats': () => ok({ items: [], has_more: false }) });
		await expect(call('listChat', undefined)).resolves.toEqual({ items: [], hasMore: false });
		await expect(call('deleteMessage', { messageId: 'om_1' })).rejects.toThrow('read-only');
		expect(fetch.mock.calls.some(([url]) => String(url).includes('im/v1/messages'))).toBe(false);
		await runtime.close();
	});

	it('decodes a Base64 upload into multipart bytes', async () => {
		let uploaded: Uint8Array | undefined;
		const { call, runtime } = remote({
			'POST im/v1/images': async (_url, init) => {
				uploaded = new Uint8Array(await ((init.body as FormData).get('image') as Blob).arrayBuffer());
				return ok({ image_key: 'img_1' });
			},
		}, false);
		const bytes = new Uint8Array([0, 255, 7, 8]);
		await expect(call('uploadImage', encodeFeishuUploadImage({ image: bytes }))).resolves.toEqual({ imageKey: 'img_1' });
		expect(uploaded).toEqual(bytes);
		await expect(call('uploadImage', { imageBase64: 'AQID', byteLength: 9 })).rejects.toThrow();
		await runtime.close();
	});

	it('encodes a bounded download as Base64 that round-trips', async () => {
		const bytes = Uint8Array.from({ length: 1000 }, (_, i) => i % 256);
		const { call, runtime } = remote({
			'GET im/v1/messages/om_1/resources/file_1': () => new Response(bytes, {
				headers: { 'content-type': 'image/png', 'content-disposition': 'attachment; filename="a.png"' },
			}),
		});
		const wire = await call('downloadMessageResource', { messageId: 'om_1', fileKey: 'file_1', type: 'image' });
		expect(wire).toMatchObject({ byteLength: 1000, contentType: 'image/png', filename: 'a.png' });
		expect(decodeFeishuResource(wire).data).toEqual(bytes);
		await expect(call('downloadMessageResource', { messageId: 'om_1', fileKey: 'file_1', type: 'image', maxBytes: 10 })).rejects.toThrow();
		await runtime.close();
	});
});
