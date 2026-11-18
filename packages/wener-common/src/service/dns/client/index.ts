import { isDryRunBypass } from '../../runtime/dryRun';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import {
	DnsServiceContract, DnsWriteOperations,
	type DnsServiceInputs, type DnsServiceOutputs, type DnsServiceCallOptions,
} from '../DnsServiceContract';
import type { IDnsService } from '../IDnsService';

export async function createDnsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean; provider?: string } = {},
): Promise<IDnsService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<K extends keyof DnsServiceInputs>(toolName: K, input: DnsServiceInputs[K], callOptions?: DnsServiceCallOptions): Promise<DnsServiceOutputs[K]> {
		if (closed) throw new Error('DNS client is closed');
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('DNS operation unavailable');
		const parsedInput = DnsServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid DNS input');
		if (
			DnsWriteOperations.has(toolName) &&
			options.readOnly !== false &&
			!isDryRunBypass(schema.tools[toolName]?.annotations?.supportsDryRun, input)
		)
			throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid DNS timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('DNS request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('DNS client is closed')),
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
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('DNS request timed out')), timeoutMs);
			const parsedOutput = DnsServiceContract[toolName]['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid DNS response');
			return parsedOutput.data as DnsServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: IDnsService = {
		type: 'dns', provider: options.provider ?? 'unknown', readOnly: options.readOnly ?? true,
		listZone: (input, callOptions) => call('listZone', input ?? {}, callOptions),
		getZone: (input, callOptions) => call('getZone', input, callOptions),
		createZone: (input, callOptions) => call('createZone', input, callOptions),
		deleteZone: (input, callOptions) => call('deleteZone', input, callOptions),
		listRecord: (input, callOptions) => call('listRecord', input, callOptions),
		setRecord: (input, callOptions) => call('setRecord', input, callOptions),
		deleteRecord: (input, callOptions) => call('deleteRecord', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('DNS client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
