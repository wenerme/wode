import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import {
	OpenObserveServiceContract,
	OpenObserveWriteOperations,
	type OpenObserveServiceCallOptions,
	type OpenObserveServiceInputs,
	type OpenObserveServiceOutputs,
} from '../OpenObserveServiceContract';
import type { IOpenObserveService } from '../IOpenObserveService';

export type OpenObserveServiceToolClientOptions = ServiceCallOptions & { readOnly?: boolean };

/**
 * Create the typed remote OpenObserve client. Contract schemas validate both the request and
 * response; this client retains OpenObserve-specific readOnly, timeout, abort and close rules.
 */
export async function createOpenObserveServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: OpenObserveServiceToolClientOptions = {},
): Promise<IOpenObserveService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;

	async function call<K extends keyof OpenObserveServiceInputs>(
		toolName: K,
		input: OpenObserveServiceInputs[K],
		callOptions?: OpenObserveServiceCallOptions,
	): Promise<OpenObserveServiceOutputs[K]> {
		if (closed) throw new Error('OpenObserve client is closed');
		options.signal?.throwIfAborted();
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('OpenObserve operation unavailable');
		const procedure = OpenObserveServiceContract[toolName];
		const parsedInput = procedure['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid OpenObserve input');
		if (OpenObserveWriteOperations.has(toolName) && options.readOnly !== false)
			throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid OpenObserve timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('OpenObserve request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = { abort: () => local.abort(new Error('OpenObserve client is closed')), done: Promise.resolve() };
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(activeCall);
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const request = runtime.call(
				{ params: { service }, body: { toolName, input: parsedInput.data } },
				{ signal: merged },
			);
			void request.catch(() => undefined);
			if (merged.aborted) onAbort();
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('OpenObserve request timed out')), timeoutMs);
			const parsedOutput = procedure['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid OpenObserve response');
			return parsedOutput.data as OpenObserveServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}

	const client: IOpenObserveService = {
		type: 'openobserve',
		readOnly: options.readOnly ?? true,
		health: (input, callOptions) => call('health', input ?? {}, callOptions),
		status: (input, callOptions) => call('status', input ?? {}, callOptions),
		listStreams: (input, callOptions) => call('listStreams', input ?? {}, callOptions),
		getStreamSchema: (input, callOptions) => call('getStreamSchema', input, callOptions),
		search: (input, callOptions) => call('search', input, callOptions),
		listTraces: (input, callOptions) => call('listTraces', input, callOptions),
		getStreamSettings: (input, callOptions) => call('getStreamSettings', input, callOptions),
		updateStreamSettings: (input, callOptions) => call('updateStreamSettings', input, callOptions),
		deleteStream: (input, callOptions) => call('deleteStream', input, callOptions),
		ingestJson: (input, callOptions) => call('ingestJson', input, callOptions),
		ingestMulti: (input, callOptions) => call('ingestMulti', input, callOptions),
		getValues: (input, callOptions) => call('getValues', input, callOptions),
		searchAround: (input, callOptions) => call('searchAround', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('OpenObserve client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
