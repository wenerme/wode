import type { ServiceContract } from '../runtime/types';
import { TtsTools } from './tools';

export const TtsServiceContract: ServiceContract = {
	methods: {
		synthesize: {
			...TtsTools.synthesize,
			inputType:
				'{ text: string; voice?: string; format?: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; model?: string; speed?: number; rate?: string; pitch?: string; volume?: string; instructions?: string }',
			outputType:
				'{ audioBase64: string; format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; mediaType: string; voice?: string; model?: string; byteLength: number }',
		},
		listVoices: {
			...TtsTools.listVoices,
			inputType: '{ locale?: string; query?: string }',
			outputType:
				'{ supported: boolean; voices: Array<{ id: string; name?: string; locale?: string; gender?: string }> }',
		},
	},
};
