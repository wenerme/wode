import { createHmac } from 'node:crypto';
import { expect, it } from 'vitest';
import { sign } from './request';

it('preserves the Apollo HMAC SHA-1 protocol using Web Crypto', async () => {
	const path = '/configs/sample/default/application?label=test';
	const timestamp = '1700000000000';
	const secret = 'fixture-secret-中文';
	const expected = createHmac('sha1', secret).update(`${timestamp}\n${path}`, 'utf8').digest('base64');
	expect(await sign(path, timestamp, secret)).toBe(expected);
});
