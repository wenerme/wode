import { describe, expect, it } from 'vitest';
import { sign } from './request';

describe('sign', () => {
	it('produces a stable TC3-HMAC-SHA256 signature for a fixed input', async () => {
		// Fixed vector; expected value captured from the original node:crypto implementation
		// (createHash/createHmac) before migrating to Web Crypto (crypto.subtle). See
		// current-state.md for how the comparison was performed.
		const { authorization, timestamp } = await sign({
			clientId: 'AKIDexampleclientid',
			clientKey: 'exampleclientsecretkeyvalue123',
			service: 'cls',
			region: 'ap-shanghai',
			action: 'SearchLog',
			version: '2020-10-16',
			timestamp: 1700000000,
			payload: JSON.stringify({ Query: '*', From: 1700000000000, To: 1700000001000, TopicId: 'abc' }),
			method: 'POST',
			host: 'cls.tencentcloudapi.com',
			uri: '/',
		});

		expect(timestamp).toBe('1700000000');
		expect(authorization).toBe(
			'TC3-HMAC-SHA256 Credential=AKIDexampleclientid/2023-11-14/cls/tc3_request, SignedHeaders=content-type;host, Signature=cde0a5d30d7969cbb5bc824429c292407e6a01f3d458a8e2456823f5f2339598',
		);
	});

	it('produces different signatures for different payloads', async () => {
		const base = {
			clientId: 'AKIDexampleclientid',
			clientKey: 'exampleclientsecretkeyvalue123',
			service: 'cls',
			region: 'ap-shanghai',
			action: 'SearchLog',
			version: '2020-10-16',
			timestamp: 1700000000,
			method: 'POST',
			host: 'cls.tencentcloudapi.com',
			uri: '/',
		};
		const a = await sign({ ...base, payload: JSON.stringify({ Query: '*' }) });
		const b = await sign({ ...base, payload: JSON.stringify({ Query: 'error' }) });
		expect(a.authorization).not.toBe(b.authorization);
	});
});
