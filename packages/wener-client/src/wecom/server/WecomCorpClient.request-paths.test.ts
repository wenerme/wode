import { expect, test } from 'vitest';
import { WecomCorpClient } from './WecomCorpClient';

type FetchCall = {
	url: string;
	init?: RequestInit;
};

function createClientAndCalls() {
	const calls: FetchCall[] = [];
	const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
		calls.push({ url, init });
		return new Response(JSON.stringify({ errcode: 0, errmsg: 'ok' }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
	};

	const client = new WecomCorpClient({
		corpId: 'corp-id',
		corpSecret: 'corp-secret',
		accessToken: { value: 'token', expiresAt: Date.now() + 3_600_000 },
		fetch,
	});

	return { client, calls };
}

test('batchDeleteUser should call /cgi-bin/user/batchdelete', async () => {
	const { client, calls } = createClientAndCalls();
	await client.batchDeleteUser({ useridlist: ['u1'] });
	const u = new URL(calls[0].url);
	expect(u.pathname).toBe('/cgi-bin/user/batchdelete');
});

test('getDepartment should call /cgi-bin/department/get', async () => {
	const { client, calls } = createClientAndCalls();
	await client.getDepartment({ id: 1 });
	const u = new URL(calls[0].url);
	expect(u.pathname).toBe('/cgi-bin/department/get');
	expect(u.searchParams.get('id')).toBe('1');
});

test('deleteTag should call /cgi-bin/tag/delete', async () => {
	const { client, calls } = createClientAndCalls();
	await client.deleteTag({ tagid: 1 });
	const u = new URL(calls[0].url);
	expect(u.pathname).toBe('/cgi-bin/tag/delete');
	expect(u.searchParams.get('tagid')).toBe('1');
});

test('setAgent should call /cgi-bin/agent/set', async () => {
	const { client, calls } = createClientAndCalls();
	await client.setAgent({ agentid: 100001 } as any);
	const u = new URL(calls[0].url);
	expect(u.pathname).toBe('/cgi-bin/agent/set');
});
