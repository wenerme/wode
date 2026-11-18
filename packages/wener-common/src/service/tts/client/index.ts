import type { TtsRequest, TtsVoiceList, TtsVoiceQuery } from '@wener/client/tts';
import { createRemoteServiceToolClient } from '../../runtime/createServiceToolClient';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import { TtsVoiceListSchema } from '../input';
import type { TtsServiceClient } from '../ITtsService';
import { decodeTtsAudio } from '../transport';

/** Restore binary audio for the CLI; runtime lifecycle belongs to its caller. */
export async function createTtsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<TtsServiceClient> {
	const remote = await createRemoteServiceToolClient<{
		synthesize(input: TtsRequest, options?: ServiceCallOptions): Promise<unknown>;
		listVoices(input: TtsVoiceQuery, options?: ServiceCallOptions): Promise<unknown>;
	}>(runtime, service, options);
	return {
		synthesize: async (input, callOptions) => decodeTtsAudio(await remote.synthesize(input, callOptions)),
		listVoices: async (input = {}, callOptions): Promise<TtsVoiceList> => {
			const result = TtsVoiceListSchema.safeParse(await remote.listVoices(input, callOptions));
			if (!result.success) throw new TypeError('Invalid TTS voice list');
			return result.data;
		},
	};
}
