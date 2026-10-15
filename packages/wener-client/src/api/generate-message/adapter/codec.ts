import type { ApiType } from '../../schema/ApiType';
import type { GenerateMessageAdapterContext } from './context';
import type {
	GenerateMessageError,
	GenerateMessageRequest,
	GenerateMessageResponse,
	GenerateMessageStreamEvent,
} from './types';

/** Incremental stream conversion. `end` flushes buffered state once the input stream finishes. */
export interface GenerateMessageStreamTransform<In, Out> {
	push(event: In): Out[];
	end(): Out[];
}

export interface GenerateMessageWireError {
	status: number;
	body: unknown;
}

/**
 * Converts one protocol's wire JSON to and from the common GenerateMessage model.
 *
 * Stream wire events are decoded SSE `data` payloads. SSE framing, `event:` names and
 * the Chat Completions `[DONE]` sentinel belong to the transport layer.
 */
export interface GenerateMessageCodec<Req = unknown, Res = unknown, Event = unknown> {
	readonly api: ApiType;
	decodeRequest(wire: Req, ctx: GenerateMessageAdapterContext): GenerateMessageRequest;
	encodeRequest(request: GenerateMessageRequest, ctx: GenerateMessageAdapterContext): Req;
	decodeResponse(wire: Res, ctx: GenerateMessageAdapterContext): GenerateMessageResponse;
	encodeResponse(response: GenerateMessageResponse, ctx: GenerateMessageAdapterContext): Res;
	createStreamDecoder(
		ctx: GenerateMessageAdapterContext,
	): GenerateMessageStreamTransform<Event, GenerateMessageStreamEvent>;
	createStreamEncoder(
		ctx: GenerateMessageAdapterContext,
	): GenerateMessageStreamTransform<GenerateMessageStreamEvent, Event>;
	decodeError(error: { status?: number; body: unknown }, ctx: GenerateMessageAdapterContext): GenerateMessageError;
	encodeError(error: GenerateMessageError, ctx: GenerateMessageAdapterContext): GenerateMessageWireError;
	/** Upstream path for an encoded request, for protocols that carry the model or stream mode in the path. */
	requestPath?(request: GenerateMessageRequest, ctx: GenerateMessageAdapterContext): string;
}
