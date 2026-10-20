import { constants, generateKeyPairSync, publicEncrypt } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { request, stringOfMultipartFormData } from '../alicloud/request';
import { PKCS7 } from '../wechat/webhook/PKCS7';
import { decryptRandomKey } from '../wecom/archive/server/decryptRandomKey';
import { ping } from '../yzf/token';

test.each(['buffer', 'shared-data-view', 'uint16-view'])('request copies only the bytes of %s', async (kind) => {
	const backing = kind === 'shared-data-view' ? new SharedArrayBuffer(8) : new ArrayBuffer(8);
	new Uint8Array(backing).set([99, 98, 1, 2, 3, 4, 97, 96]);
	const body =
		kind === 'buffer'
			? Buffer.from(backing, 2, 4)
			: kind === 'shared-data-view'
				? new DataView(backing, 2, 4)
				: new Uint16Array(backing, 2, 2);
	const sign = vi.fn(async (init: RequestInit) => {
		expect(init.body).toBeInstanceOf(Uint8Array);
		if (!(init.body instanceof Uint8Array)) throw new Error('Expected copied bytes');
		expect(init.body.buffer).toBeInstanceOf(ArrayBuffer);
		expect(init.body.buffer).not.toBe(backing);
		expect([...init.body]).toEqual([1, 2, 3, 4]);
		return { headers: { 'content-type': 'application/octet-stream' } };
	});
	const fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
		expect(init?.body).toBe(sign.mock.calls[0]?.[0].body);
		return Response.json({ RequestId: 'local', Success: true, Data: 'ok' });
	});
	expect(await request({ url: 'https://example.invalid', body, sign, fetch })).toBe('ok');
	expect(sign).toHaveBeenCalledOnce();
	expect(fetch).toHaveBeenCalledOnce();
});

test.each(['text/plain', 'application/json'])(
	'request rejects primitive %s responses without an in-operator error',
	async (contentType) => {
		const fetch = vi.fn(async () => new Response('123', { headers: { 'content-type': contentType } }));
		await expect(
			request({ url: 'https://example.invalid', sign: async () => ({ headers: {} }), fetch }),
		).rejects.toThrow('Invalid response:');
	},
);

test('multipart binary serialization keeps the view bounds', () => {
	const backing = new SharedArrayBuffer(6);
	new Uint8Array(backing).set([99, 1, 2, 3, 4, 98]);
	const data = new FormData();
	vi.spyOn(data, 'entries').mockImplementation(() => {
		// FormData normally coerces views; exercise the existing binary branch directly.
		const entries = new FormData().entries();
		const binaryEntry = {
			done: false,
			value: ['file', new DataView(backing, 1, 4)],
		} as unknown as ReturnType<typeof entries.next>;
		vi.spyOn(entries, 'next').mockReturnValueOnce(binaryEntry);
		return entries;
	});
	expect(stringOfMultipartFormData(data).body).toContain('\r\n\r\nAQIDBA==\r\n');
});

test('PKCS7 pads a shared subview without including surrounding bytes', () => {
	const backing = new SharedArrayBuffer(5);
	new Uint8Array(backing).set([99, 1, 2, 3, 98]);
	const padded = new Uint8Array(PKCS7.pad(new Uint8Array(backing, 1, 3), 8));
	expect(padded.buffer).toBeInstanceOf(ArrayBuffer);
	expect([...padded]).toEqual([1, 2, 3, 5, 5, 5, 5, 5]);
	expect([...PKCS7.trim(padded)]).toEqual([1, 2, 3]);
});

test.each(['access_token=next%2Btoken; Path=/; HttpOnly', 'other=value; Path=/', undefined])(
	'ping preserves cookie token reading for %s',
	async (cookie) => {
		const fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
			expect(new Headers(init?.headers).get('cookie')).toBe('refresh_token=refresh; access_token=old');
			return Response.json({ code: '0', result: 0 }, { headers: cookie ? { 'set-cookie': cookie } : {} });
		});
		expect(await ping({ refresh_token: 'refresh', access_token: 'old', fetch })).toBe(
			cookie?.startsWith('access_token=') ? 'next+token' : undefined,
		);
		expect(fetch).toHaveBeenCalledOnce();
	},
);

test('archive RSA decryption returns a Buffer for base64 and Buffer inputs', () => {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
		modulusLength: 1024,
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
	});
	const plaintext = Buffer.from('local-archive-key');
	const ciphertext = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, plaintext);
	for (const randomKey of [ciphertext, ciphertext.toString('base64')]) {
		const decrypted = decryptRandomKey({ privateKey, randomKey, native: false });
		expect(Buffer.isBuffer(decrypted)).toBe(true);
		expect(decrypted.equals(plaintext)).toBe(true);
	}
});
