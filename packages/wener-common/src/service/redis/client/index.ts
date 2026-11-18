import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { IRedisService } from '../IRedisService';
import {
	RedisServiceContract,
	type RedisServiceCallOptions,
	type RedisServiceInputs,
	type RedisServiceOutputs,
	type RedisServiceClient,
} from '../RedisServiceContract';

export type RedisServiceToolClientOptions = ServiceCallOptions & { readOnly?: boolean };

/**
 * Create the typed remote Redis service client. The contract validates both sides of the
 * transport; this client owns the Redis-specific default inputs and lifecycle/abort behavior.
 */
export async function createRedisServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: RedisServiceToolClientOptions = {},
): Promise<IRedisService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;

	async function call<K extends keyof RedisServiceInputs>(
		toolName: K,
		input: RedisServiceInputs[K],
		callOptions?: RedisServiceCallOptions,
	): Promise<RedisServiceOutputs[K]> {
		if (closed) throw new Error('Redis client is closed');
		options.signal?.throwIfAborted();
		controller.signal.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Redis operation unavailable');
		const procedure = RedisServiceContract[toolName];
		const parsedInput = procedure['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid Redis input');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Redis timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Redis request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = { abort: () => local.abort(new Error('Redis client is closed')), done: Promise.resolve() };
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
			timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Redis request timed out')), timeoutMs);
			const parsedOutput = procedure['~orpc'].outputSchema!.safeParse(await Promise.race([request, aborted]));
			if (!parsedOutput.success) throw new TypeError('Invalid Redis response');
			return parsedOutput.data as RedisServiceOutputs[K];
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}

	const client: IRedisService = {
		type: 'redis',
		product: 'unspecified',
		readOnly: true,
		keyPrefix: '',
		ping: (input, callOptions) => call('ping', input ?? {}, callOptions),
		get: (input, callOptions) => call('get', input, callOptions),
		getType: (input, callOptions) => call('getType', input, callOptions),
		getTtl: (input, callOptions) => call('getTtl', input, callOptions),
		scan: (input, callOptions) => call('scan', input ?? {}, callOptions),
		getHash: (input, callOptions) => call('getHash', input, callOptions),
		rangeStream: (input, callOptions) => call('rangeStream', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Redis client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}

export type { RedisServiceClient };
