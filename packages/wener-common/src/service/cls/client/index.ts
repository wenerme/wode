import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import {
	TencentClsServiceContract,
	type TencentClsServiceCallOptions,
	type TencentClsServiceInputs,
	type TencentClsServiceOutputs,
} from '../TencentClsServiceContract';
import type { ITencentClsService } from '../ITencentClsService';

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

	async function call<K extends keyof TencentClsServiceInputs>(
		toolName: K,
		input: TencentClsServiceInputs[K],
		callOptions?: TencentClsServiceCallOptions,
	): Promise<TencentClsServiceOutputs[K]> {
		if (closed) throw new Error('Tencent CLS client is closed');
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Tencent CLS operation unavailable');
		const procedure = TencentClsServiceContract[toolName];
		const parsedInput = procedure['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid Tencent CLS input');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Tencent CLS timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Tencent CLS request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('Tencent CLS client is closed')),
			done: Promise.resolve(),
		};
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
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Tencent CLS request timed out')), timeoutMs);
			const parsedOutput = procedure['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid Tencent CLS response');
			return parsedOutput.data as TencentClsServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}

	const client: ITencentClsService = {
		type: 'cls',
		readOnly: true,
		query: (input, callOptions) => call('query', input, callOptions),
		listTopic: (input = {}, callOptions) => call('listTopic', input, callOptions),
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
