import { truncateUtf8, utf8ByteLength } from './encoding';
import type { JustBashWorkspace, JustBashWorkspaceExecResult } from './workspace';

export const MaxJustBashAgentTimeoutMs = 30_000;
export const MaxJustBashAgentCancellationSettleMs = 5_000;
export const MaxJustBashAgentOutputBytes = 4 * 1024 * 1024;
export const MaxJustBashAgentCommandBytes = 64 * 1024;
export const MaxJustBashAgentStdinBytes = 4 * 1024 * 1024;
export const MaxJustBashAgentEnvBytes = 256 * 1024;

export const JustBashAgentExecutionLimitCeilings = Object.freeze({
	maxCommandCount: 512,
	maxLoopIterations: 10_000,
	maxCallDepth: 64,
	maxOutputSize: MaxJustBashAgentOutputBytes,
});

export type CreateJustBashAgentSessionOptions = {
	workspace: JustBashWorkspace;
	cwd?: string;
	env?: Record<string, string>;
	timeoutMs?: number;
	cancellationSettleMs?: number;
	maxOutputBytes?: number;
	maxCommandBytes?: number;
	maxStdinBytes?: number;
	/** Aggregate UTF-8 bytes across every environment key and value. */
	maxEnvBytes?: number;
};

export type JustBashAgentExecOptions = {
	cwd?: string;
	env?: Record<string, string>;
	stdin?: string;
	signal?: AbortSignal;
	timeoutMs?: number;
};

export type JustBashAgentExecResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
	durationMs: number;
	cwd: string;
	timedOut: boolean;
	aborted: boolean;
	truncated: boolean;
	workspaceChanged: boolean;
	workspaceRevisionBefore: number;
	workspaceRevisionAfter: number;
	env: Record<string, string>;
	/** True only when no operation owned by this session can still mutate the supplied IFileSystem. */
	settled: boolean;
	/**
	 * An injected IFileSystem may ignore AbortSignal. When true, mutation can continue after this result returns.
	 * The session is permanently poisoned and must be replaced.
	 */
	mutationMayContinue: boolean;
	poisoned: boolean;
	limitReason?:
		| 'busy'
		| 'command-too-long'
		| 'stdin-too-long'
		| 'env-too-large'
		| 'timeout'
		| 'aborted'
		| 'session-poisoned';
};

export type JustBashAgentSessionState = {
	cwd: string;
	env: Record<string, string>;
	poisoned: boolean;
};

export type JustBashAgentSession = {
	readonly workspace: JustBashWorkspace;
	getState(): JustBashAgentSessionState;
	exec(command: string, options?: JustBashAgentExecOptions): Promise<JustBashAgentExecResult>;
};

export function createJustBashAgentSession(options: CreateJustBashAgentSessionOptions): JustBashAgentSession {
	return new JustBashAgentSessionImplementation(options);
}

class JustBashAgentSessionImplementation implements JustBashAgentSession {
	readonly workspace: JustBashWorkspace;
	private readonly timeoutMs: number;
	private readonly cancellationSettleMs: number;
	private readonly maxOutputBytes: number;
	private readonly maxCommandBytes: number;
	private readonly maxStdinBytes: number;
	private readonly maxEnvBytes: number;
	private cwd: string;
	private env: Record<string, string>;
	private running = false;
	private poisoned = false;

	constructor({
		workspace,
		cwd = workspace.cwd,
		env = {},
		timeoutMs = 5_000,
		cancellationSettleMs = 250,
		maxOutputBytes = 256 * 1024,
		maxCommandBytes = 16 * 1024,
		maxStdinBytes = 256 * 1024,
		maxEnvBytes = 64 * 1024,
	}: CreateJustBashAgentSessionOptions) {
		this.workspace = workspace;
		this.cwd = cwd;
		this.timeoutMs = validateBoundedInteger('timeoutMs', timeoutMs, MaxJustBashAgentTimeoutMs);
		this.cancellationSettleMs = validateBoundedInteger(
			'cancellationSettleMs',
			cancellationSettleMs,
			MaxJustBashAgentCancellationSettleMs,
		);
		this.maxOutputBytes = validateBoundedInteger('maxOutputBytes', maxOutputBytes, MaxJustBashAgentOutputBytes);
		this.maxCommandBytes = validateBoundedInteger('maxCommandBytes', maxCommandBytes, MaxJustBashAgentCommandBytes);
		this.maxStdinBytes = validateBoundedInteger('maxStdinBytes', maxStdinBytes, MaxJustBashAgentStdinBytes);
		this.maxEnvBytes = validateBoundedInteger('maxEnvBytes', maxEnvBytes, MaxJustBashAgentEnvBytes);
		assertEnvWithinLimit(env, this.maxEnvBytes);
		this.env = { ...env };
		assertAgentExecutionLimits(workspace);
	}

	getState(): JustBashAgentSessionState {
		return { cwd: this.cwd, env: { ...this.env }, poisoned: this.poisoned };
	}

	async exec(command: string, options: JustBashAgentExecOptions = {}): Promise<JustBashAgentExecResult> {
		const startedAt = performanceNow();
		const workspaceRevisionBefore = this.workspace.workspaceVersion;
		if (this.poisoned) {
			return this.limitedResult(
				'session-poisoned',
				'Session is poisoned by an unsettled prior command; create a new session\n',
				startedAt,
				125,
				workspaceRevisionBefore,
				false,
				true,
			);
		}
		if (this.running) {
			return this.limitedResult(
				'busy',
				'Another command is already running in this session\n',
				startedAt,
				125,
				workspaceRevisionBefore,
			);
		}
		if (utf8ByteLength(command) > this.maxCommandBytes) {
			return this.limitedResult(
				'command-too-long',
				`Command exceeds the ${this.maxCommandBytes} byte input limit\n`,
				startedAt,
				126,
				workspaceRevisionBefore,
			);
		}
		const stdin = options.stdin ?? '';
		if (utf8ByteLength(stdin) > this.maxStdinBytes) {
			return this.limitedResult(
				'stdin-too-long',
				`Stdin exceeds the ${this.maxStdinBytes} byte input limit\n`,
				startedAt,
				126,
				workspaceRevisionBefore,
			);
		}
		const env = { ...this.env, ...options.env };
		if (!isEnvWithinLimit(env, this.maxEnvBytes)) {
			return this.limitedResult(
				'env-too-large',
				`Environment exceeds the ${this.maxEnvBytes} byte aggregate limit\n`,
				startedAt,
				126,
				workspaceRevisionBefore,
			);
		}
		const timeoutMs =
			options.timeoutMs === undefined
				? this.timeoutMs
				: Math.min(validateBoundedInteger('timeoutMs', options.timeoutMs, MaxJustBashAgentTimeoutMs), this.timeoutMs);
		if (options.signal?.aborted) {
			return this.limitedResult('aborted', 'Command aborted\n', startedAt, 130, workspaceRevisionBefore);
		}

		this.running = true;
		const controller = new AbortController();
		let stopReason: 'timeout' | 'aborted' | undefined;
		let releaseWhenExecutionSettles = false;
		let settleStop!: (value: StopResult) => void;
		const stopPromise = new Promise<StopResult>((resolve) => {
			settleStop = resolve;
		});
		const stop = (reason: 'timeout' | 'aborted') => {
			if (stopReason) return;
			stopReason = reason;
			settleStop({ kind: 'stopped', reason });
			controller.abort(reason);
		};
		const onAbort = () => stop('aborted');
		options.signal?.addEventListener('abort', onAbort, { once: true });
		const timeout = setTimeout(() => stop('timeout'), timeoutMs);
		const execution: Promise<ExecutionResult> = this.workspace
			.exec(command, {
				cwd: options.cwd ?? this.cwd,
				env,
				replaceEnv: Object.keys(env).length > 0,
				stdin,
				signal: controller.signal,
			})
			.then(
				(result): ExecutionResult => ({ kind: 'completed', result }),
				(error: unknown): ExecutionResult => ({ kind: 'failed', error }),
			);

		try {
			let terminal = await Promise.race<ExecutionResult | StopResult>([execution, stopPromise]);
			if (terminal.kind === 'stopped') {
				const stopped = terminal;
				const settledTerminal = await settleWithin(execution, this.cancellationSettleMs);
				if (!settledTerminal) {
					this.poisoned = true;
					releaseWhenExecutionSettles = true;
					void execution.then(() => {
						this.running = false;
					});
					return this.cancelledResult(stopped.reason, timeoutMs, startedAt, workspaceRevisionBefore, false, true);
				}
				terminal = settledTerminal;
				return this.cancelledResult(stopped.reason, timeoutMs, startedAt, workspaceRevisionBefore, true, false);
			}
			if (terminal.kind === 'failed') {
				if (stopReason) {
					return this.cancelledResult(stopReason, timeoutMs, startedAt, workspaceRevisionBefore, true, false);
				}
				const workspaceRevisionAfter = this.workspace.workspaceVersion;
				return this.completedResult(
					{
						stdout: '',
						stderr: `${toErrorMessage(terminal.error)}\n`,
						exitCode: 1,
						durationMs: Math.max(0, performanceNow() - startedAt),
						cwd: options.cwd ?? this.cwd,
						env,
						workspaceChanged: workspaceRevisionAfter !== workspaceRevisionBefore,
						workspaceRevisionBefore,
						workspaceRevisionAfter,
					},
					false,
					false,
				);
			}
			if (!isEnvWithinLimit(terminal.result.env, this.maxEnvBytes)) {
				return this.limitedResult(
					'env-too-large',
					`Resulting environment exceeds the ${this.maxEnvBytes} byte aggregate limit\n`,
					startedAt,
					126,
					workspaceRevisionBefore,
				);
			}
			this.cwd = terminal.result.cwd;
			this.env = { ...terminal.result.env };
			return this.completedResult(terminal.result, false, false);
		} finally {
			clearTimeout(timeout);
			options.signal?.removeEventListener('abort', onAbort);
			if (!releaseWhenExecutionSettles) this.running = false;
		}
	}

	private cancelledResult(
		reason: 'timeout' | 'aborted',
		timeoutMs: number,
		startedAt: number,
		workspaceRevisionBefore: number,
		settled: boolean,
		mutationMayContinue: boolean,
	): JustBashAgentExecResult {
		const message = reason === 'timeout' ? `Command timed out after ${timeoutMs}ms\n` : 'Command aborted\n';
		return this.limitedResult(
			reason,
			message,
			startedAt,
			reason === 'timeout' ? 124 : 130,
			workspaceRevisionBefore,
			settled,
			mutationMayContinue,
		);
	}

	private limitedResult(
		reason: NonNullable<JustBashAgentExecResult['limitReason']>,
		stderr: string,
		startedAt: number,
		exitCode: number,
		workspaceRevisionBefore: number,
		settled = true,
		mutationMayContinue = false,
	): JustBashAgentExecResult {
		const workspaceRevisionAfter = this.workspace.workspaceVersion;
		return this.completedResult(
			{
				stdout: '',
				stderr,
				exitCode,
				durationMs: Math.max(0, performanceNow() - startedAt),
				cwd: this.cwd,
				env: this.env,
				workspaceChanged: workspaceRevisionAfter !== workspaceRevisionBefore,
				workspaceRevisionBefore,
				workspaceRevisionAfter,
			},
			reason === 'timeout',
			reason === 'aborted',
			reason,
			settled,
			mutationMayContinue,
		);
	}

	private completedResult(
		result: Pick<
			JustBashWorkspaceExecResult,
			| 'stdout'
			| 'stderr'
			| 'exitCode'
			| 'durationMs'
			| 'cwd'
			| 'env'
			| 'workspaceChanged'
			| 'workspaceRevisionBefore'
			| 'workspaceRevisionAfter'
		>,
		timedOut: boolean,
		aborted: boolean,
		limitReason?: JustBashAgentExecResult['limitReason'],
		settled = true,
		mutationMayContinue = false,
	): JustBashAgentExecResult {
		const output = limitOutput(result.stdout, result.stderr, this.maxOutputBytes);
		return {
			stdout: output.stdout,
			stderr: output.stderr,
			exitCode: result.exitCode,
			durationMs: result.durationMs,
			cwd: result.cwd,
			timedOut,
			aborted,
			truncated: output.truncated,
			workspaceChanged: result.workspaceChanged,
			workspaceRevisionBefore: result.workspaceRevisionBefore,
			workspaceRevisionAfter: result.workspaceRevisionAfter,
			env: { ...result.env },
			settled,
			mutationMayContinue,
			poisoned: this.poisoned,
			limitReason,
		};
	}
}

type ExecutionResult = { kind: 'completed'; result: JustBashWorkspaceExecResult } | { kind: 'failed'; error: unknown };
type StopResult = { kind: 'stopped'; reason: 'timeout' | 'aborted' };

async function settleWithin(
	execution: Promise<ExecutionResult>,
	budgetMs: number,
): Promise<ExecutionResult | undefined> {
	let timer: number | undefined;
	const budget = new Promise<undefined>((resolve) => {
		timer = setTimeout(resolve, budgetMs);
	});
	try {
		return await Promise.race([execution, budget]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

function assertEnvWithinLimit(env: Record<string, string>, maximum: number): void {
	if (!isEnvWithinLimit(env, maximum)) {
		throw new Error(`env must contain no more than ${maximum} aggregate UTF-8 bytes across keys and values`);
	}
}

function isEnvWithinLimit(env: Record<string, string>, maximum: number): boolean {
	let total = 0;
	for (const [key, value] of Object.entries(env)) {
		if (typeof value !== 'string') return false;
		total += utf8ByteLength(key) + utf8ByteLength(value);
		if (total > maximum) return false;
	}
	return true;
}

function assertAgentExecutionLimits(workspace: JustBashWorkspace): void {
	for (const [name, ceiling] of Object.entries(JustBashAgentExecutionLimitCeilings)) {
		const value = workspace.executionLimits[name as keyof typeof JustBashAgentExecutionLimitCeilings];
		if (typeof value !== 'number' || value <= 0 || value > ceiling) {
			throw new Error(`Agent session requires ${name} <= ${ceiling}; received ${String(value)}`);
		}
	}
}

function limitOutput(stdout: string, stderr: string, maxBytes: number) {
	const boundedStdout = truncateUtf8(stdout, maxBytes);
	const remaining = Math.max(0, maxBytes - boundedStdout.byteLength);
	const boundedStderr = truncateUtf8(stderr, remaining);
	return {
		stdout: boundedStdout.value,
		stderr: boundedStderr.value,
		truncated: boundedStdout.truncated || boundedStderr.truncated,
	};
}

function validateBoundedInteger(name: string, value: number, maximum: number): number {
	if (!Number.isInteger(value) || value <= 0 || value > maximum) {
		throw new Error(`${name} must be a positive integer no greater than ${maximum}`);
	}
	return value;
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function performanceNow(): number {
	return typeof performance === 'undefined' ? Date.now() : performance.now();
}
