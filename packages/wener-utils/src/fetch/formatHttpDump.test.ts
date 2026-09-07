import { describe, expect, test } from 'vite-plus/test';
import { formatHttpBody, formatHttpDump } from './formatHttpDump';

describe('formatHttpDump', () => {
	test('formats curl-like request dump', async () => {
		expect(
			await formatHttpDump({
				direction: 'request',
				method: 'POST',
				url: 'https://api.example.test/v1/chat/completions?debug=1',
				headers: { authorization: '<redacted>', 'content-type': 'application/json' },
				body: { model: 'test' },
			}),
		).toBe(
			[
				'POST /v1/chat/completions?debug=1 HTTP/1.1',
				'authorization: <redacted>',
				'content-type: application/json',
				'Host: api.example.test',
				'',
				'{',
				'  "model": "test"',
				'}',
			].join('\n'),
		);
	});

	test('formats response dump and infers direction/status text', async () => {
		expect(
			await formatHttpDump({ status: 200, headers: { 'content-type': 'application/json' }, body: { ok: true } }),
		).toBe(['HTTP/1.1 200 OK', 'content-type: application/json', '', '{', '  "ok": true', '}'].join('\n'));
	});

	test('infers request direction when no response status exists', async () => {
		expect(await formatHttpDump({ method: 'GET', url: 'https://api.example.test/v1/models' })).toBe(
			['GET /v1/models HTTP/1.1', 'Host: api.example.test', ''].join('\n'),
		);
	});

	test('accepts Headers object and HeadersInit tuples', async () => {
		expect(
			await formatHttpDump({
				method: 'POST',
				url: 'https://api.example.test/v1',
				headers: new Headers({ 'content-type': 'application/json' }),
				body: { ok: true },
			}),
		).toContain('content-type: application/json');
		expect(
			await formatHttpDump({ method: 'GET', url: 'https://api.example.test/v1', headers: [['x-test', 'yes']] }),
		).toContain('x-test: yes');
	});

	test('formats common body types', async () => {
		expect(await formatHttpBody(new URLSearchParams({ a: '1' }))).toBe('a=1');
		expect(await formatHttpBody(new Uint8Array([65, 66]), { contentType: 'text/plain' })).toBe('AB');
		expect(await formatHttpBody(new Uint8Array([1, 2]), { contentType: 'application/octet-stream' })).toBe(
			'[Binary content not displayed: 2 bytes; application/octet-stream]',
		);
	});
});
