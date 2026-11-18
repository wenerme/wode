import { type TtsRequest, validateEdgeTtsRequest, validateOpenAiTtsRequest } from '@wener/client/tts';
import { EdgeTtsServiceOptionsSchema, OpenAiTtsServiceOptionsSchema } from './config';
import { TtsRequestSchema } from './input';

/** Validate selected-provider capabilities using static options only, before any host I/O. */
export function preflightTtsRequest(provider: string, input: TtsRequest, options?: unknown): TtsRequest {
	try {
		const request = TtsRequestSchema.safeParse(input);
		if (!request.success) throw new Error();
		if (provider === 'edge-tts' || provider === 'edge') {
			const parsed = EdgeTtsServiceOptionsSchema.safeParse(options === undefined ? {} : options);
			if (!parsed.success) throw new Error();
			validateEdgeTtsRequest(request.data, parsed.data.voice);
			return request.data;
		}
		if (provider === 'openai-tts' || provider === 'openai-speech') {
			const parsed = OpenAiTtsServiceOptionsSchema.safeParse(options === undefined ? {} : options);
			if (!parsed.success) throw new Error();
			return validateOpenAiTtsRequest(request.data, { model: parsed.data.model, voice: parsed.data.voice });
		}
		return request.data;
	} catch {
		throw new TypeError('Invalid TTS request or configuration');
	}
}
