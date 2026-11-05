import { z } from 'zod';
import type { ServiceTool } from '../runtime/types';
import { TtsAudioWireSchema, TtsToolInputs, TtsVoiceListSchema } from './input';

export const TtsTools = {
	synthesize: {
		description: 'Synthesize text into bounded audio encoded as Base64.',
		inputSchema: z.toJSONSchema(TtsToolInputs.synthesize),
		outputSchema: z.toJSONSchema(TtsAudioWireSchema),
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
	listVoices: {
		description: 'List available voices when supported by the provider.',
		inputSchema: z.toJSONSchema(TtsToolInputs.listVoices),
		outputSchema: z.toJSONSchema(TtsVoiceListSchema),
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
} satisfies Record<string, ServiceTool>;
