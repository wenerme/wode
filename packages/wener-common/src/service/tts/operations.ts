import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { TtsToolInputs, TtsVoiceListSchema } from './input';
import { TtsTools } from './tools';
import { encodeTtsAudio } from './transport';

export const TtsOperations = {
	synthesize: defineServiceOperation({
		capability: 'tts',
		tool: TtsTools.synthesize,
		input: TtsToolInputs.synthesize,
		invoke: async (service, input, options) => encodeTtsAudio(await service.synthesize(input, options)),
	}),
	listVoices: defineServiceOperation({
		capability: 'tts',
		tool: TtsTools.listVoices,
		input: TtsToolInputs.listVoices,
		invoke: async (service, input, options) => {
			const parsed = TtsVoiceListSchema.safeParse(await service.listVoices(input, options));
			if (!parsed.success) throw new TypeError('Invalid TTS voice list');
			return parsed.data;
		},
	}),
};
