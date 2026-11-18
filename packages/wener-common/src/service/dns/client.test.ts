import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../runtime/types';
import { createDnsServiceToolClient } from './client';

const tools = {
	listZone: { inputSchema: {}, annotations: { readOnlyHint: true } },
	listRecord: { inputSchema: {}, annotations: { readOnlyHint: true } },
	setRecord: { inputSchema: {}, annotations: { readOnlyHint: false, destructiveHint: true, supportsDryRun: true } },
	deleteZone: { inputSchema: {}, annotations: { readOnlyHint: false, destructiveHint: true, supportsDryRun: true } },
};
function runtime(call: (...args: Parameters<ServiceRuntimeClient['call']>) => unknown) {
	return { getSchema: vi.fn(async () => ({ tools })), call: vi.fn(call) } as unknown as ServiceRuntimeClient & { call: ReturnType<typeof vi.fn> };
}
const rrset = { zone: 'example.com', name: 'www', type: 'A', ttl: 60, values: ['192.0.2.1'] };

describe('createDnsServiceToolClient', () => {
	it('allows reads and refuses writes on a read-only client before dispatch', async () => {
		const transport = runtime(async () => ({ zones: [] }));
		const service = await createDnsServiceToolClient(transport, 'dns', { provider: 'powerdns' });
		expect(service).toMatchObject({ type: 'dns', provider: 'powerdns', readOnly: true });
		await service.listZone();
		await expect(service.setRecord(rrset)).rejects.toThrow('read-only');
		await expect(service.deleteZone({ zone: 'example.com' })).rejects.toThrow('read-only');
		expect(transport.call).toHaveBeenCalledTimes(1);
		await service.close();
	});

	it('lets dryRun bypass the read-only gate', async () => {
		const preview = { ok: true, dryRun: true, rrset: { name: 'www.example.com.', type: 'A', ttl: 60, values: ['192.0.2.1'] } };
		const transport = runtime(async () => preview);
		const service = await createDnsServiceToolClient(transport, 'dns');
		await expect(service.setRecord({ ...rrset, dryRun: true })).resolves.toEqual(preview);
		expect(transport.call.mock.calls[0]![0]).toMatchObject({ body: { toolName: 'setRecord', input: { dryRun: true } } });
		await service.close();
	});

	it('allows writes when readOnly is false', async () => {
		const transport = runtime(async () => ({ ok: true }));
		const service = await createDnsServiceToolClient(transport, 'dns', { readOnly: false });
		await expect(service.deleteZone({ zone: 'example.com' })).resolves.toEqual({ ok: true });
		await service.close();
	});

	it('validates input and output against the contract', async () => {
		const transport = runtime(async () => ({ rrsets: [{ name: 'www.example.com.' }] }));
		const service = await createDnsServiceToolClient(transport, 'dns');
		await expect(service.listRecord({ zone: 'example.com' })).rejects.toThrow('Invalid DNS response');
		await expect(service.listRecord({ zone: '..' })).rejects.toThrow('Invalid DNS input');
		expect(transport.call).toHaveBeenCalledTimes(1);
		await service.close();
	});

	it('enforces timeout and aborts on close', async () => {
		const transport = runtime(() => new Promise(() => undefined));
		const service = await createDnsServiceToolClient(transport, 'dns');
		await expect(service.listZone(undefined, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		const pending = service.listZone();
		await service.close();
		await expect(pending).rejects.toThrow('closed');
		await expect(service.listZone()).rejects.toThrow('closed');
	});

	it('cleans up after a synchronous runtime.call throw', async () => {
		const transport = runtime(() => {
			throw new Error('sync transport failure');
		});
		const service = await createDnsServiceToolClient(transport, 'dns');
		await expect(service.listZone(undefined, { context: { timeoutMs: 50 } })).rejects.toThrow('sync transport failure');
		await expect(Promise.race([service.close().then(() => 'closed'), new Promise((resolve) => setTimeout(() => resolve('hung'), 100))])).resolves.toBe('closed');
	});
});
