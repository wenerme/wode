import { TTS_MAX_AUDIO_BYTES, TTS_MAX_TEXT_BYTES, TTS_MEDIA_TYPES } from '@wener/client/tts';
import { z } from 'zod';

export { TTS_MAX_AUDIO_BYTES, TTS_MAX_TEXT_BYTES, TTS_MEDIA_TYPES } from '@wener/client/tts';
export const TTS_MAX_BASE64_LENGTH = Math.ceil(TTS_MAX_AUDIO_BYTES / 3) * 4;
export const TTS_MAX_VOICES = 10_000;
export const TtsAudioFormatSchema = z.enum(['mp3', 'wav', 'opus', 'aac', 'flac', 'pcm']);
const label = z.string().trim().min(1).max(256);
export const TtsRequestSchema = z.strictObject({
	text: z
		.string()
		.min(1)
		.max(TTS_MAX_TEXT_BYTES)
		.refine((v) => new TextEncoder().encode(v).length <= TTS_MAX_TEXT_BYTES, 'TTS text exceeds byte limit'),
	voice: label.optional(),
	model: label.optional(),
	format: TtsAudioFormatSchema.optional(),
	speed: z.number().finite().min(0.25).max(4).optional(),
	rate: z
		.string()
		.regex(/^[+-]\d{1,3}%$/u)
		.optional(),
	pitch: z
		.string()
		.regex(/^[+-]\d{1,3}Hz$/u)
		.optional(),
	volume: z
		.string()
		.regex(/^[+-]\d{1,3}%$/u)
		.optional(),
	instructions: z.string().max(TTS_MAX_TEXT_BYTES).optional(),
});
export const TtsVoiceQuerySchema = z.strictObject({ locale: label.optional(), query: z.string().max(256).optional() });
export const TtsVoiceSchema = z.strictObject({
	id: label,
	name: z.string().max(512).optional(),
	locale: label.optional(),
	gender: label.optional(),
});
export const TtsVoiceListSchema = z.strictObject({
	supported: z.boolean(),
	voices: z.array(TtsVoiceSchema).max(TTS_MAX_VOICES),
});
export const TtsAudioWireSchema = z
	.strictObject({
		audioBase64: z
			.string()
			.min(4)
			.max(TTS_MAX_BASE64_LENGTH)
			.regex(/^[A-Za-z0-9+/]*={0,2}$/u),
		format: TtsAudioFormatSchema,
		mediaType: z.string().max(64),
		voice: label.optional(),
		model: label.optional(),
		byteLength: z.number().int().min(1).max(TTS_MAX_AUDIO_BYTES),
	})
	.superRefine((value, context) => {
		if (value.mediaType !== TTS_MEDIA_TYPES[value.format])
			context.addIssue({ code: 'custom', message: 'Invalid TTS media type' });
		const padding = value.audioBase64.endsWith('==') ? 2 : value.audioBase64.endsWith('=') ? 1 : 0;
		if (value.audioBase64.length % 4 !== 0 || (value.audioBase64.length / 4) * 3 - padding !== value.byteLength)
			context.addIssue({ code: 'custom', message: 'Invalid TTS byte length' });
	});
export type TtsAudioWire = z.infer<typeof TtsAudioWireSchema>;
export const TtsToolInputs = { synthesize: TtsRequestSchema, listVoices: TtsVoiceQuerySchema };
