import type {
	AgentCommandExecutor,
	AgentCommandRequest,
	AgentCommandRuntimeState,
	AgentTerminalResult,
} from './command-types';

export const MaxAgentCommandBytes = 16 * 1024;
export const MaxAgentCommandStdinBytes = 256 * 1024;
export const MaxAgentCommandOutputBytes = 256 * 1024;
export const DefaultAgentCommandCancelSettleGraceMs = 1_000;

export type AgentCommandRuntime = {
	cancelCurrent(reason?: unknown): void;
	cancelCurrentAndWait(reason?: unknown): Promise<AgentCommandRuntimeState>;
	execute(
		request: AgentCommandRequest,
		options?: { onAcquired?: () => void; signal?: AbortSignal },
	): Promise<AgentTerminalResult>;
	getState(): AgentCommandRuntimeState;
};

export type AgentCommandRuntimeOptions = {
	cancelSettleGraceMs?: number;
};

type ExecutorOutcome = { error: unknown; kind: 'error' } | { kind: 'result'; result: AgentTerminalResult };
type CancellationOutcome = { kind: 'cancelled' };
type GraceExpiredOutcome = { kind: 'grace-expired' };

export function createAgentCommandRuntime(
	executor: AgentCommandExecutor,
	options: AgentCommandRuntimeOptions = {},
): AgentCommandRuntime {
	const cancelSettleGraceMs = resolveCancelSettleGrace(options.cancelSettleGraceMs);
	let running = false;
	let poisoned = false;
	let mutationMayContinue = false;
	let activeController: AbortController | undefined;
	let activeCompletion: Promise<void> | undefined;
	return {
		cancelCurrent(reason = 'cancelled') {
			activeController?.abort(reason);
		},
		async cancelCurrentAndWait(reason = 'cancelled') {
			activeController?.abort(reason);
			await activeCompletion;
			return { mutationMayContinue, poisoned, running };
		},
		async execute(request, executeOptions) {
			if (poisoned) return limitedResult('执行器已被未完成的命令污染，请替换执行器后重试。', 125, true);
			if (running) return limitedResult('已有命令正在执行。', 125, false);
			if (utf8Bytes(request.command) > MaxAgentCommandBytes) {
				return limitedResult(`命令超过 ${MaxAgentCommandBytes} 字节限制。`, 126, false);
			}
			if (utf8Bytes(request.stdin ?? '') > MaxAgentCommandStdinBytes) {
				return limitedResult(`标准输入超过 ${MaxAgentCommandStdinBytes} 字节限制。`, 126, false);
			}
			running = true;
			let finishCompletion!: () => void;
			const completion = new Promise<void>((resolve) => {
				finishCompletion = resolve;
			});
			activeCompletion = completion;
			const startedAt = now();
			const controller = new AbortController();
			activeController = controller;
			const onExternalAbort = () => controller.abort(executeOptions?.signal?.reason);
			executeOptions?.signal?.addEventListener('abort', onExternalAbort, { once: true });
			if (executeOptions?.signal?.aborted) onExternalAbort();
			let notifyCancelled: (() => void) | undefined;
			const cancellation = new Promise<CancellationOutcome>((resolve) => {
				notifyCancelled = () => resolve({ kind: 'cancelled' });
			});
			const onRuntimeAbort = () => notifyCancelled?.();
			controller.signal.addEventListener('abort', onRuntimeAbort, { once: true });
			if (controller.signal.aborted) onRuntimeAbort();
			try {
				executeOptions?.onAcquired?.();
				let delegated: Promise<AgentTerminalResult>;
				try {
					delegated = executor.execute(
						{ command: request.command, stdin: request.stdin },
						{ signal: controller.signal },
					);
				} catch (error) {
					delegated = Promise.reject(error);
				}
				const executorOutcome: Promise<ExecutorOutcome> = delegated.then(
					(result) => ({ kind: 'result', result }),
					(error: unknown) => ({ error, kind: 'error' }),
				);
				const first = await Promise.race([executorOutcome, cancellation]);
				const outcome =
					first.kind === 'cancelled'
						? await settleWithinCancellationGrace(executorOutcome, cancelSettleGraceMs)
						: first;
				if (outcome.kind === 'grace-expired') {
					poisoned = true;
					mutationMayContinue = true;
					return cancellationDidNotSettleResult(startedAt, cancelSettleGraceMs);
				}
				if (outcome.kind === 'error') {
					return {
						durationMs: Math.max(0, now() - startedAt),
						exitCode: 1,
						settled: true,
						stderr: toErrorMessage(outcome.error).slice(0, 1024),
						stdout: '',
						truncated: false,
					};
				}
				const output = boundOutput(outcome.result.stdout, outcome.result.stderr, MaxAgentCommandOutputBytes);
				const result: AgentTerminalResult = {
					...outcome.result,
					durationMs: safeDuration(outcome.result.durationMs, startedAt),
					settled: outcome.result.settled === true,
					stderr: output.stderr,
					stdout: output.stdout,
					truncated: outcome.result.truncated || output.truncated,
				};
				if (!result.settled || result.mutationMayContinue) mutationMayContinue = true;
				if (!result.settled || result.mutationMayContinue || result.poisoned) poisoned = true;
				return { ...result, poisoned: poisoned || result.poisoned };
			} finally {
				executeOptions?.signal?.removeEventListener('abort', onExternalAbort);
				controller.signal.removeEventListener('abort', onRuntimeAbort);
				if (activeController === controller) activeController = undefined;
				running = false;
				finishCompletion();
				if (activeCompletion === completion) activeCompletion = undefined;
			}
		},
		getState: () => ({ mutationMayContinue, poisoned, running }),
	};
}

function cancellationDidNotSettleResult(startedAt: number, graceMs: number): AgentTerminalResult {
	return {
		aborted: true,
		durationMs: Math.max(0, now() - startedAt),
		exitCode: 130,
		mutationMayContinue: true,
		poisoned: true,
		settled: false,
		stderr: `命令取消后未在 ${graceMs} 毫秒内结束；底层执行仍可能继续，运行时已污染。\n`,
		stdout: '',
		truncated: false,
	};
}

async function settleWithinCancellationGrace(
	outcome: Promise<ExecutorOutcome>,
	graceMs: number,
): Promise<ExecutorOutcome | GraceExpiredOutcome> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			outcome,
			new Promise<GraceExpiredOutcome>((resolve) => {
				timer = setTimeout(() => resolve({ kind: 'grace-expired' }), graceMs);
			}),
		]);
	} finally {
		if (timer !== undefined) clearTimeout(timer);
	}
}

function resolveCancelSettleGrace(value: number | undefined): number {
	if (value === undefined) return DefaultAgentCommandCancelSettleGraceMs;
	if (!Number.isFinite(value) || value < 0) throw new RangeError('cancelSettleGraceMs 必须是有限的非负数。');
	return value;
}

function limitedResult(message: string, exitCode: number, isPoisoned: boolean): AgentTerminalResult {
	return {
		durationMs: 0,
		exitCode,
		poisoned: isPoisoned,
		settled: true,
		stderr: `${message}\n`,
		stdout: '',
		truncated: false,
	};
}

function boundOutput(stdout: string, stderr: string, limit: number) {
	const first = truncateUtf8(stdout, limit);
	const second = truncateUtf8(stderr, Math.max(0, limit - first.bytes));
	return { stdout: first.value, stderr: second.value, truncated: first.truncated || second.truncated };
}

function truncateUtf8(value: string, limit: number): { bytes: number; truncated: boolean; value: string } {
	const bytes = new TextEncoder().encode(value);
	if (bytes.byteLength <= limit) return { bytes: bytes.byteLength, truncated: false, value };
	let end = limit;
	while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
	return { bytes: end, truncated: true, value: new TextDecoder().decode(bytes.slice(0, end)) };
}

function safeDuration(value: number, startedAt: number): number {
	return Number.isFinite(value) && value >= 0 ? value : Math.max(0, now() - startedAt);
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

function now(): number {
	return typeof performance === 'undefined' ? Date.now() : performance.now();
}
