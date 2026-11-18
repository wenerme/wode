import { isDryRunBypass } from '../../runtime/dryRun';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import { isPowerDnsWriteRequest } from '@wener/client/powerdns';
import {
	PowerDnsServiceContract, PowerDnsWriteOperations,
	type PowerDnsServiceInputs, type PowerDnsServiceOutputs, type PowerDnsServiceCallOptions,
} from '../PowerDnsServiceContract';
import type { IPowerDnsService } from '../IPowerDnsService';

export async function createPowerDnsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IPowerDnsService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<K extends keyof PowerDnsServiceInputs>(toolName: K, input: PowerDnsServiceInputs[K], callOptions?: PowerDnsServiceCallOptions): Promise<PowerDnsServiceOutputs[K]> {
		if (closed) throw new Error('PowerDNS client is closed');
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('PowerDNS operation unavailable');
		const parsedInput = PowerDnsServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid PowerDNS input');
		if (
			PowerDnsWriteOperations.has(toolName) &&
			(toolName !== 'request' || isPowerDnsWriteRequest(parsedInput.data as PowerDnsServiceInputs['request'])) &&
			options.readOnly !== false &&
			!isDryRunBypass(schema.tools[toolName]?.annotations?.supportsDryRun, input)
		)
			throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid PowerDNS timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('PowerDNS request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('PowerDNS client is closed')),
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
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('PowerDNS request timed out')), timeoutMs);
			const parsedOutput = PowerDnsServiceContract[toolName]['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid PowerDNS response');
			return parsedOutput.data as PowerDnsServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: IPowerDnsService = {
		type: 'powerdns', readOnly: options.readOnly ?? true,
		listServer: (input, callOptions) => call('listServer', input ?? {}, callOptions),
		getServer: (input, callOptions) => call('getServer', input ?? {}, callOptions),
		listServerStatistic: (input, callOptions) => call('listServerStatistic', input ?? {}, callOptions),
		searchData: (input, callOptions) => call('searchData', input, callOptions),
		createPowerDnsZone: (input, callOptions) => call('createPowerDnsZone', input, callOptions),
		notifyZone: (input, callOptions) => call('notifyZone', input, callOptions),
		retrieveZoneAxfr: (input, callOptions) => call('retrieveZoneAxfr', input, callOptions),
		listMetadata: (input, callOptions) => call('listMetadata', input, callOptions),
		getMetadata: (input, callOptions) => call('getMetadata', input, callOptions),
		setMetadata: (input, callOptions) => call('setMetadata', input, callOptions),
		deleteMetadata: (input, callOptions) => call('deleteMetadata', input, callOptions),
		listCryptokey: (input, callOptions) => call('listCryptokey', input, callOptions),
		getCryptokey: (input, callOptions) => call('getCryptokey', input, callOptions),
		createCryptokey: (input, callOptions) => call('createCryptokey', input, callOptions),
		updateCryptokey: (input, callOptions) => call('updateCryptokey', input, callOptions),
		deleteCryptokey: (input, callOptions) => call('deleteCryptokey', input, callOptions),
		listTsigKey: (input, callOptions) => call('listTsigKey', input ?? {}, callOptions),
		getTsigKey: (input, callOptions) => call('getTsigKey', input, callOptions),
		createTsigKey: (input, callOptions) => call('createTsigKey', input, callOptions),
		updateTsigKey: (input, callOptions) => call('updateTsigKey', input, callOptions),
		deleteTsigKey: (input, callOptions) => call('deleteTsigKey', input, callOptions),
		request: (input, callOptions) => call('request', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('PowerDNS client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
