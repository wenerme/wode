import type { ApiType } from '../../schema/ApiType';
import type { GenerateMessageCodec, GenerateMessageWireError } from './codec';
import {
	type CreateGenerateMessageAdapterContextOptions,
	createGenerateMessageAdapterContext,
	type GenerateMessageAdapterContext,
} from './context';
import { type GenerateMessageProcessor, sortGenerateMessageProcessors } from './processor';
import { getGenerateMessageCodec } from './registry';
import type { GenerateMessage, GenerateMessageError, GenerateMessagePart, GenerateMessageStreamEvent } from './types';

export interface CreateGenerateMessageAdapterOptions
	extends Omit<CreateGenerateMessageAdapterContextOptions, 'processors'> {
	processors?: readonly GenerateMessageProcessor[];
	/** Codec lookup; defaults to the built-in codecs. */
	getCodec?: (api: ApiType) => GenerateMessageCodec | undefined;
}

export interface GenerateMessageStreamAdapter {
	/** Converts one decoded upstream event to zero or more client events. */
	push(event: unknown): unknown[];
	/** Flushes buffered state after the upstream stream ends. */
	end(): unknown[];
}

/**
 * Converts one exchange from the client protocol (`source`) to the upstream protocol (`target`) and back.
 * Create one adapter per exchange; its context carries state from the request to the response or stream.
 */
export interface GenerateMessageAdapter {
	readonly context: GenerateMessageAdapterContext;
	request(wire: unknown): Promise<{ body: unknown; path?: string }>;
	response(wire: unknown): Promise<unknown>;
	stream(): GenerateMessageStreamAdapter;
	/** Accepts an upstream envelope or a local error already expressed in the common model. */
	error(error: { status?: number; body: unknown } | GenerateMessageError): Promise<GenerateMessageWireError>;
}

function requireCodec(getCodec: CreateGenerateMessageAdapterOptions['getCodec'], api: ApiType): GenerateMessageCodec {
	const codec = getCodec?.(api) ?? getGenerateMessageCodec(api);
	if (!codec) throw new Error(`No GenerateMessage codec for ${api}`);
	return codec;
}

export function createGenerateMessageAdapter({
	processors: allProcessors = [],
	getCodec,
	...options
}: CreateGenerateMessageAdapterOptions): GenerateMessageAdapter {
	const sourceCodec = requireCodec(getCodec, options.source);
	const targetCodec = requireCodec(getCodec, options.target);
	const processors: GenerateMessageProcessor[] = [];
	const ctx = createGenerateMessageAdapterContext({ ...options, processors });
	processors.push(...sortGenerateMessageProcessors(allProcessors).filter((p) => p.enabled?.(ctx) ?? true));

	const applyParts = (
		parts: GenerateMessagePart[],
		direction: 'request' | 'response',
		path: string,
	): GenerateMessagePart[] => {
		let current = parts;
		for (const processor of processors) {
			if (!processor.onPart) continue;
			current = current.flatMap((part, index) => {
				const next = processor.onPart?.(part, ctx, { direction, path: `${path}[${index}]` });
				if (next === undefined) return [part];
				if (next === null) return [];
				return Array.isArray(next) ? next : [next];
			});
		}
		return current;
	};
	const applyMessageParts = (messages: GenerateMessage[], direction: 'request' | 'response', path: string) =>
		messages.map((message, index) => ({
			...message,
			content: applyParts(message.content, direction, `${path}[${index}].content`),
		}));
	const hasPartHook = () => processors.some((p) => p.onPart);

	const applyStreamEvents = (events: GenerateMessageStreamEvent[]) => {
		let current = events;
		for (const processor of processors) {
			if (!processor.onStreamEvent) continue;
			current = current.flatMap((event) => {
				const next = processor.onStreamEvent?.(event, ctx);
				if (next === undefined) return [event];
				return Array.isArray(next) ? next : [next];
			});
		}
		return current;
	};

	return {
		context: ctx,
		async request(wire) {
			ctx.phase = 'request';
			let request = sourceCodec.decodeRequest(wire, ctx);
			ctx.model ??= request.model;
			if (hasPartHook()) {
				request = {
					...request,
					system: request.system && applyParts(request.system, 'request', 'system'),
					messages: applyMessageParts(request.messages, 'request', 'messages'),
				};
			}
			for (const processor of processors) request = (await processor.onRequest?.(request, ctx)) ?? request;
			ctx.request = request;
			ctx.model = request.model ?? ctx.model;
			let body: unknown = targetCodec.encodeRequest(request, ctx);
			for (const processor of processors) {
				if (processor.onUpstreamRequest) body = await processor.onUpstreamRequest(body, ctx);
			}
			return { body, path: targetCodec.requestPath?.(request, ctx) };
		},
		async response(wire) {
			ctx.phase = 'response';
			let response = targetCodec.decodeResponse(wire, ctx);
			if (hasPartHook()) {
				response = {
					...response,
					choices: response.choices.map((choice, index) => ({
						...choice,
						message: {
							...choice.message,
							content: applyParts(choice.message.content, 'response', `choices[${index}].message.content`),
						},
					})),
				};
			}
			for (const processor of processors) response = (await processor.onResponse?.(response, ctx)) ?? response;
			let body: unknown = sourceCodec.encodeResponse(response, ctx);
			for (const processor of processors) {
				if (processor.onDownstreamResponse) body = await processor.onDownstreamResponse(body, ctx);
			}
			return body;
		},
		stream() {
			ctx.phase = 'stream';
			const decoder = targetCodec.createStreamDecoder(ctx);
			const encoder = sourceCodec.createStreamEncoder(ctx);
			let ended = false;
			const encode = (events: GenerateMessageStreamEvent[]) => events.flatMap((event) => encoder.push(event));
			return {
				push(event) {
					if (ended) return [];
					return encode(applyStreamEvents(decoder.push(event)));
				},
				end() {
					if (ended) return [];
					ended = true;
					const out = encode(applyStreamEvents(decoder.end()));
					for (const processor of processors) {
						const tail = processor.onStreamEnd?.(ctx);
						if (tail) out.push(...encode(tail));
					}
					out.push(...encoder.end());
					return out;
				},
			};
		},
		async error(input) {
			ctx.phase = 'error';
			let error = 'kind' in input ? input : targetCodec.decodeError(input, ctx);
			for (const processor of processors) error = (await processor.onError?.(error, ctx)) ?? error;
			return sourceCodec.encodeError(error, ctx);
		},
	};
}
