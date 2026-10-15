import type { ApiType } from '../../schema/ApiType';
import type { GenerateMessageProcessor } from './processor';
import type { GenerateMessageDiagnostic, GenerateMessageRequest } from './types';

export type GenerateMessageAdapterPhase = 'request' | 'response' | 'stream' | 'error';

export interface GenerateMessageAdapterContext {
	/** Protocol of the client-facing side. */
	readonly source: ApiType;
	/** Protocol of the upstream side. */
	readonly target: ApiType;
	phase: GenerateMessageAdapterPhase;
	/** Model resolved from the request body or endpoint path; codecs that carry the model in the path read it here. */
	model?: string;
	/** Decoded request, available to response, stream and error phases of the same exchange. */
	request?: GenerateMessageRequest;
	/** Shared state for one exchange, across processors and phases. */
	readonly state: Map<string | symbol, unknown>;
	readonly diagnostics: GenerateMessageDiagnostic[];
	readonly signal?: AbortSignal;
	/** Records a conversion diagnostic and notifies processors; a processor may throw to reject it. */
	report(diagnostic: GenerateMessageDiagnostic): void;
	/** Creates an identifier for generated objects; prefix such as `chatcmpl`, `resp`, `msg`, `call`. */
	generateId(prefix: string): string;
	/** Current time in Unix seconds. */
	now(): number;
}

export interface CreateGenerateMessageAdapterContextOptions {
	source: ApiType;
	target: ApiType;
	model?: string;
	signal?: AbortSignal;
	processors?: readonly GenerateMessageProcessor[];
	generateId?: (prefix: string) => string;
	now?: () => number;
}

function defaultGenerateId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function createGenerateMessageAdapterContext({
	source,
	target,
	model,
	signal,
	processors = [],
	generateId = defaultGenerateId,
	now = () => Math.floor(Date.now() / 1000),
}: CreateGenerateMessageAdapterContextOptions): GenerateMessageAdapterContext {
	const diagnostics: GenerateMessageDiagnostic[] = [];
	const ctx: GenerateMessageAdapterContext = {
		source,
		target,
		phase: 'request',
		model,
		state: new Map(),
		diagnostics,
		signal,
		report(diagnostic) {
			diagnostics.push(diagnostic);
			for (const processor of processors) processor.onDiagnostic?.(diagnostic, ctx);
		},
		generateId,
		now,
	};
	return ctx;
}
