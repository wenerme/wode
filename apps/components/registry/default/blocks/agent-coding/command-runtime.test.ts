import { describe, expect, it, vi } from 'vite-plus/test';
import { createAgentCommandRuntime, MaxAgentCommandBytes, MaxAgentCommandStdinBytes } from './command-runtime';
import type { AgentCommandExecutor } from './command-types';

const success = (stdout = 'ok') => ({
	durationMs: 1,
	exitCode: 0,
	settled: true,
	stderr: '',
	stdout,
	truncated: false,
});

describe('AgentCommandRuntime', () => {
	it('enforces command/stdin byte bounds before delegation', async () => {
		const execute = vi.fn<AgentCommandExecutor['execute']>(async () => success());
		const runtime = createAgentCommandRuntime({ execute });
		expect((await runtime.execute({ command: '你'.repeat(MaxAgentCommandBytes) })).exitCode).toBe(126);
		expect((await runtime.execute({ command: 'ok', stdin: '你'.repeat(MaxAgentCommandStdinBytes) })).exitCode).toBe(
			126,
		);
		expect(execute).not.toHaveBeenCalled();
	});

	it('cancels through the runtime-owned signal', async () => {
		const executor: AgentCommandExecutor = {
			execute: (_request, options) =>
				new Promise((resolve) => {
					options?.signal?.addEventListener('abort', () => resolve({ ...success(), aborted: true, exitCode: 130 }), {
						once: true,
					});
				}),
		};
		const runtime = createAgentCommandRuntime(executor);
		const request = runtime.execute({ command: 'sleep 10' });
		runtime.cancelCurrent();
		expect(await request).toMatchObject({ aborted: true, exitCode: 130, settled: true });
	});

	it('starts a finite settle grace only after cancellation and ignores a late executor rejection', async () => {
		vi.useFakeTimers();
		try {
			const pending = deferred<ReturnType<typeof success>>();
			const runtime = createAgentCommandRuntime({ execute: () => pending.promise }, { cancelSettleGraceMs: 25 });
			let completed = false;
			const request = runtime.execute({ command: 'ignores-abort' }).then((result) => {
				completed = true;
				return result;
			});
			await vi.advanceTimersByTimeAsync(10_000);
			expect(completed).toBe(false);
			expect(runtime.getState()).toMatchObject({ mutationMayContinue: false, poisoned: false, running: true });
			runtime.cancelCurrent('test-cancel');
			await vi.advanceTimersByTimeAsync(25);
			expect(await request).toMatchObject({
				aborted: true,
				exitCode: 130,
				mutationMayContinue: true,
				poisoned: true,
				settled: false,
			});
			expect(runtime.getState()).toEqual({ mutationMayContinue: true, poisoned: true, running: false });
			pending.reject(new Error('late rejection'));
			await Promise.resolve();
			expect(runtime.getState()).toEqual({ mutationMayContinue: true, poisoned: true, running: false });
		} finally {
			vi.useRealTimers();
		}
	});

	it('retains the real executor result when cancellation settles within grace', async () => {
		vi.useFakeTimers();
		try {
			const executor: AgentCommandExecutor = {
				execute: (_request, options) =>
					new Promise((resolve) => {
						options?.signal?.addEventListener(
							'abort',
							() => setTimeout(() => resolve({ ...success('settled'), aborted: true, exitCode: 130 }), 10),
							{ once: true },
						);
					}),
			};
			const runtime = createAgentCommandRuntime(executor, { cancelSettleGraceMs: 20 });
			const request = runtime.execute({ command: 'settles-after-abort' });
			runtime.cancelCurrent();
			await vi.advanceTimersByTimeAsync(10);
			expect(await request).toMatchObject({
				aborted: true,
				exitCode: 130,
				settled: true,
				stdout: 'settled',
			});
			expect(runtime.getState()).toEqual({ mutationMayContinue: false, poisoned: false, running: false });
		} finally {
			vi.useRealTimers();
		}
	});

	it('waits for the active cancellation outcome before exposing transition state', async () => {
		vi.useFakeTimers();
		try {
			const pending = deferred<ReturnType<typeof success>>();
			const runtime = createAgentCommandRuntime({ execute: () => pending.promise }, { cancelSettleGraceMs: 10 });
			const request = runtime.execute({ command: 'old-runtime' });
			const transition = runtime.cancelCurrentAndWait('runtime-replaced');
			expect(runtime.getState().running).toBe(true);
			await vi.advanceTimersByTimeAsync(10);
			expect(await request).toMatchObject({ mutationMayContinue: true, settled: false });
			expect(await transition).toEqual({ mutationMayContinue: true, poisoned: true, running: false });
			pending.resolve(success('late'));
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not acquire a busy manual-style invocation or replace the real active command', async () => {
		const pending = deferred<ReturnType<typeof success>>();
		const runtime = createAgentCommandRuntime({ execute: () => pending.promise });
		let active = '';
		const first = runtime.execute({ command: 'real-command' }, { onAcquired: () => (active = 'real-command') });
		const busy = await runtime.execute({ command: 'busy-command' }, { onAcquired: () => (active = 'busy-command') });
		expect(active).toBe('real-command');
		expect(busy).toMatchObject({ exitCode: 125, poisoned: false, settled: true });
		pending.resolve(success());
		await first;
	});

	it.each([
		{ mutationMayContinue: true, settled: true },
		{ settled: false },
		{ poisoned: true, settled: true },
	])('poisons after an unsafe terminal result: $settled/$mutationMayContinue/$poisoned', async (unsafe) => {
		const execute = vi.fn<AgentCommandExecutor['execute']>(async () => ({ ...success(), ...unsafe }));
		const runtime = createAgentCommandRuntime({ execute });
		expect((await runtime.execute({ command: 'first' })).poisoned).toBe(true);
		expect(await runtime.execute({ command: 'second' })).toMatchObject({ exitCode: 125, poisoned: true });
		expect(execute).toHaveBeenCalledOnce();
	});
});

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, reject, resolve };
}
