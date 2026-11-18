import {
	generateMessage,
	type MessageGenerationOptions,
	type MessageGenerationRequest,
	type MessageGenerationTarget,
} from '@wener/client/ai/message-generation';
import { ModelService } from './ModelService';
import type { ModelStreamPart } from './types';

export interface MessageGenerationModelServiceOptions {
	model: string;
	target: MessageGenerationTarget;
	/** Optional message-generation client implementation. */
	generate?: typeof generateMessage;
}

export class MessageGenerationModelService extends ModelService {
	constructor({ model, target, generate = generateMessage }: MessageGenerationModelServiceOptions) {
		const destination = { ...target, headers: { ...target.headers } };
		super({
			'message-generation': (input, options) =>
				generate({ ...input, model, target: destination, stream: false }, options),
			'message-streaming': (input, options) =>
				streamMessages(generate, { ...input, model, target: destination, stream: true }, options),
		});
	}
}

/** Convert the existing executor's incremental callback without duplicating codecs or transport. */
function streamMessages(
	generate: typeof generateMessage,
	request: MessageGenerationRequest,
	options: MessageGenerationOptions,
): AsyncIterable<ModelStreamPart> {
	return {
		[Symbol.asyncIterator]() {
			const controller = new AbortController();
			const pending: ModelStreamPart[] = [];
			let waiter:
				| { resolve: (result: IteratorResult<ModelStreamPart>) => void; reject: (error: unknown) => void }
				| undefined;
			let finished = false;
			let failure: unknown;
			let closed = false;
			const settle = () => {
				if (!waiter) return;
				const current = waiter;
				waiter = undefined;
				if (failure !== undefined) current.reject(failure);
				else if (pending.length) current.resolve({ done: false, value: pending.shift()! });
				else if (finished || closed) current.resolve({ done: true, value: undefined });
			};
			const abort = () => {
				if (!controller.signal.aborted) controller.abort(options.signal?.reason);
				if (!failure) failure = controller.signal.reason ?? new Error('Message generation stream aborted');
				finished = true;
				settle();
			};
			options.signal?.throwIfAborted();
			options.signal?.addEventListener('abort', abort, { once: true });
			void Promise.resolve()
				.then(() => {
					controller.signal.throwIfAborted();
					return generate(request, {
						...options,
						signal: controller.signal,
						onText: (delta) => {
							controller.signal.throwIfAborted();
							options.onText?.(delta);
							pending.push({ type: 'text-delta', delta });
							settle();
						},
					});
				})
				.then(
					(result) => {
						if (closed) return;
						pending.push({ type: 'finish', result });
						finished = true;
						settle();
					},
					(error) => {
						if (closed) return;
						failure = error;
						finished = true;
						settle();
					},
				);
			return {
				next(): Promise<IteratorResult<ModelStreamPart>> {
					controller.signal.throwIfAborted();
					if (pending.length) return Promise.resolve({ done: false, value: pending.shift()! });
					if (failure !== undefined) return Promise.reject(failure);
					if (finished || closed) return Promise.resolve({ done: true, value: undefined });
					return new Promise((resolve, reject) => {
						waiter = { resolve, reject };
					});
				},
				return(): Promise<IteratorResult<ModelStreamPart>> {
					closed = true;
					finished = true;
					pending.length = 0;
					options.signal?.removeEventListener('abort', abort);
					controller.abort();
					settle();
					return Promise.resolve({ done: true, value: undefined });
				},
			};
		},
	};
}
