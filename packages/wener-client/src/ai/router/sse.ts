import { createParser, type EventSourceMessage } from 'eventsource-parser';
import type { GenerateMessageAdapter } from '../../api/generate-message/adapter';
import { getGenerateMessageCodec } from '../../api/generate-message/adapter/registry';
import type { GenerateMessageError } from '../../api/generate-message/adapter/types';
import { ApiType } from '../../api/schema/ApiType';

const encoder = new TextEncoder();

function frame(api: ApiType, value: unknown): Uint8Array {
	const type = value && typeof value === 'object' && 'type' in value ? value.type : undefined;
	const named = api === ApiType.AnthropicMessages || api === ApiType.OpenAIResponses;
	const event = named && typeof type === 'string' ? `event: ${type}\n` : '';
	return encoder.encode(`${event}data: ${JSON.stringify(value)}\n\n`);
}

/** Decodes bytes incrementally, retaining UTF-8 characters and SSE framing across chunk boundaries. */
async function* readEvents(body: ReadableStream<Uint8Array>, maxBufferSize: number, signal: AbortSignal) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	const abort = () => void reader.cancel().catch(() => {});
	signal.addEventListener('abort', abort, { once: true });
	if (signal.aborted) abort();
	let pending: EventSourceMessage[] = [];
	const parser = createParser({
		maxBufferSize,
		onEvent: (event) => pending.push(event),
		onError(error) {
			if (error.type === 'max-buffer-size-exceeded') throw error;
		},
	});
	try {
		while (true) {
			const { value, done } = await reader.read();
			parser.feed(decoder.decode(value, { stream: !done }));
			const events = pending;
			pending = [];
			for (const event of events) yield event;
			if (done) break;
		}
	} finally {
		signal.removeEventListener('abort', abort);
		await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}

export function createAiRouterStream({
	adapter,
	body,
	maxBufferSize,
	signal,
	onCancel,
	onError,
	state,
}: {
	adapter: GenerateMessageAdapter;
	body: ReadableStream<Uint8Array>;
	maxBufferSize: number;
	signal: AbortSignal;
	onCancel(): void;
	onError(error: unknown): Promise<void>;
	state: { finished: boolean; error?: GenerateMessageError };
}): ReadableStream<Uint8Array> {
	const source = adapter.context.source;
	const transform = adapter.stream();
	async function* convert() {
		try {
			let done = false;
			for await (const event of readEvents(body, maxBufferSize, signal)) {
				signal.throwIfAborted();
				if (event.data === '[DONE]') {
					done = true;
					break;
				}
				if (!event.data) continue;
				const value: unknown = JSON.parse(event.data);
				for (const output of transform.push(value)) yield frame(source, output);
				if (state.error) {
					const failure = new Error(state.error.message);
					// Google's SDK ignores native error data, so also fail the Fetch body.
					if (source === ApiType.GoogleGenerativeAI) throw failure;
					await onError(failure);
					return;
				}
			}
			signal.throwIfAborted();
			if (!state.finished && !done) throw new Error('Upstream stream ended before protocol completion');
			for (const output of transform.end()) yield frame(source, output);
			if (source === ApiType.OpenAIChatCompletions) yield encoder.encode('data: [DONE]\n\n');
		} catch (error) {
			if (signal.aborted) throw error;
			await onError(error);
			if (source === ApiType.GoogleGenerativeAI) throw error;
			const wireError = await adapter.error({ kind: 'server', status: 502, message: 'Upstream stream failed' });
			const codec = getGenerateMessageCodec(source);
			if (!codec) throw error;
			const commonError = codec.decodeError(wireError, adapter.context);
			for (const output of codec.createStreamEncoder(adapter.context).push({ type: 'error', error: commonError })) {
				yield frame(source, output);
			}
		}
	}
	const iterator = convert();
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const { value, done } = await iterator.next();
				if (done) controller.close();
				else controller.enqueue(value);
			} catch (error) {
				controller.error(error);
			}
		},
		async cancel() {
			onCancel();
			if (!body.locked) await body.cancel().catch(() => {});
			await iterator.return(undefined);
		},
	});
}
