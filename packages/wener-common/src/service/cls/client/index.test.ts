import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../../runtime/types';
import { createTencentClsServiceToolClient } from './index';

function runtime(call: ServiceRuntimeClient['call']) {
	return {
		getSchema: vi.fn(async () => ({
			tools: {
				query: { inputSchema: {}, annotations: { readOnlyHint: true } },
				listTopic: { inputSchema: {}, annotations: { readOnlyHint: true } },
			},
		})),
		call: vi.fn(call),
	};
}

const queryOutput = { RequestId: 'request-1', Context: '', ListOver: true, Results: [] };
const topicOutput = { RequestId: 'request-1', TotalCount: 0, Topics: [] };

describe('createTencentClsServiceToolClient', () => {
	it('normalizes the options-only listTopic input using the contract default', async () => {
		const transport = runtime(async () => topicOutput);
		const service = await createTencentClsServiceToolClient(transport, 'logs');
		await service.listTopic();
		expect(transport.call).toHaveBeenCalledWith(
			{ params: { service: 'logs' }, body: { toolName: 'listTopic', input: {} } },
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		await service.close();
	});

	it('validates malformed remote outputs before returning them', async () => {
		const transport = runtime(async () => ({ RequestId: 'request-1', TotalCount: 0 }));
		const service = await createTencentClsServiceToolClient(transport, 'logs');
		await expect(service.listTopic()).rejects.toThrow('Invalid Tencent CLS response');
		await service.close();
	});

	it('enforces per-call timeout when runtime ignores abort', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createTencentClsServiceToolClient(pending, 'logs');
		await expect(service.listTopic(undefined, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		await service.close();
	});

	it('forwards cancellation from the native call options position', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createTencentClsServiceToolClient(pending, 'logs');
		const controller = new AbortController();
		const request = service.listTopic(undefined, { signal: controller.signal });
		controller.abort(new Error('Fixture cancellation'));
		await expect(request).rejects.toThrow('Fixture cancellation');
		expect(pending.call.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
		await service.close();
	});

	it('closes an in-flight runtime call without waiting for the transport', async () => {
		const pending = runtime(() => new Promise(() => undefined));
		const service = await createTencentClsServiceToolClient(pending, 'logs');
		const request = service.query({ topic: ['topic'], query: '*', from: 0, to: 1 });
		await service.close();
		await expect(request).rejects.toThrow('closed');
	});

	it('validates a query output envelope without imposing a dynamic log record shape', async () => {
		const transport = runtime(async () => ({ ...queryOutput, Results: [{ arbitrary: ['field'] }] }));
		const service = await createTencentClsServiceToolClient(transport, 'logs');
		expect(await service.query({ topic: ['topic'], query: '*', from: 0, to: 1 })).toEqual({
			...queryOutput,
			Results: [{ arbitrary: ['field'] }],
		});
		await service.close();
	});
});
