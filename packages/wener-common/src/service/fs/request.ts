import type { FsServiceCallOptions } from './FsServiceContract';

/** Filesystem-local lifecycle policy; transport receives the composed cancellation signal. */
export function createFsRequestScope(signal?: AbortSignal) {
	const controller = new AbortController();
	const active = new Set<Promise<void>>();
	let closePromise: Promise<void> | undefined;
	function assertOpen() {
		controller.signal.throwIfAborted();
		signal?.throwIfAborted();
	}
	async function run<T>(invoke: (signal: AbortSignal) => Promise<T>, options?: FsServiceCallOptions): Promise<T> {
		assertOpen();
		options?.signal?.throwIfAborted();
		const timeoutMs = options?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Filesystem timeout');
		const timeout = new AbortController();
		const merged = AbortSignal.any([controller.signal, timeout.signal, ...[signal, options?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		)]);
		let rejectAbort!: (reason: unknown) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		const onAbort = () => rejectAbort(merged.reason);
		merged.addEventListener('abort', onAbort, { once: true });
		let finish!: () => void;
		const done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(done);
		const timer = timeoutMs === undefined ? undefined : setTimeout(() => timeout.abort(new Error('Filesystem request timed out')), timeoutMs);
		// A synchronous throw or an abort before the request starts must still clean up the scope.
		const request = Promise.resolve().then(() => { merged.throwIfAborted(); return invoke(merged); });
		try {
			if (merged.aborted) onAbort();
			const result = await Promise.race([request, aborted]);
			merged.throwIfAborted();
			return result;
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(done);
			finish();
		}
	}
	function close(): Promise<void> {
		if (closePromise) return closePromise;
		controller.abort(new Error('Filesystem client is closed'));
		closePromise = Promise.all([...active]).then(() => undefined);
		return closePromise;
	}
	return { assertOpen, run, close };
}
