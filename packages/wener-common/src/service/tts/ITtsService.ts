import type { TtsClient } from '@wener/client/tts';
import { defineServiceCapability } from '../registry/ServiceCapability';

export interface ITtsService extends TtsClient {
	readonly type: string;
	readonly readOnly: true;
}

export type TtsServiceClient = Pick<TtsClient, 'synthesize' | 'listVoices'>;

/** Capability key for `ITtsService`; `registry.load(TtsServiceCapability)` resolves to `ITtsService`. */
export const TtsServiceCapability = defineServiceCapability<ITtsService>('tts');
