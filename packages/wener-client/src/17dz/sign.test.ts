import { ArrayBuffers } from '@wener/utils';
import { assert, test } from 'vitest';
import { sign } from './sign';

test('sign', async () => {
	if (!globalThis.crypto) {
		(globalThis as any).crypto = await import('node:crypto').then((v) => v.webcrypto);
	}

	// Synthetic credentials for this offline signing fixture.
	const params = {
		appKey: 'test-app-key',
		appSecret: 'test-app-secret',
		timestamp: 1_544_252_223_384,
		version: '1.0.0',
		xReqNonce: '97972162d1b14076b19ff75a9ba431d9',
	};
	const encoded = encodeURIComponent(
		Object.entries(params)
			.sort(([a], [b]) => a.localeCompare(b))
			.map((a) => a[1])
			.join(''),
	);
	assert.equal(encoded, 'test-app-keytest-app-secret15442522233841.0.097972162d1b14076b19ff75a9ba431d9');

	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(params.appSecret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const encrypted = ArrayBuffers.toString(
		await crypto.subtle.sign('hmac', key, new TextEncoder().encode(encoded)),
		'base64',
	);
	assert.equal(encrypted, 'Y9tGQN5T/rv/zQfaDrbl8bx4D54GY+RdXuKlKTKxXDM=');
	assert.equal((await sign(params)).signature, 'Y9tGQN5T/rv/zQfaDrbl8bx4D54GY+RdXuKlKTKxXDM=');
});
