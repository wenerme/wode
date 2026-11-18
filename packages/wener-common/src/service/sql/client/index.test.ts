import { describe, expect, it, vi } from 'vitest';
import type { ServiceRuntimeClient } from '../../runtime/types';
import { createSqlServiceToolClient } from './index';
import { SqlTools } from '../tools';

const result = { columns: ['value'], rows: [{ value: { nested: [1, null, true] } }], durationMs: 1 };
function runtime() {
	return {
		getSchema: vi.fn<ServiceRuntimeClient['getSchema']>(async () => ({ tools: SqlTools })),
		call: vi.fn<ServiceRuntimeClient['call']>(async ({ body }) => body.toolName === 'ping'
			? { ok: true, durationMs: 0 } : body.toolName === 'listObject' ? [] : result),
	};
}

describe('SQL contract tool client', () => {
	it('uses default inputs and forwards structured query values with transport-only options', async () => {
		const transport = runtime();
		const client = await createSqlServiceToolClient(transport, 'db');
		await expect(client.ping()).resolves.toEqual({ ok: true, durationMs: 0 });
		expect(transport.call).toHaveBeenLastCalledWith({ params: { service: 'db' }, body: { toolName: 'ping', input: {} } }, { signal: expect.any(AbortSignal) });
		await expect(client.listObject()).resolves.toEqual([]);
		const controller = new AbortController();
		const input = { statement: 'SELECT $1', params: [{ nested: [1, null] }], limit: 5, offset: 2 };
		await expect(client.query(input, { signal: controller.signal, context: { timeoutMs: 1000 } })).resolves.toEqual(result);
		expect(transport.call).toHaveBeenLastCalledWith({ params: { service: 'db' }, body: { toolName: 'query', input } }, { signal: expect.any(AbortSignal) });
		expect(Object.keys(transport.call.mock.calls.at(-1)![1]!)).toEqual(['signal']);
		await client.close();
	});

	it.each([0, -1, 1.5, NaN, 3_600_001])('rejects invalid context timeout %s before calling transport', async (timeoutMs) => {
		const transport = runtime();
		const client = await createSqlServiceToolClient(transport, 'db');
		await expect(client.query({ statement: 'SELECT 1' }, { context: { timeoutMs } })).rejects.toThrow('Invalid SQL timeout');
		expect(transport.call).not.toHaveBeenCalled();
	});

	it.each(['caller', 'factory', 'timeout'])('aborts transport on %s without exposing cancellation reasons', async (source) => {
		const transport = runtime();
		const factory = new AbortController();
		const caller = new AbortController();
		transport.call.mockImplementation(async (_input, options) => new Promise((_resolve, reject) => {
			options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason), { once: true });
		}));
		const client = await createSqlServiceToolClient(transport, 'db', { signal: factory.signal });
		const pending = client.query({ statement: 'SELECT 1' }, { signal: caller.signal, context: { timeoutMs: source === 'timeout' ? 10 : 1000 } });
		const rejected = expect(pending).rejects.toMatchObject(source === 'timeout'
			? { name: 'TimeoutError', message: 'SQL operation timed out' }
			: { name: 'AbortError', message: 'SQL operation aborted' });
		if (source !== 'timeout') (source === 'caller' ? caller : factory).abort(new Error('postgres://private:secret@host'));
		await rejected;
	});

	it('rejects an already aborted caller before executing and redacts transport failures', async () => {
		const transport = runtime();
		const client = await createSqlServiceToolClient(transport, 'db');
		const controller = new AbortController();
		controller.abort('SELECT private');
		await expect(client.ping({}, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError', message: 'SQL operation aborted' });
		expect(transport.call).not.toHaveBeenCalled();
		transport.call.mockRejectedValueOnce(new Error('SELECT password postgres://user:secret@host'));
		await expect(client.ping()).rejects.toEqual(new Error('SQL operation failed'));
	});

	it('blocks read-only writes, malformed input and calls after close without closing the borrowed runtime', async () => {
		const transport = runtime();
		const client = await createSqlServiceToolClient(transport, 'db');
		await expect(client.exec({ statement: 'DELETE FROM sample' })).rejects.toThrow('read-only');
		await expect(client.query({ statement: 'SELECT 1', private: true } as never)).rejects.toThrow('Invalid SQL service input');
		expect(transport.call).not.toHaveBeenCalled();
		await client[Symbol.asyncDispose]();
		await client.close();
		await expect(client.ping()).rejects.toThrow('SQL service is closed');
		expect(transport.call).not.toHaveBeenCalled();
	});

	it('executes explicit writable calls and rejects results arriving after close', async () => {
		const transport = runtime();
		const client = await createSqlServiceToolClient(transport, 'db', { readOnly: false });
		await expect(client.exec({ statement: 'DELETE FROM sample', params: [1] })).resolves.toEqual(result);
		transport.call.mockImplementationOnce(async () => { await client.close(); return result; });
		await expect(client.query({ statement: 'SELECT 1' })).rejects.toThrow('SQL service is closed');
	});

	it.each(['close', 'dispose'] as const)('%s aborts every in-flight call and settles even when the borrowed transport ignores cancellation', async (method) => {
		const transport = { ...runtime(), close: vi.fn() };
		const signals: AbortSignal[] = [];
		let started!: () => void;
		const running = new Promise<void>((resolve) => { started = resolve; });
		transport.call.mockImplementation((_input, options) => {
			signals.push(options!.signal!);
			if (signals.length === 2) started();
			return new Promise<never>(() => {});
		});
		const client = await createSqlServiceToolClient(transport, 'db', { readOnly: false });
		const exec = client.exec({ statement: 'DELETE FROM sample' });
		const query = client.query({ statement: 'SELECT 1' });
		const rejectedExec = expect(exec).rejects.toEqual(new Error('SQL service is closed'));
		const rejectedQuery = expect(query).rejects.toEqual(new Error('SQL service is closed'));
		await running;
		expect(signals.every((signal) => !signal.aborted)).toBe(true);
		if (method === 'dispose') await client[Symbol.asyncDispose]();
		else await client.close();
		expect(signals.every((signal) => signal.aborted)).toBe(true);
		await Promise.all([rejectedExec, rejectedQuery]);
		await expect(client.exec({ statement: 'DELETE FROM sample' })).rejects.toThrow('SQL service is closed');
		expect(transport.call).toHaveBeenCalledTimes(2);
		expect(transport.close).not.toHaveBeenCalled();
	});

	it.each(['caller', 'factory', 'timeout'])('%s ends the local wait when transport ignores signal', async (source) => {
		const transport = runtime();
		const factory = new AbortController();
		const caller = new AbortController();
		let started!: () => void;
		const running = new Promise<void>((resolve) => { started = resolve; });
		let signal!: AbortSignal;
		transport.call.mockImplementation((_input, options) => {
			signal = options!.signal!;
			started();
			return new Promise<never>(() => {});
		});
		const client = await createSqlServiceToolClient(transport, 'db', { signal: factory.signal });
		const pending = client.query({ statement: 'SELECT 1' }, { signal: caller.signal, context: { timeoutMs: source === 'timeout' ? 10 : 1000 } });
		const rejected = expect(pending).rejects.toMatchObject(source === 'timeout'
			? { name: 'TimeoutError', message: 'SQL operation timed out' }
			: { name: 'AbortError', message: 'SQL operation aborted' });
		await running;
		if (source !== 'timeout') (source === 'caller' ? caller : factory).abort(new Error('private connection string'));
		await rejected;
		expect(signal.aborted).toBe(true);
		await client.close();
	});

	it.each(['success', 'sync throw', 'async reject', 'parse failure', 'readOnly', 'cancel', 'timeout', 'close'])('cleans up listeners, timers and active tracking after %s', async (outcome) => {
		vi.useFakeTimers();
		try {
			const transport = runtime();
			const source = new AbortController();
			const add = vi.spyOn(source.signal, 'addEventListener');
			const remove = vi.spyOn(source.signal, 'removeEventListener');
			let transportSignal: AbortSignal | undefined;
			transport.call.mockImplementation((_input, options) => {
				transportSignal = options!.signal!;
				if (outcome === 'sync throw') throw new Error('postgres://user:secret@host');
				if (outcome === 'async reject') return Promise.reject(new Error('SELECT private'));
				if (['cancel', 'timeout', 'close'].includes(outcome)) return new Promise<never>(() => {});
				return Promise.resolve(result);
			});
			const client = await createSqlServiceToolClient(transport, 'db', { signal: source.signal });
			const callOptions = { signal: source.signal, context: { timeoutMs: 10 } };
			const pending = outcome === 'readOnly'
				? client.exec({ statement: 'DELETE FROM sample' }, callOptions)
				: client.query(outcome === 'parse failure' ? {} as never : { statement: 'SELECT 1' }, callOptions);
			const checked = outcome === 'success' ? expect(pending).resolves.toEqual(result)
				: expect(pending).rejects.toThrow(outcome === 'parse failure' ? 'Invalid SQL service input'
					: outcome === 'readOnly' ? 'SQL service is read-only'
						: outcome === 'cancel' ? 'SQL operation aborted'
							: outcome === 'timeout' ? 'SQL operation timed out'
								: outcome === 'close' ? 'SQL service is closed' : 'SQL operation failed');
			await Promise.resolve();
			if (outcome === 'cancel') source.abort('private');
			if (outcome === 'timeout') await vi.advanceTimersByTimeAsync(10);
			if (outcome === 'close') await client.close();
			await checked;
			expect(add).toHaveBeenCalledTimes(1);
			expect(remove).toHaveBeenCalledExactlyOnceWith('abort', add.mock.calls[0]![1]);
			expect(vi.getTimerCount()).toBe(0);
			await client.close();
			if (['success', 'sync throw', 'async reject'].includes(outcome)) expect(transportSignal?.aborted).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});
});
