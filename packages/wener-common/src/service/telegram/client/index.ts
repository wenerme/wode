import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import { isTelegramWriteMethod, type ITelegramService } from '../ITelegramService';
import {
	TelegramServiceContract, TelegramServiceWireContract, TelegramWriteOperations,
	type TelegramOperationName, type TelegramServiceCallOptions,
} from '../TelegramServiceContract';
import {
	decodeTelegramDownloadFile, encodeTelegramSendDocument, encodeTelegramSendPhoto,
} from '../transport';

function toWireInput(name: TelegramOperationName, input: unknown): unknown {
	if (name === 'sendPhoto') return encodeTelegramSendPhoto(input as never);
	if (name === 'sendDocument') return encodeTelegramSendDocument(input as never);
	const parsed = TelegramServiceContract[name]['~orpc'].inputSchema!.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid Telegram service input');
	return parsed.data;
}

function fromWireOutput(name: TelegramOperationName, output: unknown): unknown {
	const parsed = TelegramServiceWireContract[name]['~orpc'].outputSchema!.safeParse(output);
	if (!parsed.success) throw new TypeError('Invalid Telegram service response');
	if (name === 'downloadFile') return decodeTelegramDownloadFile(parsed.data);
	return parsed.data;
}

export async function createTelegramServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<ITelegramService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const controller = new AbortController();
	const active = new Set<Promise<void>>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call(name: TelegramOperationName, input: unknown, callOptions?: TelegramServiceCallOptions): Promise<unknown> {
		if (closed) throw new Error('Telegram client is closed');
		controller.signal.throwIfAborted();
		options.signal?.throwIfAborted();
		callOptions?.signal?.throwIfAborted();
		const wireInput = toWireInput(name, input);
		if (!Object.hasOwn(schema.tools, name)) throw new Error('Telegram operation unavailable');
		const isWrite = name === 'request' || name === 'requestRead'
			? isTelegramWriteMethod((wireInput as { method: string }).method)
			: TelegramWriteOperations.has(name);
		if (name === 'requestRead' && isWrite) throw new Error('Telegram method is not read-only');
		if (name !== 'requestRead' && isWrite && options.readOnly !== false) throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.context?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Telegram timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter((value): value is AbortSignal => Boolean(value));
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Telegram request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Telegram request timed out')), timeoutMs);
		let finish!: () => void;
		const done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(done);
		try {
			const request = runtime.call({ params: { service }, body: { toolName: name, input: wireInput } }, { signal: merged });
			void request.catch(() => undefined);
			if (merged.aborted) onAbort();
			return fromWireOutput(name, await Promise.race([request, aborted]));
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(done);
			finish();
		}
	}
	const methods = Object.fromEntries(
		(Object.keys(TelegramServiceContract) as TelegramOperationName[]).map((name) => [
			name,
			(input: unknown, callOptions?: TelegramServiceCallOptions) => call(name, input, callOptions),
		]),
	) as unknown as Omit<ITelegramService, 'type' | 'readOnly' | 'close' | typeof Symbol.asyncDispose>;
	const client: ITelegramService = {
		...methods,
		type: 'telegram',
		readOnly: options.readOnly ?? true,
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Telegram client is closed'));
			closePromise = Promise.allSettled([...active]).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() { await client.close(); },
	};
	return client;
}
