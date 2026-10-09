import { z } from 'zod';

export const OpenAIAudioSpeechRequestSchema = z.looseObject({
	model: z.string().min(1),
	input: z.string().min(1),
	voice: z.union([z.string().min(1), z.looseObject({ id: z.string().min(1) })]),
	response_format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).optional(),
	speed: z.number().finite().min(0.25).max(4).optional(),
	instructions: z.string().optional(),
	stream_format: z.enum(['sse', 'audio']).optional(),
});

/** 音频响应在 fetch 中通过 blob()/arrayBuffer() 读取，不按 JSON message 校验。 */
export const OpenAIAudioSpeechResponseSchema = z
	.union([z.instanceof(Blob), z.instanceof(ArrayBuffer), z.instanceof(Uint8Array)])
	.meta({ type: 'string', format: 'binary' });

export const OpenAIAudioSpeechStreamEventSchema = z.union([
	z.looseObject({ type: z.literal('speech.audio.delta'), audio: z.string() }),
	z.looseObject({ type: z.literal('speech.audio.done'), usage: z.looseObject({}).optional() }),
]);

export type OpenAIAudioSpeechRequest = z.infer<typeof OpenAIAudioSpeechRequestSchema>;
export type OpenAIAudioSpeechResponse = z.infer<typeof OpenAIAudioSpeechResponseSchema>;
export type OpenAIAudioSpeechStreamEvent = z.infer<typeof OpenAIAudioSpeechStreamEventSchema>;
