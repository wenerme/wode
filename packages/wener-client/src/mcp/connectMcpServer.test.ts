import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { connectMcpServer, parseHttpResponse } from './connectMcpServer';

function setFetch(fetch: FetchLike) {
	vi.stubGlobal('fetch', fetch);
}

describe('MCP HTTP response parsing', () => {
	it('keeps ordinary JSON containing data: as JSON', () => {
		const response = parseHttpResponse(
			'{"jsonrpc":"2.0","id":1,"result":{"text":"data: value"}}',
			1,
			'application/json',
		);
		expect(response.result.text).toBe('data: value');
	});

	it('groups multiline SSE data and selects the requested response', () => {
		const response = parseHttpResponse(
			': keep-alive\n\n' + 'data: {"jsonrpc":"2.0",\n' + 'data: "id":1,"result":{"ok":true}}\n\n',
			1,
			'text/event-stream',
		);
		expect(response.result.ok).toBe(true);
	});

	it('cleans up failed HTTP requests without an unhandled rejection', async () => {
		const originalFetch = globalThis.fetch;
		setFetch(async () => new Response('blocked', { status: 500 }));
		try {
			await expect(
				connectMcpServer(
					{ transport: 'http', url: 'https://example.com/mcp', enabled: true },
					new AbortController().signal,
				),
			).rejects.toThrow('MCP HTTP 500');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('returns a matching SSE response before the stream closes and times out a stalled stream', async () => {
		const encoder = new TextEncoder();
		const originalFetch = globalThis.fetch;
		setFetch(async (_input, init) => {
			const body = JSON.parse(String(init?.body));
			const result =
				body.method === 'initialize'
					? { protocolVersion: '2025-03-26', capabilities: {}, serverInfo: { name: 'fixture', version: '1' } }
					: {};
			return new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify({ jsonrpc: '2.0', id: body.id, result })}\r\n\r\n`),
						);
					},
				}),
				{ headers: { 'content-type': 'text/event-stream' } },
			);
		});
		try {
			const connection = await connectMcpServer(
				{ transport: 'http', url: 'https://example.com/mcp', enabled: true, timeout: 100 },
				new AbortController().signal,
			);
			await connection.close();
		} finally {
			globalThis.fetch = originalFetch;
		}

		setFetch(
			async () =>
				new Response(new ReadableStream({ start() {} }), {
					headers: { 'content-type': 'text/event-stream' },
				}),
		);
		try {
			await expect(
				connectMcpServer(
					{ transport: 'http', url: 'https://example.com/mcp', enabled: true, timeout: 20 },
					new AbortController().signal,
				),
			).rejects.toThrow();
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('cancels a connected stream when an SSE event is malformed', async () => {
		const originalFetch = globalThis.fetch;
		let cancelled = false;
		setFetch(
			async () =>
				new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(new TextEncoder().encode('data: invalid-json\r\n\r\n'));
						},
						cancel() {
							cancelled = true;
						},
					}),
					{ headers: { 'content-type': 'text/event-stream' } },
				),
		);
		try {
			await expect(
				connectMcpServer(
					{ transport: 'http', url: 'https://example.com/mcp', enabled: true, timeout: 100 },
					new AbortController().signal,
				),
			).rejects.toThrow();
			expect(cancelled).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
