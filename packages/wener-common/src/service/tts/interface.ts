import type { TtsClient } from '@wener/client/tts';

export interface ITtsService extends TtsClient {
	readonly type: string;
	readonly readOnly: true;
}

export type TtsServiceClient = Pick<TtsClient, 'synthesize' | 'listVoices'>;
