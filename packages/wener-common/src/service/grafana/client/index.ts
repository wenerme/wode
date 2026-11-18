import { isDryRunBypass } from '../../runtime/dryRun';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import {
	GrafanaServiceContract, GrafanaWriteOperations,
	type GrafanaServiceInputs, type GrafanaServiceOutputs, type GrafanaServiceCallOptions,
} from '../GrafanaServiceContract';
import type { IGrafanaService } from '../index';

export async function createGrafanaServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IGrafanaService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<K extends keyof GrafanaServiceInputs>(toolName: K, input: GrafanaServiceInputs[K], callOptions?: GrafanaServiceCallOptions): Promise<GrafanaServiceOutputs[K]> {
		if (closed) throw new Error('Grafana client is closed');
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Grafana operation unavailable');
		const parsedInput = GrafanaServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid Grafana input');
		if (
			GrafanaWriteOperations.has(toolName) &&
			options.readOnly !== false &&
			!isDryRunBypass(schema.tools[toolName]?.annotations?.supportsDryRun, input)
		)
			throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Grafana timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Grafana request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('Grafana client is closed')),
			done: Promise.resolve(),
		};
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(activeCall);
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const request = runtime.call({ params: { service }, body: { toolName, input: parsedInput.data } }, { signal: merged });
			void request.catch(() => undefined);
			if (merged.aborted) onAbort();
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Grafana request timed out')), timeoutMs);
			const parsedOutput = GrafanaServiceContract[toolName]['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid Grafana response');
			return parsedOutput.data as GrafanaServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: IGrafanaService = {
		type: 'grafana', readOnly: options.readOnly ?? true,
		health: (input, callOptions) => call('health', input, callOptions),
		whoami: (input, callOptions) => call('whoami', input, callOptions),
		request: (input, callOptions) => call('request', input, callOptions),
		listDashboard: (input, callOptions) => call('listDashboard', input ?? {}, callOptions),
		getDashboard: (input, callOptions) => call('getDashboard', input, callOptions),
		updateDashboard: (input, callOptions) => call('updateDashboard', input, callOptions),
		listPanel: (input, callOptions) => call('listPanel', input, callOptions),
		getPanel: (input, callOptions) => call('getPanel', input, callOptions),
		patchPanel: (input, callOptions) => call('patchPanel', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Grafana client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
