import type { IModelService } from './IModelService';
import {
	ModelCapabilities,
	type ModelCapability,
	type ModelHandler,
	type ModelHandlers,
	type ModelInput,
	type ModelOptions,
	type ModelOutput,
	type ModelStreamPart,
} from './types';

/** Explicit handlers only; unsupported capabilities never fall back to message generation. */
export class ModelService implements IModelService {
	readonly capabilities: readonly ModelCapability[];
	readonly #handlers: Readonly<ModelHandlers>;

	constructor(handlers: ModelHandlers) {
		for (const key of Object.keys(handlers)) {
			if (!ModelCapabilities.includes(key as ModelCapability)) throw new Error('Unknown model capability');
		}
		this.#handlers = Object.freeze({ ...handlers });
		this.capabilities = Object.freeze(ModelCapabilities.filter((key) => typeof handlers[key] === 'function'));
	}

	generateContent(input: ModelInput<'message-generation'>, options?: ModelOptions<'message-generation'>) {
		return this.invoke('message-generation', input, options);
	}
	streamContent(
		input: ModelInput<'message-streaming'>,
		options: ModelOptions<'message-streaming'> = {},
	): ModelOutput<'message-streaming'> {
		const invoke = this.invoke('message-streaming', input, options);
		return {
			[Symbol.asyncIterator]() {
				let source: AsyncIterator<ModelStreamPart> | undefined;
				let closed = false;
				let pendingResolve: ((result: IteratorResult<ModelStreamPart>) => void) | undefined;
				return {
					next: async () => {
						if (closed) return { done: true, value: undefined };
						const active = (source ??= (await invoke)[Symbol.asyncIterator]());
						if (closed) {
							await active.return?.();
							return { done: true, value: undefined };
						}
						const result = active.next();
						const closedResult = new Promise<IteratorResult<ModelStreamPart>>((resolve) => {
							pendingResolve = resolve;
						});
						const value = await Promise.race([result, closedResult]);
						pendingResolve = undefined;
						options.signal?.throwIfAborted();
						return value;
					},
					return: async () => {
						closed = true;
						pendingResolve?.({ done: true, value: undefined });
						pendingResolve = undefined;
						const current = source;
						if (current?.return) await current.return();
						return { done: true, value: undefined };
					},
				};
			},
		};
	}
	embedding(input: ModelInput<'embedding'>, options?: ModelOptions<'embedding'>) {
		return this.invoke('embedding', input, options);
	}
	rerank(input: ModelInput<'rerank'>, options?: ModelOptions<'rerank'>) {
		return this.invoke('rerank', input, options);
	}
	generateImage(input: ModelInput<'image-generation'>, options?: ModelOptions<'image-generation'>) {
		return this.invoke('image-generation', input, options);
	}
	imageEdit(input: ModelInput<'image-edit'>, options?: ModelOptions<'image-edit'>) {
		return this.invoke('image-edit', input, options);
	}
	decide(input: ModelInput<'decision'>, options?: ModelOptions<'decision'>) {
		return this.invoke('decision', input, options);
	}
	countTokens(input: ModelInput<'token-count'>, options?: ModelOptions<'token-count'>) {
		return this.invoke('token-count', input, options);
	}

	async invoke<C extends ModelCapability>(
		capability: C,
		input: ModelInput<C>,
		options: ModelOptions<C> = {},
	): Promise<ModelOutput<C>> {
		if (!this.capabilities.includes(capability)) throw new Error(`Unsupported model capability: ${capability}`);
		const handler = this.#handlers[capability] as ModelHandler<C> | undefined;
		if (!handler) throw new Error(`Unsupported model capability: ${capability}`);
		options.signal?.throwIfAborted();
		const output = await handler(input, options);
		options.signal?.throwIfAborted();
		return output;
	}
}
