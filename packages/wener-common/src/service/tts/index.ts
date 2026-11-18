export type {
	TtsAudio,
	TtsAudioFormat,
	TtsCallOptions,
	TtsClient,
	TtsRequest,
	TtsVoice,
	TtsVoiceList,
	TtsVoiceQuery,
} from '@wener/client/tts';
export { createTtsServiceToolClient } from './client';
export * from './config';
export {
	TtsServiceContract,
	TtsServiceWireContract,
	TtsSynthesizeOutputSchema,
	TtsStaticServiceContract,
	TtsTools,
	TtsSynthesizeWireOutputSchema,
} from './TtsServiceContract';
export type {
	ITtsServiceContract,
	TtsServiceCallOptions,
	TtsServiceClientContext,
	TtsServiceInputs,
	TtsServiceOutputs,
	TtsServiceWireOutputs,
	ITtsServiceWireContract,
} from './TtsServiceContract';
export { createTtsService } from './server';
export * from './input';
export type { ITtsService, TtsServiceClient } from './ITtsService';
export { TtsOperations } from './operations';
export { preflightTtsRequest } from './preflight';
export * from './transport';
export { TtsServiceCapability } from './ITtsService';
