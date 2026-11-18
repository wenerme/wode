import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { IGoogleAnalyticsService } from '../IGoogleAnalyticsService';
import {
	type GoogleAnalyticsServiceCallOptions,
	GoogleAnalyticsServiceContract,
	type GoogleAnalyticsServiceInputs,
	type GoogleAnalyticsServiceOutputs,
} from '../GoogleAnalyticsServiceContract';

/** Remote `IGoogleAnalyticsService` over a service runtime; validates input/output with the contract. */
export async function createGoogleAnalyticsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<IGoogleAnalyticsService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<K extends keyof GoogleAnalyticsServiceInputs>(
		toolName: K,
		input: GoogleAnalyticsServiceInputs[K],
		callOptions?: GoogleAnalyticsServiceCallOptions,
	): Promise<GoogleAnalyticsServiceOutputs[K]> {
		if (closed) throw new Error('Google Analytics client is closed');
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Google Analytics operation unavailable');
		const parsedInput = GoogleAnalyticsServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid Google Analytics input');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Google Analytics timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter((value): value is AbortSignal => Boolean(value));
		const merged = AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const onAbort = () => rejectAbort(merged.reason instanceof Error ? merged.reason : new Error('Google Analytics request was aborted'));
		merged.addEventListener('abort', onAbort, { once: true });
		let finish!: () => void;
		const activeCall = {
			abort: () => local.abort(new Error('Google Analytics client is closed')),
			done: new Promise<void>((resolve) => {
				finish = resolve;
			}),
		};
		active.add(activeCall);
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const request = runtime.call({ params: { service }, body: { toolName, input: parsedInput.data } }, { signal: merged });
			void Promise.resolve(request).catch(() => undefined);
			if (merged.aborted) onAbort();
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Google Analytics request timed out')), timeoutMs);
			const parsedOutput = GoogleAnalyticsServiceContract[toolName]['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid Google Analytics response');
			return parsedOutput.data as GoogleAnalyticsServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: IGoogleAnalyticsService = {
		type: 'google-analytics',
		readOnly: true,
		listAccountSummaries: (input, callOptions) => call('listAccountSummaries', input, callOptions),
		getProperty: (input, callOptions) => call('getProperty', input, callOptions),
		getMetadata: (input, callOptions) => call('getMetadata', input, callOptions),
		runReport: (input, callOptions) => call('runReport', input, callOptions),
		runRealtimeReport: (input, callOptions) => call('runRealtimeReport', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Google Analytics client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => (entry.abort(), entry.done))).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
