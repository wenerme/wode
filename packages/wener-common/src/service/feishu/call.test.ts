import { afterEach, describe, expect, it, vi } from 'vitest';
import { feishuCall } from './call';

afterEach(() => { vi.useRealTimers(); });

describe('Feishu operation deadline', () => {
	it('aborts the effective signal and clears its timer on timeout', async () => {
		vi.useFakeTimers();
		const caller = new AbortController();
		let effective!: AbortSignal;
		const pending = feishuCall(caller.signal, (signal) => {
			effective = signal;
			return new Promise(() => {});
		}, 20);
		const rejected = expect(pending).rejects.toMatchObject({
			name: 'FeishuServiceError', code: 'OPERATION_FAILED', message: 'Feishu request timed out',
		});
		await vi.advanceTimersByTimeAsync(20);
		await rejected;
		expect(effective.aborted).toBe(true);
		expect(caller.signal.aborted).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('clears the deadline on success and preserves later caller cancellation', async () => {
		vi.useFakeTimers();
		const caller = new AbortController();
		let effective!: AbortSignal;
		await expect(feishuCall(caller.signal, async (signal) => { effective = signal; return 'ok'; }, 20)).resolves.toBe('ok');
		expect(vi.getTimerCount()).toBe(0);
		await vi.advanceTimersByTimeAsync(100);
		expect(effective.aborted).toBe(false);
		caller.abort();
		expect(effective.aborted).toBe(true);
	});

	it('clears the deadline on operation failure and caller abort', async () => {
		vi.useFakeTimers();
		const caller = new AbortController();
		await expect(feishuCall(caller.signal, async () => { throw new Error('sensitive upstream payload'); }, 20))
			.rejects.toMatchObject({ code: 'OPERATION_FAILED', message: 'Feishu service operation failed' });
		expect(vi.getTimerCount()).toBe(0);
		const pending = feishuCall(caller.signal, () => new Promise(() => {}), 20);
		const rejected = expect(pending).rejects.toThrow('cancelled');
		caller.abort(new Error('cancelled'));
		await rejected;
		expect(vi.getTimerCount()).toBe(0);
	});
});
