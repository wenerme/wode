import type { GenerateMessageAdapterContext } from './context';
import type {
	GenerateMessageDiagnostic,
	GenerateMessageError,
	GenerateMessagePart,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
} from './types';

type Awaitable<T> = T | Promise<T>;

/**
 * Hooks into one adapter exchange. Processors run by descending `priority`, then registration order.
 * Returning `undefined` keeps the current value. Throwing aborts the exchange.
 *
 * Request order: decode source → `onPart` (request messages) → `onRequest` → encode target → `onUpstreamRequest`.
 * Response order: decode target → `onPart` (choice messages) → `onResponse` → encode source → `onDownstreamResponse`.
 * Stream order: decode target event → `onStreamEvent` → encode source event; `onStreamEnd` runs before the encoder flushes.
 * Error order: decode target error → `onError` → encode source error.
 */
export interface GenerateMessageProcessor {
	readonly name: string;
	readonly priority?: number;
	/** Evaluated once per exchange after the context is created. */
	enabled?(ctx: GenerateMessageAdapterContext): boolean;
	/** Rewrites one part; return an array to split, `null` to remove. Does not run on stream deltas. */
	onPart?(
		part: GenerateMessagePart,
		ctx: GenerateMessageAdapterContext,
		meta: { direction: 'request' | 'response'; path: string },
	): GenerateMessagePart | GenerateMessagePart[] | null | undefined;
	onRequest?(
		request: GenerateMessageRequest,
		ctx: GenerateMessageAdapterContext,
	): Awaitable<GenerateMessageRequest | undefined | void>;
	/** Final target wire body, for JSON patch style rewrites. */
	onUpstreamRequest?(wire: unknown, ctx: GenerateMessageAdapterContext): Awaitable<unknown>;
	onResponse?(
		response: GenerateMessageResponse,
		ctx: GenerateMessageAdapterContext,
	): Awaitable<GenerateMessageResponse | undefined | void>;
	/** Final source wire body returned to the client. */
	onDownstreamResponse?(wire: unknown, ctx: GenerateMessageAdapterContext): Awaitable<unknown>;
	/** Rewrites one stream event; return an array to insert or split, `[]` to drop. */
	onStreamEvent?(
		event: GenerateMessageStreamEvent,
		ctx: GenerateMessageAdapterContext,
	): GenerateMessageStreamEvent | GenerateMessageStreamEvent[] | undefined | void;
	/** Emits trailing events before the source encoder flushes. */
	onStreamEnd?(ctx: GenerateMessageAdapterContext): GenerateMessageStreamEvent[] | undefined | void;
	onError?(
		error: GenerateMessageError,
		ctx: GenerateMessageAdapterContext,
	): Awaitable<GenerateMessageError | undefined | void>;
	/** Observes conversion diagnostics; throw to turn a diagnostic into a failure. */
	onDiagnostic?(diagnostic: GenerateMessageDiagnostic, ctx: GenerateMessageAdapterContext): void;
}

export function sortGenerateMessageProcessors(
	processors: readonly GenerateMessageProcessor[],
): GenerateMessageProcessor[] {
	return processors
		.map((processor, order) => ({ processor, order }))
		.sort((a, b) => (b.processor.priority ?? 0) - (a.processor.priority ?? 0) || a.order - b.order)
		.map(({ processor }) => processor);
}

export class GenerateMessageDiagnosticError extends Error {
	readonly diagnostic: GenerateMessageDiagnostic;
	constructor(diagnostic: GenerateMessageDiagnostic) {
		super(`${diagnostic.code} at ${diagnostic.path}: ${diagnostic.message}`);
		this.name = 'GenerateMessageDiagnosticError';
		this.diagnostic = diagnostic;
	}
}

/** Fails the exchange on selected diagnostics; by default any dropped or lossy conversion. */
export function strictProcessor({
	codes = ['drop', 'lossy', 'invalid'],
}: {
	codes?: readonly GenerateMessageDiagnostic['code'][];
} = {}): GenerateMessageProcessor {
	return {
		name: 'strict',
		onDiagnostic(diagnostic) {
			if (codes.includes(diagnostic.code)) throw new GenerateMessageDiagnosticError(diagnostic);
		},
	};
}

/** Fills request fields that are absent from the source request, for targets that require them. */
export function defaultRequestProcessor(
	defaults: Partial<Pick<GenerateMessageRequest, 'maxOutputTokens' | 'temperature' | 'model'>>,
): GenerateMessageProcessor {
	return {
		name: 'default-request',
		onRequest(request, ctx) {
			const next = { ...request };
			for (const [key, value] of Object.entries(defaults) as [keyof typeof defaults, never][]) {
				if (value === undefined || next[key] !== undefined) continue;
				next[key] = value;
				ctx.report({ code: 'default', path: key, message: `default ${key} applied` });
			}
			return next;
		},
	};
}
