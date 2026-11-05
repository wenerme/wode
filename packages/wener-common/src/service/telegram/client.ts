import type { TelegramRequestOptions } from '@wener/client/telegram';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../runtime/types';
import { TelegramWriteOperations } from './TelegramContract';
import type { ITelegramService } from './index';

export async function createTelegramServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<ITelegramService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<T>(toolName: string, input: unknown, callOptions?: TelegramRequestOptions): Promise<T> {
		if (closed) throw new Error('Telegram client is closed');
		controller.signal.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Telegram operation unavailable');
		if (TelegramWriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Telegram timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Telegram request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('Telegram client is closed')),
			done: Promise.resolve(),
		};
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(activeCall);
		const request = runtime.call({ params: { service }, body: { toolName, input } }, { signal: merged });
		void request.catch(() => undefined);
		if (merged.aborted) onAbort();
		const timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Telegram request timed out')), timeoutMs);
		try {
			return (await Promise.race([request, aborted])) as T;
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: ITelegramService = {
		type: 'telegram', readOnly: options.readOnly ?? true,
		getMe: (callOptions) => call('getMe', {}, callOptions),
		sendMessage: (input, callOptions) => call('sendMessage', input, callOptions),
		request: (method, params, callOptions) => call('request', { method, params }, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Telegram client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
