import type { TtsClient } from '@wener/client/tts';
import type { ITtsService } from '../ITtsService';

/** The registry owns this service and closes its source client exactly once. */
export function createTtsService(client: TtsClient, type: string): ITtsService {
	return {
		type,
		readOnly: true,
		synthesize: (input, options) => client.synthesize(input, options),
		listVoices: (input, options) => client.listVoices(input, options),
		close: () => client.close(),
	};
}
