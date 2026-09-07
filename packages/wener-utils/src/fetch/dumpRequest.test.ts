import { describe, expect, it, vi } from 'vite-plus/test';
import { dumpRequest } from './dumpRequest';

describe('dumpRequest', () => {
	it('should preview ReadableStream content with size limit', async () => {
		const logSpy = vi.fn();

		// Create a ReadableStream with text content
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode('{"message": "hello"}'));
				controller.close();
			},
		});

		await dumpRequest({
			url: 'https://api.example.com/test',
			req: {
				method: 'POST',
				body: stream,
				headers: { 'content-type': 'application/json' },
			},
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> POST https://api.example.com/test');
		expect(loggedOutput).toContain('{"message": "hello"}');
		expect(loggedOutput).not.toContain('[... truncated]');
	});

	it('should truncate large ReadableStream content', async () => {
		const logSpy = vi.fn();

		// Create a large stream that exceeds preview limit
		const encoder = new TextEncoder();
		const largeData = 'x'.repeat(2000); // 2KB, exceeds 1KB limit

		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode(largeData));
				controller.close();
			},
		});

		await dumpRequest({
			url: 'https://api.example.com/large',
			req: {
				method: 'POST',
				body: stream,
			},
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> POST https://api.example.com/large');
		expect(loggedOutput).toContain('[... truncated]');
		// Should contain some 'x' characters but not all 2000
		expect(loggedOutput).toContain('xxx');
		expect(loggedOutput.length).toBeLessThan(2500); // Much less than full content
	});

	it('should handle FormData correctly', async () => {
		const logSpy = vi.fn();

		const formData = new FormData();
		formData.append('username', 'john');
		formData.append('email', 'john@example.com');

		await dumpRequest({
			url: 'https://api.example.com/form',
			req: {
				method: 'POST',
				body: formData,
			},
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> POST https://api.example.com/form');
		expect(loggedOutput).toContain('[FormData content]');
		expect(loggedOutput).toContain('username: john');
		expect(loggedOutput).toContain('email: john@example.com');
	});

	it('should use optional body parameter instead of req.body to avoid tee-ing', async () => {
		const logSpy = vi.fn();

		// Create a ReadableStream that we want to preserve
		const encoder = new TextEncoder();
		const originalStream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode('{"original": "data"}'));
				controller.close();
			},
		});

		// Pass separate body to display without affecting original stream
		const displayBody = '{"display": "body"}';

		await dumpRequest({
			url: 'https://api.example.com/preserve',
			req: {
				method: 'POST',
				body: originalStream,
				headers: { 'content-type': 'application/json' },
			},
			body: displayBody, // This should be displayed instead
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> POST https://api.example.com/preserve');
		expect(loggedOutput).toContain('{"display": "body"}');
		expect(loggedOutput).not.toContain('{"original": "data"}');

		// Verify original stream is still readable (not tee'd)
		const reader = originalStream.getReader();
		const { value } = await reader.read();
		const decoded = new TextDecoder().decode(value);
		expect(decoded).toBe('{"original": "data"}');
	});

	it('should handle external ReadableStream in body parameter', async () => {
		const logSpy = vi.fn();

		// Create a ReadableStream to pass as body parameter
		const encoder = new TextEncoder();
		const externalStream = new ReadableStream({
			start(controller) {
				controller.enqueue(encoder.encode('external stream data'));
				controller.close();
			},
		});

		await dumpRequest({
			url: 'https://api.example.com/external',
			req: {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
			},
			body: externalStream,
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> POST https://api.example.com/external');
		expect(loggedOutput).toContain('[ReadableStream - cannot preview external stream]');
	});

	it('should handle string body parameter', async () => {
		const logSpy = vi.fn();

		await dumpRequest({
			url: 'https://api.example.com/string',
			req: {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
			},
			body: '{"custom": "body"}',
			method: 'PATCH', // Test method override too
			log: logSpy,
		});

		const loggedOutput = logSpy.mock.calls[0][0];

		expect(loggedOutput).toContain('-> PATCH https://api.example.com/string');
		expect(loggedOutput).toContain('{"custom": "body"}');
	});
});
