import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { OpenObserveRequestOptions } from '@wener/client/openobserve';
import { OpenObserveWriteOperations } from '../OpenObserveContract';
import type { IOpenObserveService } from '../index';

export async function createOpenObserveServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IOpenObserveService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const controller = new AbortController();
	async function call<T>(toolName: string, input: unknown, callOptions?: OpenObserveRequestOptions): Promise<T> {
		controller.signal.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('OpenObserve operation unavailable');
		if (OpenObserveWriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const timeout = callOptions?.timeoutMs;
		if (timeout !== undefined && (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 3_600_000)) throw new TypeError('Invalid OpenObserve timeout');
		const deadline = new AbortController();
		const signal = [controller.signal, deadline.signal, options.signal, callOptions?.signal].filter((value): value is AbortSignal => Boolean(value));
		const merged = AbortSignal.any(signal);
		const error = () => new Error(deadline.signal.aborted ? 'OpenObserve request timed out' : 'OpenObserve request was aborted');
		if (merged.aborted) throw error();
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const onAbort = () => rejectAbort(error());
		merged.addEventListener('abort', onAbort, { once: true });
		const timer = timeout === undefined ? undefined : setTimeout(() => deadline.abort(), timeout);
		try {
			const result = await Promise.race([runtime.call({ params: { service }, body: { toolName, input } }, { signal: merged }), aborted]);
			if (merged.aborted) throw error();
			return result as T;
		} finally {
			clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
		}
	}
	const client: IOpenObserveService = {
		type: 'openobserve',
		readOnly: options.readOnly ?? true,
		health: (callOptions) => call('health', {}, callOptions),
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
		async close() { controller.abort(new Error('OpenObserve client is closed')); },
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
