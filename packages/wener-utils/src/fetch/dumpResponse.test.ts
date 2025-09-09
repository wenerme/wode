import { describe, expect, it, vi } from 'vitest';
import { dumpResponse } from './dumpResponse';

describe('dumpResponse', () => {
	const NETWORK_TIMEOUT = 15000;

	it(
		'should dump JSON response with all parameters',
		async () => {
			const logSpy = vi.fn();

			const response = await fetch('https://httpbin.org/json');
			const result = await dumpResponse({
				res: response,
				url: 'https://httpbin.org/json',
				method: 'GET',
				log: logSpy,
				dumpBody: true,
			});

			expect(logSpy).toHaveBeenCalledOnce();
			const loggedOutput = logSpy.mock.calls[0][0];

			// Check basic format
			expect(loggedOutput).toContain('<- 200 OK GET https://httpbin.org/json');
			expect(loggedOutput).toContain('content-type: application/json');
			expect(loggedOutput).toContain('slideshow');

			// Should return original response
			expect(result).toBe(response);
		},
		NETWORK_TIMEOUT,
	);

	it(
		'should work with minimal parameters',
		async () => {
			const logSpy = vi.fn();

			const response = await fetch('https://httpbin.org/status/204');
			await dumpResponse({
				res: response,
				log: logSpy,
			});

			const loggedOutput = logSpy.mock.calls[0][0];

			// Should only show status without method/url (HTTPBin uses uppercase)
			expect(loggedOutput).toContain('<- 204');
			expect(loggedOutput).not.toContain('GET');
			expect(loggedOutput).not.toContain('https://');
		},
		NETWORK_TIMEOUT,
	);

	it('should handle binary content', async () => {
		const logSpy = vi.fn();

		// Create a mock response with binary content
		const response = new Response(new Uint8Array([1, 2, 3]), {
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'application/octet-stream' },
		});

		await dumpResponse({
			res: response,
			url: 'https://example.com/binary',
			method: 'GET',
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('<- 200 OK GET https://example.com/binary');
		expect(loggedOutput).toContain('[Binary content not displayed: application/octet-stream]');
	});

	it(
		'should preserve original response after dumping',
		async () => {
			const response = await fetch('https://httpbin.org/json');

			const result = await dumpResponse({
				res: response,
				dumpBody: true,
			});

			// Original response should still be readable
			const data = await result.json();
			expect(data.slideshow).toBeDefined();
		},
		NETWORK_TIMEOUT,
	);

	it('should handle dumpBody false with mock response', async () => {
		const logSpy = vi.fn();

		const response = new Response('{"test": true}', {
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'application/json' },
		});

		await dumpResponse({
			res: response,
			url: 'https://example.com/test',
			method: 'POST',
			log: logSpy,
			dumpBody: false,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		// Should not contain body content
		expect(loggedOutput).toContain('<- 200 OK POST https://example.com/test');
		expect(loggedOutput).toContain('content-type: application/json');
		expect(loggedOutput).not.toContain('{"test": true}');
	});

	it('should handle req.method fallback', async () => {
		const logSpy = vi.fn();

		const response = new Response('success', {
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'text/plain' },
		});

		await dumpResponse({
			res: response,
			req: { method: 'PUT' },
			url: 'https://example.com/test',
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];
		expect(loggedOutput).toContain('<- 200 OK PUT https://example.com/test');
	});

	it('should handle method parameter override', async () => {
		const logSpy = vi.fn();

		const response = new Response('success', {
			status: 201,
			statusText: 'Created',
		});

		await dumpResponse({
			res: response,
			req: { method: 'POST' },
			method: 'PATCH', // should override req.method
			url: 'https://example.com/test',
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];
		expect(loggedOutput).toContain('<- 201 Created PATCH https://example.com/test');
	});
});
