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
export { EdgeTtsServiceProvider } from '../providers/edge-tts';
export { OpenAiTtsServiceProvider } from '../providers/openai-tts';
export { createTtsServiceToolClient } from './client';
export * from './config';
export { TtsServiceContract } from './contract';
export { createTtsService } from './createTtsService';
export * from './input';
export type { ITtsService, TtsServiceClient } from './ITtsService';
export { TtsOperations } from './operations';
export { preflightTtsRequest } from './preflight';
export { TtsTools } from './tools';
export * from './transport';
