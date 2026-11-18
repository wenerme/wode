import { defineServiceCapability } from '../registry/ServiceCapability';
import type { ITtsServiceContract } from './TtsServiceContract';

/** The typed local service is derived from the native contract, including its Uint8Array output. */
export interface ITtsService extends ITtsServiceContract {
	readonly type: string;
	readonly readOnly: true;
	close(): Promise<void>;
}

export type TtsServiceClient = ITtsServiceContract;

/** Capability key for `ITtsService`; `registry.load(TtsServiceCapability)` resolves to `ITtsService`. */
export const TtsServiceCapability = defineServiceCapability<ITtsService>('tts');
