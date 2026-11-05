import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { ITencentClsService, TencentClsListTopicInput, TencentClsQueryInput } from '../ITencentClsService';

export async function createTencentClsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<ITencentClsService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<T>(toolName: string, input: unknown, callOptions?: { signal?: AbortSignal }): Promise<T> {
		if (closed) throw new Error('Tencent CLS client is closed');
		controller.signal.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Tencent CLS operation unavailable');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => (merged.reason instanceof Error ? merged.reason : new Error('Tencent CLS request was aborted'));
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('Tencent CLS client is closed')),
			done: Promise.resolve(),
		};
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(activeCall);
		const request = runtime.call({ params: { service }, body: { toolName, input } }, { signal: merged });
		void request.catch(() => undefined);
		if (merged.aborted) onAbort();
		try {
			return (await Promise.race([request, aborted])) as T;
		} finally {
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: ITencentClsService = {
		type: 'cls',
		readOnly: true,
		query: (input: TencentClsQueryInput, callOptions) => call('query', input, callOptions),
		listTopic: (input: TencentClsListTopicInput = {}, callOptions) => call('listTopic', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Tencent CLS client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
