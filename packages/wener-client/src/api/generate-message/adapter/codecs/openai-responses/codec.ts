import type {
	OpenAIResponsesRequest,
	OpenAIResponsesResponse,
	OpenAIResponsesStreamEvent,
} from '../../../../openai-responses/schema';
import type { GenerateMessageCodec } from '../../codec';
import { API, decodeError, decodeRequest, decodeResponse, encodeError, encodeRequest, encodeResponse } from './mapping';
import { createStreamDecoder, createStreamEncoder } from './stream';

export const OpenAIResponsesCodec: GenerateMessageCodec<
	OpenAIResponsesRequest,
	OpenAIResponsesResponse,
	OpenAIResponsesStreamEvent
> = {
	api: API,
	decodeRequest,
	encodeRequest,
	decodeResponse,
	encodeResponse,
	decodeError,
	encodeError,
	createStreamDecoder,
	createStreamEncoder,
};
