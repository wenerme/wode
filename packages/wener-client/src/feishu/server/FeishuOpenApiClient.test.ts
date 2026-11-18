import { describe, expect, it, vi } from 'vitest';
import {
	FEISHU_MAX_IMAGE_BYTES,
	FeishuOpenApiClient,
	FeishuOpenApiError,
	parseContentDispositionFilename,
} from './FeishuOpenApiClient';

const APP_SECRET = 'fixture-app-secret-value';
const TOKEN = 't-fixture-tenant-token-value';

type Route = (url: URL, init: RequestInit) => Response | Promise<Response>;

function fixture(routes: Record<string, Route>, now = () => 1_000_000) {
	const fetch = vi.fn(async (input: unknown, init: RequestInit = {}) => {
		const url = new URL(String(input));
		if (url.pathname.endsWith('/auth/v3/tenant_access_token/internal')) {
			return Response.json({ code: 0, msg: 'ok', tenant_access_token: TOKEN, expire: 7200 });
		}
		const key = `${init.method ?? 'GET'} ${url.pathname.replace('/open-apis/', '')}`;
		const route = routes[key];
		if (!route) throw new Error(`Unexpected request ${key}`);
		return route(url, init);
	});
	const client = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch, now });
	const tokenCalls = () => fetch.mock.calls.filter(([url]) => String(url).includes('tenant_access_token')).length;
	return { client, fetch, tokenCalls };
}

const ok = (data: unknown) => Response.json({ code: 0, msg: 'success', data });

describe('FeishuOpenApiClient', () => {
	it('exchanges the tenant token once and reuses it within and across operations', async () => {
		const { client, fetch, tokenCalls } = fixture({
			'POST contact/v3/users/batch_get_id': () => ok({ user_list: [{ email: 'a@example.test', user_id: 'ou_fixture' }] }),
			'GET contact/v3/users/ou_fixture': () => ok({ user: { open_id: 'ou_fixture', name: 'Fixture' } }),
		});
		const [match] = await client.batchGetUserId({ emails: ['a@example.test'], userIdType: 'open_id' });
		const user = await client.getUser({ userId: String(match.user_id), userIdType: 'open_id' });
		expect(user).toEqual({ open_id: 'ou_fixture', name: 'Fixture' });
		expect(tokenCalls()).toBe(1);
		const tokenInit = fetch.mock.calls[0][1]!;
		expect(JSON.parse(String(tokenInit.body))).toEqual({ app_id: 'cli_fixture', app_secret: APP_SECRET });
		const lookup = fetch.mock.calls[1];
		expect(new URL(String(lookup[0])).searchParams.get('user_id_type')).toBe('open_id');
		expect(JSON.parse(String(lookup[1]!.body))).toEqual({ emails: ['a@example.test'] });
		expect(new Headers(lookup[1]!.headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
	});

	it('refreshes the token five minutes before expiry', async () => {
		let now = 0;
		const { client, tokenCalls } = fixture({ 'GET im/v1/chats': () => ok({ items: [] }) }, () => now);
		await client.listChats();
		now = (7200 - 6 * 60) * 1000;
		await client.listChats();
		expect(tokenCalls()).toBe(1);
		now = (7200 - 4 * 60) * 1000;
		await client.listChats();
		expect(tokenCalls()).toBe(2);
	});

	it('paginates with page_token and reports has_more', async () => {
		const pages: Record<string, unknown> = {
			'': { items: [{ chat_id: 'oc_1' }], has_more: true, page_token: 'next-1' },
			'next-1': { items: [{ chat_id: 'oc_2' }], has_more: false, page_token: '' },
		};
		const { client } = fixture({
			'GET im/v1/chats': (url) => ok(pages[url.searchParams.get('page_token') ?? '']),
			'GET im/v1/messages': (url) => {
				expect(url.searchParams.get('container_id_type')).toBe('chat');
				expect(url.searchParams.get('container_id')).toBe('oc_1');
				expect(url.searchParams.get('page_size')).toBe('20');
				return ok({ items: [{ message_id: 'om_1' }], has_more: false });
			},
		});
		const first = await client.listChats({ pageSize: 1 });
		expect(first).toEqual({ items: [{ chat_id: 'oc_1' }], hasMore: true, pageToken: 'next-1' });
		const second = await client.listChats({ pageSize: 1, pageToken: first.pageToken });
		expect(second).toEqual({ items: [{ chat_id: 'oc_2' }], hasMore: false });
		await expect(client.listMessages({ containerId: 'oc_1', pageSize: 20 })).resolves.toEqual({ items: [{ message_id: 'om_1' }], hasMore: false });
	});

	it('keeps chat id on detail, member total and message items', async () => {
		const { client } = fixture({
			'GET im/v1/chats/oc_1': () => ok({ name: 'Fixture chat', future: { x: 1 } }),
			'GET im/v1/chats/oc_1/members': () => ok({ items: [{ member_id: 'ou_1' }], has_more: false, member_total: 1 }),
			'GET im/v1/messages/om_1': () => ok({ items: [{ message_id: 'om_1' }, { message_id: 'om_2' }] }),
		});
		await expect(client.getChat({ chatId: 'oc_1' })).resolves.toEqual({ chat_id: 'oc_1', name: 'Fixture chat', future: { x: 1 } });
		await expect(client.listChatMembers({ chatId: 'oc_1' })).resolves.toEqual({ items: [{ member_id: 'ou_1' }], hasMore: false, memberTotal: 1 });
		await expect(client.getMessage({ messageId: 'om_1' })).resolves.toHaveLength(2);
	});

	it('sends write requests with the documented paths and bodies', async () => {
		const seen: Array<{ key: string; body: unknown }> = [];
		const record = (key: string, data: unknown): Route => (_url, init) => {
			seen.push({ key, body: init.body ? JSON.parse(String(init.body)) : undefined });
			return ok(data);
		};
		const { client } = fixture({
			'POST im/v1/messages/om_1/reply': record('reply', { message_id: 'om_2' }),
			'DELETE im/v1/messages/om_1': record('delete', {}),
			'POST im/v1/messages/om_1/reactions': record('react', { reaction_id: 'r_1' }),
			'DELETE im/v1/messages/om_1/reactions/r_1': record('unreact', { reaction_id: 'r_1' }),
		});
		await client.replyMessage({ messageId: 'om_1', msgType: 'text', content: '{"text":"hi"}', replyInThread: true });
		await client.deleteMessage({ messageId: 'om_1' });
		await client.addMessageReaction({ messageId: 'om_1', emojiType: 'THUMBSUP' });
		await client.deleteMessageReaction({ messageId: 'om_1', reactionId: 'r_1' });
		expect(seen).toEqual([
			{ key: 'reply', body: { msg_type: 'text', content: '{"text":"hi"}', reply_in_thread: true } },
			{ key: 'delete', body: undefined },
			{ key: 'react', body: { reaction_type: { emoji_type: 'THUMBSUP' } } },
			{ key: 'unreact', body: undefined },
		]);
	});

	it('uploads images and files as multipart without a manual content type', async () => {
		const forms: FormData[] = [];
		const { client, fetch } = fixture({
			'POST im/v1/images': (_url, init) => { forms.push(init.body as FormData); return ok({ image_key: 'img_1' }); },
			'POST im/v1/files': (_url, init) => { forms.push(init.body as FormData); return ok({ file_key: 'file_1' }); },
		});
		await expect(client.uploadImage({ image: new Uint8Array([1, 2, 3]), filename: 'a.png' })).resolves.toEqual({ imageKey: 'img_1' });
		await expect(client.uploadFile({ file: new Uint8Array([4, 5]), fileType: 'pdf', fileName: 'a.pdf', duration: 10 })).resolves.toEqual({ fileKey: 'file_1' });
		expect(forms[0].get('image_type')).toBe('message');
		expect(new Uint8Array(await (forms[0].get('image') as Blob).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
		expect(forms[1].get('file_type')).toBe('pdf');
		expect(forms[1].get('file_name')).toBe('a.pdf');
		expect(forms[1].get('duration')).toBe('10');
		expect(new Headers(fetch.mock.calls[1][1]!.headers).get('content-type')).toBeNull();
	});

	it('rejects empty and oversized uploads before any request', async () => {
		const { client, fetch } = fixture({});
		await expect(client.uploadImage({ image: new Uint8Array() })).rejects.toThrow('must not be empty');
		await expect(client.uploadImage({ image: new Uint8Array(FEISHU_MAX_IMAGE_BYTES + 1) })).rejects.toThrow('exceeds size limit');
		await expect(client.uploadFile({ file: new Uint8Array([1]), fileType: 'stream', fileName: ' ' })).rejects.toThrow('file_name');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('downloads message resources with metadata and a byte bound', async () => {
		const { client } = fixture({
			'GET im/v1/messages/om_1/resources/file_1': (url) => {
				expect(url.searchParams.get('type')).toBe('file');
				return new Response(new Uint8Array([9, 8, 7]), {
					headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="../x/report.pdf"' },
				});
			},
			'GET im/v1/messages/om_1/resources/big': () => new Response(new Uint8Array(10)),
			'GET im/v1/messages/om_1/resources/declared': () =>
				new Response(new Uint8Array(4), { headers: { 'content-length': '999999999' } }),
		});
		await expect(client.getMessageResource({ messageId: 'om_1', fileKey: 'file_1', type: 'file' })).resolves.toEqual({
			data: new Uint8Array([9, 8, 7]), contentType: 'application/pdf', filename: 'report.pdf',
		});
		await expect(client.getMessageResource({ messageId: 'om_1', fileKey: 'big', type: 'file', maxBytes: 4 })).rejects.toThrow('size limit');
		await expect(client.getMessageResource({ messageId: 'om_1', fileKey: 'declared', type: 'file' })).rejects.toThrow('size limit');
	});

	it('turns JSON error bodies on resource downloads into API errors', async () => {
		const { client } = fixture({
			'GET im/v1/messages/om_1/resources/file_1': () =>
				Response.json({ code: 234003, msg: 'File not in msg.' }, { status: 400 }),
		});
		await expect(client.getMessageResource({ messageId: 'om_1', fileKey: 'file_1', type: 'image' }))
			.rejects.toMatchObject({ name: 'FeishuOpenApiError', status: 400, code: 234003 });
	});

	it('never echoes tokens, secrets or URLs in errors', async () => {
		const { client } = fixture({
			'GET im/v1/chats': () => Response.json({
				code: 99991663, msg: `invalid access_token=${TOKEN} Bearer ${TOKEN} app_secret: ${APP_SECRET}`,
				error: { log_id: 'log_fixture_1' },
			}, { status: 401 }),
		});
		const error = await client.listChats().catch((e: unknown) => e);
		expect(error).toBeInstanceOf(FeishuOpenApiError);
		const text = `${(error as Error).message} ${JSON.stringify(error)}`;
		expect(text).not.toContain(TOKEN);
		expect(text).not.toContain(APP_SECRET);
		expect(text).not.toContain('open.feishu.cn');
		expect(error).toMatchObject({ status: 401, code: 99991663, logId: 'log_fixture_1' });
	});

	it('reports a failed token exchange without leaking the secret', async () => {
		const fetch = vi.fn(async () => Response.json({ code: 10014, msg: `app secret invalid ${APP_SECRET}` }));
		const client = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch });
		const error = (await client.listChats().catch((e: unknown) => e)) as Error;
		expect(error.message).toContain('Feishu tenant token request failed');
		expect(error.message).toContain('code=10014');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('links the caller signal to the token exchange and passes it to the API request', async () => {
		const controller = new AbortController();
		const { client, fetch } = fixture({ 'GET im/v1/chats': () => ok({ items: [] }) });
		await client.listChats({}, { signal: controller.signal });
		expect(fetch.mock.calls[1]![1]?.signal).toBe(controller.signal);
		controller.abort(new Error('cancelled'));
		const fresh = fixture({});
		await expect(fresh.client.listChats({}, { signal: controller.signal })).rejects.toThrow('cancelled');
		expect(fresh.fetch).not.toHaveBeenCalled();
	});

	it('aborts the token exchange once its only waiter is cancelled', async () => {
		let exchangeSignal: AbortSignal | undefined;
		const fetch = vi.fn((_url: unknown, init: RequestInit = {}) => new Promise<Response>((_resolve, reject) => {
			exchangeSignal = init.signal ?? undefined;
			exchangeSignal?.addEventListener('abort', () => reject(exchangeSignal!.reason), { once: true });
		}));
		const client = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch });
		const controller = new AbortController();
		const pending = client.listChats({}, { signal: controller.signal });
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		controller.abort(new Error('cancelled'));
		await expect(pending).rejects.toThrow('cancelled');
		expect(exchangeSignal?.aborted).toBe(true);
	});

	it('coalesces concurrent token exchanges; one caller aborting does not fail the others', async () => {
		let resolveToken!: () => void;
		const fetch = vi.fn(async (input: unknown, init: RequestInit = {}) => {
			if (String(input).includes('tenant_access_token')) {
				await new Promise<void>((resolve) => { resolveToken = resolve; });
				init.signal?.throwIfAborted();
				return Response.json({ code: 0, tenant_access_token: TOKEN, expire: 7200 });
			}
			return ok({ items: [] });
		});
		const client = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch });
		const aborted = new AbortController();
		const first = client.listChats({}, { signal: aborted.signal });
		const second = client.listChats();
		const third = client.listChats();
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		aborted.abort(new Error('cancelled'));
		await expect(first).rejects.toThrow('cancelled');
		resolveToken();
		await expect(second).resolves.toMatchObject({ items: [] });
		await expect(third).resolves.toMatchObject({ items: [] });
		expect(fetch.mock.calls.filter(([url]) => String(url).includes('tenant_access_token'))).toHaveLength(1);
	});

	it.each([99991661, 99991663, 99991668])('drops the cached token on code %i and retries exactly once', async (code) => {
		let tokenIndex = 0;
		let apiCalls = 0;
		const fetch = vi.fn(async (input: unknown, init: RequestInit = {}) => {
			if (String(input).includes('tenant_access_token')) {
				tokenIndex++;
				return Response.json({ code: 0, tenant_access_token: `t-fixture-token-${tokenIndex}`, expire: 7200 });
			}
			apiCalls++;
			const auth = new Headers(init.headers).get('authorization');
			return auth === 'Bearer t-fixture-token-1' ? Response.json({ code, msg: 'token invalid' }, { status: 400 }) : ok({ items: [] });
		});
		const client = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch });
		await expect(client.listChats()).resolves.toMatchObject({ items: [] });
		expect(tokenIndex).toBe(2);
		expect(apiCalls).toBe(2);
		// Persistently invalid: a single retry, then the error surfaces.
		const always = vi.fn(async (input: unknown) => String(input).includes('tenant_access_token')
			? Response.json({ code: 0, tenant_access_token: TOKEN, expire: 7200 })
			: Response.json({ code, msg: 'token invalid' }, { status: 400 }));
		const stuck = new FeishuOpenApiClient({ appId: 'cli_fixture', appSecret: APP_SECRET, fetch: always });
		await expect(stuck.listChats()).rejects.toMatchObject({ code });
		expect(always).toHaveBeenCalledTimes(4);
	});

	it('carries a validated log_id in the error message', async () => {
		const { client } = fixture({
			'GET im/v1/chats': () => Response.json({ code: 1, msg: 'bad', error: { log_id: 'log_fixture_2' } }, { status: 400 }),
		});
		await expect(client.listChats()).rejects.toThrow('log_id=log_fixture_2');
	});

	it('returns a successful application/json resource as bytes unless it is a Feishu error envelope', async () => {
		const payload = JSON.stringify({ hello: 'world', code: 0 });
		const { client } = fixture({
			'GET im/v1/messages/om_1/resources/file_json': () => new Response(payload, { headers: { 'content-type': 'application/json' } }),
			'GET im/v1/messages/om_1/resources/file_err': () => Response.json({ code: 234003, msg: 'File not in msg.' }),
		});
		const resource = await client.getMessageResource({ messageId: 'om_1', fileKey: 'file_json', type: 'file' });
		expect(new TextDecoder().decode(resource.data)).toBe(payload);
		expect(resource.contentType).toBe('application/json');
		await expect(client.getMessageResource({ messageId: 'om_1', fileKey: 'file_err', type: 'file' }))
			.rejects.toMatchObject({ code: 234003 });
	});

	it('sends a text message and returns the full envelope', async () => {
		const { client, fetch } = fixture({
			'POST im/v1/messages': () => Response.json({ code: 0, msg: 'success', data: { message_id: 'om_1' } }),
		});
		await expect(client.sendMessage({ receiveId: 'oc_1', receiveIdType: 'chat_id', msgType: 'text', content: '{"text":"hi"}' }))
			.resolves.toEqual({ code: 0, msg: 'success', data: { message_id: 'om_1' } });
		const [url, init] = fetch.mock.calls[1]!;
		expect(new URL(String(url)).searchParams.get('receive_id_type')).toBe('chat_id');
		expect(JSON.parse(String(init?.body))).toEqual({ receive_id: 'oc_1', msg_type: 'text', content: '{"text":"hi"}' });
	});

	it('passes generic requests through and keeps the token on the API origin', async () => {
		const { client, fetch } = fixture({
			'PATCH im/v1/messages': (_url, init) => Response.json({ code: 0, data: { echo: JSON.parse(String(init.body)) } }),
			'GET im/v1/text': () => new Response('plain', { headers: { 'content-type': 'text/plain' } }),
			'GET im/v1/fail': () => Response.json({ code: 230001, msg: 'bad' }),
		});
		await expect(client.request({ path: 'im/v1/messages', method: 'patch', body: { a: 1 }, query: { page_size: 10 } }))
			.resolves.toEqual({ code: 0, data: { echo: { a: 1 } } });
		expect(new URL(String(fetch.mock.calls[1]![0])).searchParams.get('page_size')).toBe('10');
		await expect(client.request({ path: 'im/v1/text' })).resolves.toBe('plain');
		await client.request({ path: '/open-apis/im/v1/text', query: { ids: ['a', 'b'] } });
		expect(new URL(String(fetch.mock.calls.at(-1)![0])).searchParams.getAll('ids')).toEqual(['a', 'b']);
		await expect(client.request({ path: 'im/v1/fail' })).rejects.toMatchObject({ code: 230001 });
		const calls = fetch.mock.calls.length;
		for (const path of ['https://evil.example/x', '//evil.example/x', '../../other']) {
			await expect(client.request({ path })).rejects.toThrow('relative to the API base URL');
		}
		expect(fetch).toHaveBeenCalledTimes(calls);
	});

	it('distinguishes an empty JSON body from an unparsable one on generic requests', async () => {
		const json = (text: string) => () => new Response(text, { status: 200, headers: { 'content-type': 'application/json' } });
		const { client } = fixture({ 'GET im/v1/empty': json(''), 'GET im/v1/broken': json('{"code":0,') });
		await expect(client.request({ path: 'im/v1/empty' })).resolves.toBeUndefined();
		await expect(client.request({ path: 'im/v1/broken' })).rejects.toThrow('Feishu OpenAPI returned invalid JSON (HTTP 200)');
	});

	it('rejects empty path identifiers before any request', async () => {
		const { client, fetch } = fixture({});
		await expect(client.getChat({ chatId: ' ' })).rejects.toThrow('chat_id is required');
		await expect(client.listMessages({ containerId: '' })).rejects.toThrow('container_id is required');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('parses only a safe base name from Content-Disposition', () => {
		expect(parseContentDispositionFilename("attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf")).toBe('报告.pdf');
		expect(parseContentDispositionFilename('attachment; filename="..\\..\\evil.sh"')).toBe('evil.sh');
		expect(parseContentDispositionFilename('attachment; filename=".."')).toBeUndefined();
		expect(parseContentDispositionFilename(null)).toBeUndefined();
	});
});
