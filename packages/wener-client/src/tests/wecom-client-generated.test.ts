import { describe, expect, test } from 'vitest';
import { WecomCorpClient } from '../wecom/server/WecomCorpClient';

function createMockClient() {
	const calls: { url: string; init?: RequestInit }[] = [];
	const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
		calls.push({ url, init });
		return new Response(JSON.stringify({ errcode: 0, errmsg: 'ok' }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
	};
	return {
		client: new WecomCorpClient({
			corpId: 'test-corp',
			corpSecret: 'test-secret',
			accessToken: { value: 'test-token', expiresAt: Date.now() + 3_600_000 },
			fetch,
		}),
		calls,
	};
}

function last(calls: { url: string; init?: RequestInit }[]) {
	const c = calls[calls.length - 1];
	const u = new URL(c.url);
	return { pathname: u.pathname, params: u.searchParams, init: c.init };
}

describe('WecomCorpClient', () => {
	test('hand-written methods work', async () => {
		const { client, calls } = createMockClient();
		await client.getUser({ userid: 'test' });
		expect(last(calls).pathname).toBe('/cgi-bin/user/get');
		expect(last(calls).params.get('access_token')).toBe('test-token');
	});

	test('default access_token injection', async () => {
		const { client, calls } = createMockClient();
		// Generated method — no explicit access_token in method body
		await (client as any).addCheckinOption({ group: {} });
		expect(last(calls).params.get('access_token')).toBe('test-token');
	});

	test('generated POST sends body', async () => {
		const { client, calls } = createMockClient();
		await (client as any).addCheckinOption({ effective_now: true, group: {} });
		expect(last(calls).pathname).toBe('/cgi-bin/checkin/add_checkin_option');
		expect(last(calls).init?.method).toBe('POST');
		expect(JSON.parse(last(calls).init?.body as string).effective_now).toBe(true);
	});

	test('generated GET passes params', async () => {
		const { client, calls } = createMockClient();
		await (client as any).listDepartment({ id: '1' });
		expect(last(calls).pathname).toBe('/cgi-bin/department/list');
	});

	test('total methods > 400', () => {
		const { client } = createMockClient();
		const count = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(
			(k) => k !== 'constructor' && typeof (client as any)[k] === 'function',
		).length;
		expect(count).toBeGreaterThan(400);
	});

	test('hand-written not overridden', async () => {
		const { client, calls } = createMockClient();
		await client.deleteUser({ userid: 'x' });
		expect(last(calls).pathname).toBe('/cgi-bin/user/delete');
		await client.getTags();
		expect(last(calls).pathname).toBe('/cgi-bin/tag/list');
	});

	test('category APIs exist', () => {
		const { client } = createMockClient();
		for (const m of ['createMeeting', 'createDoc', 'sendExmail', 'addKfAccount', 'submitApprovalEvent']) {
			expect(typeof (client as any)[m], m).toBe('function');
		}
	});

	test('opts passthrough works', async () => {
		const { client, calls } = createMockClient();
		// opts should merge into request options
		await (client as any).addCheckinOption({ group: {} }, { params: { custom: 'val' } });
		expect(last(calls).params.get('custom')).toBe('val');
	});
});
