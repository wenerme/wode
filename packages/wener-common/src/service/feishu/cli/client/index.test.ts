import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../../../runtime/types';
import { FeishuOperations } from '../../operations';
import { createFeishuServiceToolClient } from './index';

function fixture() {
	const runtime = {
		getSchema: vi.fn(async () => ({ tools: Object.fromEntries(Object.entries(FeishuOperations).map(([name, operation]) => [name, operation.tool])) })),
		call: vi.fn<ServiceRuntimeClient['call']>(async () => ({ code: 0, data: { message_id: 'om_fixture', future: { card: [null, 1] } } })),
	};
	return { runtime };
}

describe('Feishu remote contract client', () => {
	it('forwards individual signals and retains dynamic output fields', async () => {
		const { runtime } = fixture();
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		const controller = new AbortController();
		const result = await client.sendMessage({ to: 'oc_fixture', text: 'hello' }, { signal: controller.signal });
		expect(result.data?.future).toEqual({ card: [null, 1] });
		expect(runtime.call).toHaveBeenCalledWith({ params: { service: 'fixture' }, body: { toolName: 'sendMessage', input: { to: 'oc_fixture', text: 'hello' } } }, { signal: expect.any(AbortSignal) });
		controller.abort();
		expect(runtime.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await client[Symbol.asyncDispose]();
	});

	it('rejects invalid input/output, missing tools and read-only operations', async () => {
		const { runtime } = fixture();
		const readOnly = await createFeishuServiceToolClient(runtime, 'fixture');
		await expect(readOnly.request({ path: 'im/v1/messages' })).rejects.toMatchObject({ code: 'READ_ONLY' });
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		await expect(client.sendMessage({ to: '', text: 'hello' })).rejects.toThrow('Invalid Feishu service input');
		expect(runtime.call).not.toHaveBeenCalled();
		runtime.call.mockResolvedValueOnce({ code: 'wrong' });
		await expect(client.sendWebhook({ text: 'hello' })).rejects.toThrow('Invalid Feishu service response');
		runtime.getSchema.mockResolvedValueOnce({ tools: {} });
		const missing = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		await expect(missing.request({ path: 'im/v1/messages' })).rejects.toThrow('operation unavailable');
		await Promise.all([client.close(), readOnly.close(), missing.close()]);
	});

	it('rejects pre-aborted calls without dispatch and forwards raw output unchanged', async () => {
		const { runtime } = fixture();
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		await expect(client.request({ path: 'im/v1/messages' }, { signal: AbortSignal.abort(new Error('cancelled')) })).rejects.toThrow('cancelled');
		expect(runtime.call).not.toHaveBeenCalled();
		runtime.call.mockResolvedValueOnce(['arbitrary', { future: true }]);
		await expect(client.request({ path: 'im/v1/messages' })).resolves.toEqual(['arbitrary', { future: true }]);
		await client.close();
	});

	it('cancels pending calls on close, is idempotent and prevents further dispatch', async () => {
		const { runtime } = fixture();
		runtime.call.mockImplementation(() => new Promise(() => {}));
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		const pending = client.sendWebhook({ text: 'hello' });
		const rejected = expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		await vi.waitFor(() => expect(runtime.call).toHaveBeenCalledTimes(1));
		const closed = client.close();
		expect(client.close()).toBe(closed);
		await client[Symbol.asyncDispose]();
		await rejected;
		expect(runtime.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
		await expect(client.request({ path: 'im/v1/messages' })).rejects.toMatchObject({ code: 'CLOSED' });
	});

	it('bounds the remote wait with an app-operation deadline and cancels the transport', async () => {
		vi.useFakeTimers();
		try {
			const { runtime } = fixture();
			runtime.call.mockImplementation(() => new Promise(() => {}));
			const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
			const pending = client.request({ path: 'im/v1/messages' }, { context: { timeoutMs: 20 } });
			const rejected = expect(pending).rejects.toThrow('timed out');
			await vi.advanceTimersByTimeAsync(20);
			await rejected;
			expect(runtime.call.mock.calls[0]![1]?.signal?.aborted).toBe(true);
			await expect(client.sendWebhook({ text: 'hi' }, { context: { timeoutMs: 20 } })).rejects.toMatchObject({ code: 'INVALID_CONFIG' });
			await expect(client.request({ path: 'im/v1/messages' }, { context: { timeoutMs: -1 } })).rejects.toMatchObject({ code: 'INVALID_CONFIG' });
			await client.close();
		} finally { vi.useRealTimers(); }
	});
});

describe('Feishu remote client: IM/contact and binary projection', () => {
	it('allows read operations on a read-only client and rejects writes before dispatch', async () => {
		const { runtime } = fixture();
		runtime.call.mockResolvedValueOnce({ items: [{ chat_id: 'oc_1', future: 1 }], hasMore: false });
		const client = await createFeishuServiceToolClient(runtime, 'fixture');
		await expect(client.listChat()).resolves.toEqual({ items: [{ chat_id: 'oc_1', future: 1 }], hasMore: false });
		expect(runtime.call).toHaveBeenLastCalledWith({ params: { service: 'fixture' }, body: { toolName: 'listChat', input: {} } }, { signal: expect.any(AbortSignal) });
		await expect(client.deleteMessage({ messageId: 'om_1' })).rejects.toMatchObject({ code: 'READ_ONLY' });
		await expect(client.uploadImage({ image: new Uint8Array([1]) })).rejects.toMatchObject({ code: 'READ_ONLY' });
		expect(runtime.call).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('encodes uploads to the bounded Base64 wire input', async () => {
		const { runtime } = fixture();
		runtime.call.mockResolvedValueOnce({ fileKey: 'file_1' });
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		await expect(client.uploadFile({ file: new Uint8Array([1, 2, 3]), fileType: 'pdf', fileName: 'a.pdf' })).resolves.toEqual({ fileKey: 'file_1' });
		expect(runtime.call.mock.calls[0]![0].body).toEqual({
			toolName: 'uploadFile', input: { fileBase64: 'AQID', byteLength: 3, fileType: 'pdf', fileName: 'a.pdf' },
		});
		await expect(client.uploadImage({ image: new Uint8Array() })).rejects.toThrow('Invalid Feishu service input');
		expect(runtime.call).toHaveBeenCalledTimes(1);
		await client.close();
	});

	it('decodes downloads to native bytes and rejects inconsistent wire output', async () => {
		const { runtime } = fixture();
		runtime.call.mockResolvedValueOnce({ contentBase64: 'AQID', byteLength: 3, contentType: 'image/png' });
		const client = await createFeishuServiceToolClient(runtime, 'fixture');
		await expect(client.downloadMessageResource({ messageId: 'om_1', fileKey: 'f', type: 'image' }))
			.resolves.toEqual({ data: new Uint8Array([1, 2, 3]), contentType: 'image/png' });
		runtime.call.mockResolvedValueOnce({ contentBase64: 'AQID', byteLength: 2 });
		await expect(client.downloadMessageResource({ messageId: 'om_1', fileKey: 'f', type: 'image' })).rejects.toThrow('Invalid Feishu service response');
		runtime.call.mockResolvedValueOnce({ items: 'not a list', hasMore: false });
		await expect(client.listMessage({ chatId: 'oc_1' })).rejects.toThrow('Invalid Feishu service response');
		await client.close();
	});
});
