import { z } from 'zod';
import type { ServiceRuntimeClient } from './types';

const schema = z.object({
	service: z
		.object({
			id: z.string().optional(),
			name: z.string().optional(),
			provider: z.string().optional(),
			readOnly: z.boolean().optional(),
		})
		.optional(),
	tools: z.record(
		z.string(),
		z.object({
			title: z.string().optional(),
			description: z.string().optional(),
			inputSchema: z.record(z.string(), z.unknown()),
			outputSchema: z.record(z.string(), z.unknown()).optional(),
			annotations: z
				.object({ readOnlyHint: z.boolean().optional(), destructiveHint: z.boolean().optional() })
				.optional(),
		}),
	),
});

export function createHttpServiceRuntimeClient(options: {
	baseUrl: string;
	fetch?: typeof globalThis.fetch;
	headers?: HeadersInit;
}): ServiceRuntimeClient {
	const baseUrl = new URL(options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`);
	if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('Service URL must use HTTP or HTTPS');
	if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash)
		throw new Error('Service URL must not contain credentials, query or fragment; use headers for authentication');
	const fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
	const headers = new Headers(options.headers);
	headers.set('accept', 'application/json');
	async function request(service: string, operation: string, input: unknown, signal?: AbortSignal) {
		signal?.throwIfAborted();
		if (!service || service === '.' || service === '..') throw new Error('Invalid service selector');
		const requestHeaders = new Headers(headers);
		if (input !== undefined) requestHeaders.set('content-type', 'application/json');
		const response = await fetch(new URL(`service/${encodeURIComponent(service)}/${operation}`, baseUrl), {
			method: input === undefined ? 'GET' : 'POST',
			headers: requestHeaders,
			body: input === undefined ? undefined : JSON.stringify(input),
			signal,
		});
		if (!response.ok) throw new Error(`Service request failed (HTTP ${response.status})`);
		let value: unknown = null;
		if (response.status !== 204) {
			try {
				value = await response.json();
			} catch {
				signal?.throwIfAborted();
				throw new Error('Invalid service JSON response');
			}
		}
		signal?.throwIfAborted();
		return value;
	}
	return {
		async getSchema({ params }, callOptions) {
			return schema.parse(await request(params.service, 'schema', undefined, callOptions?.signal));
		},
		async call({ params, body }, callOptions) {
			return request(params.service, 'call', body, callOptions?.signal);
		},
	};
}
