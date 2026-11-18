import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createPowerDnsServiceToolClient } from './client';

const tools = {
	listServer: { inputSchema: {}, annotations: { readOnlyHint: true } },
	request: { inputSchema: {}, annotations: { readOnlyHint: false, destructiveHint: true } },
	deleteMetadata: { inputSchema: {}, annotations: { readOnlyHint: false, destructiveHint: true } },
};

function runtime(call: (...args: Parameters<ServiceRuntimeClient['call']>) => unknown) {
	return { getSchema: vi.fn(async () => ({ tools })), call: vi.fn(call) } as unknown as ServiceRuntimeClient & { call: ReturnType<typeof vi.fn> };
}

const metadata = { zone: 'example.com', kind: 'SOA-EDIT-API' };

describe('createPowerDnsServiceToolClient', () => {
	it.each([{ path: '/servers' }, { path: '/servers', method: 'HEAD' as const }, { path: '/servers', method: 'OPTIONS' as const }])(
		'allows read-type raw request %o on a read-only client',
		async (input) => {
			const transport = runtime(async () => []);
			const service = await createPowerDnsServiceToolClient(transport, 'dns');
			await service.request(input);
			expect(transport.call).toHaveBeenCalledTimes(1);
			await service.close();
		},
	);

	it.each([
		{ path: '/servers/localhost/zones', method: 'POST' as const, body: {} },
		{ path: '/servers/localhost/zones/example.com.', method: 'DELETE' as const },
		{ path: '/servers/localhost/zones', body: { name: 'example.com.' } },
	])('refuses write-type raw request %o on a read-only client before dispatch', async (input) => {
		const transport = runtime(async () => ({}));
		const service = await createPowerDnsServiceToolClient(transport, 'dns');
		await expect(service.request(input)).rejects.toThrow('read-only');
		await expect(service.deleteMetadata(metadata)).rejects.toThrow('read-only');
		expect(transport.call).not.toHaveBeenCalled();
		await service.close();
	});

	it('allows writes when readOnly is false', async () => {
		const transport = runtime(async () => ({ ok: true }));
		const service = await createPowerDnsServiceToolClient(transport, 'dns', { readOnly: false });
		await expect(service.deleteMetadata(metadata)).resolves.toEqual({ ok: true });
		await service.close();
	});

	it('validates input and output against the contract', async () => {
		const transport = runtime(async () => ({ not: 'a list' }));
		const service = await createPowerDnsServiceToolClient(transport, 'dns');
		await expect(service.listServer()).rejects.toThrow('Invalid PowerDNS response');
		await expect(service.request({ path: '/servers/../x' })).rejects.toThrow('Invalid PowerDNS input');
		await expect(service.deleteMetadata({ zone: '..', kind: 'x' })).rejects.toThrow('Invalid PowerDNS input');
		expect(transport.call).toHaveBeenCalledTimes(1);
		await service.close();
	});

	it('enforces per-call timeout when the runtime ignores abort', async () => {
		const transport = runtime(() => new Promise(() => undefined));
		const service = await createPowerDnsServiceToolClient(transport, 'dns');
		await expect(service.listServer(undefined, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		expect(transport.call.mock.calls[0]![1]!.signal!.aborted).toBe(true);
		await service.close();
	});

	it('aborts in-flight calls on close and rejects later calls', async () => {
		const transport = runtime(() => new Promise(() => undefined));
		const service = await createPowerDnsServiceToolClient(transport, 'dns');
		const pending = service.listServer();
		await service.close();
		await expect(pending).rejects.toThrow('closed');
		await expect(service.listServer()).rejects.toThrow('closed');
		await service.close();
	});

	it('cleans up after a synchronous runtime.call throw', async () => {
		const transport = runtime(() => {
			throw new Error('sync transport failure');
		});
		const service = await createPowerDnsServiceToolClient(transport, 'dns');
		await expect(service.listServer(undefined, { context: { timeoutMs: 50 } })).rejects.toThrow('sync transport failure');
		// close must not wait on a leaked active entry
		await expect(Promise.race([service.close().then(() => 'closed'), new Promise((resolve) => setTimeout(() => resolve('hung'), 100))])).resolves.toBe('closed');
	});
});
