import type { TtsClient } from '@wener/client/tts';
import type { ITtsService } from '../ITtsService';
import { TtsAudioSchema, TtsVoiceListSchema } from '../input';

/** The registry owns this service and closes its source client exactly once. */
export function createTtsService(client: TtsClient, type: string): ITtsService {
	const callOptions = (options: { signal?: AbortSignal } | undefined) => options === undefined ? undefined : { signal: options.signal };
	return {
		type,
		readOnly: true,
		async synthesize(input, options) {
			const result = TtsAudioSchema.safeParse(await client.synthesize(input, callOptions(options)));
			if (!result.success) throw new TypeError('Invalid TTS audio');
			return result.data;
		},
		async listVoices(input, options) {
			const result = TtsVoiceListSchema.safeParse(await client.listVoices(input, callOptions(options)));
			if (!result.success) throw new TypeError('Invalid TTS voice list');
			return result.data;
		},
		close: () => client.close(),
	};
}
