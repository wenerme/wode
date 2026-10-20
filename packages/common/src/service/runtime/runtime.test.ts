import { describe, expect, it, vi } from 'vitest';
import { parseCliConfig, resolveCliContext } from '../../context';
import { createHttpServiceRuntimeClient } from './createHttpServiceRuntimeClient';
import { createServiceRuntime, ServiceProviderRegistry } from './createServiceRuntime';
import { createRemoteServiceToolClient } from './createServiceToolClient';
import type { ServiceRuntimeClient } from './types';

describe('service runtime', () => {
	it.each(['schema', 'call'])('redacts malformed successful %s responses', async (operation) => {
		const runtime = createHttpServiceRuntimeClient({
			baseUrl: 'https://example.com/api',
			fetch: vi.fn(async () => new Response('SECRET42')),
		});
		const result =
			operation === 'schema'
				? runtime.getSchema({ params: { service: 'demo' } })
				: runtime.call({ params: { service: 'demo' }, body: { toolName: 'echo', input: null } });
		await expect(result).rejects.toThrow(/^Invalid service JSON response$/);
	});
	it('preserves cancellation during response parsing', async () => {
		const controller = new AbortController();
		const reason = new Error('cancelled');
		const response = new Response();
		vi.spyOn(response, 'json').mockImplementation(async () => {
			controller.abort(reason);
			throw reason;
		});
		const runtime = createHttpServiceRuntimeClient({
			baseUrl: 'https://example.com/api',
			fetch: vi.fn(async () => response),
		});
		await expect(runtime.getSchema({ params: { service: 'demo' } }, { signal: controller.signal })).rejects.toBe(
			reason,
		);
	});
	it('creates clients lazily, gates writes, reuses clients and closes exactly once', async () => {
		const call = vi.fn(async () => ({ ok: true }));
		const close = vi.fn();
		const create = vi.fn(() => ({
			call,
			close,
			getSchema: async () => ({
				tools: {
					read: { inputSchema: {}, annotations: { readOnlyHint: true } },
					write: { inputSchema: {} },
				},
			}),
		}));
		const providers = new ServiceProviderRegistry([{ name: 'test', create }]);
		const runtime = createServiceRuntime({
			providers,
			context: resolveCliContext(parseCliConfig({ services: { example: { provider: 'test' } } })),
		});
		expect(create).not.toHaveBeenCalled();
		await runtime.call({ params: { service: 'example' }, body: { toolName: 'read', input: {} } });
		await expect(
			runtime.call({ params: { service: 'example' }, body: { toolName: 'write', input: {} } }),
		).rejects.toThrow('read-only');
		await expect(
			runtime.call({ params: { service: 'example' }, body: { toolName: 'toString', input: {} } }),
		).rejects.toThrow('Unknown service operation');
		expect(create).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledTimes(1);
		await runtime.close();
		await runtime.close();
		expect(close).toHaveBeenCalledTimes(1);
		await expect(runtime.getSchema({ params: { service: 'example' } })).rejects.toThrow('closed');
	});
	it('keeps explicit null inputs and propagates cancellation to typed clients', async () => {
		const call = vi.fn<ServiceRuntimeClient['call']>(async () => null);
		const runtime: ServiceRuntimeClient = { getSchema: async () => ({ tools: { read: { inputSchema: {} } } }), call };
		const controller = new AbortController();
		const client = await createRemoteServiceToolClient<{ read(input: unknown): Promise<unknown> }>(runtime, 's', {
			signal: controller.signal,
		});
		await client.read(null);
		expect(call.mock.calls[0]?.[0].body.input).toBeNull();
		controller.abort();
		await expect(client.read({})).rejects.toThrow();
		expect(call).toHaveBeenCalledTimes(1);
	});
	it('uses the same HTTP schema/call paths and never returns an HTTP error body as output', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(
				Response.json({ tools: { echo: { inputSchema: {}, annotations: { readOnlyHint: true } } } }),
			)
			.mockResolvedValueOnce(Response.json({ text: 'ok' }))
			.mockResolvedValueOnce(new Response('private upstream error', { status: 403 }));
		const runtime = createHttpServiceRuntimeClient({
			baseUrl: 'https://example.com/api',
			fetch,
			headers: { authorization: 'Bearer test' },
		});
		await runtime.getSchema({ params: { service: 'demo/id' } });
		expect(String(fetch.mock.calls[0]?.[0])).toBe('https://example.com/api/service/demo%2Fid/schema');
		await expect(
			runtime.call({ params: { service: 'demo/id' }, body: { toolName: 'echo', input: null } }),
		).resolves.toEqual({ text: 'ok' });
		expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body))).toEqual({ toolName: 'echo', input: null });
		await expect(runtime.getSchema({ params: { service: 'demo' } })).rejects.toThrow('HTTP 403');
		expect(() => createHttpServiceRuntimeClient({ baseUrl: 'file:///tmp/config' })).toThrow('HTTP');
		await expect(runtime.getSchema({ params: { service: '..' } })).rejects.toThrow('Invalid service');
	});
});
