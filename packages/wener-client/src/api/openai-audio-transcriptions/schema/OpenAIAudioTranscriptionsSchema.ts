import { z } from 'zod';

export const OpenAIAudioTranscriptionsRequestSchema = z.looseObject({
	model: z.string().min(1),
	file: z.file().meta({ type: 'string', format: 'binary' }),
	language: z.string().optional(),
	prompt: z.string().optional(),
	response_format: z.enum(['json', 'text', 'srt', 'verbose_json', 'vtt', 'diarized_json']).optional(),
	temperature: z.coerce.number().finite().min(0).max(1).optional(),
	stream: z
		.preprocess((value) => (value === 'true' ? true : value === 'false' ? false : value), z.boolean())
		.optional(),
	'timestamp_granularities[]': z.array(z.enum(['word', 'segment'])).optional(),
	include: z.array(z.string()).optional(),
});

export const OpenAITranscriptionSchema = z.looseObject({
	text: z.string(),
	language: z.string().optional(),
	duration: z.number().finite().optional(),
	segments: z
		.array(z.looseObject({ text: z.string(), start: z.number().finite(), end: z.number().finite() }))
		.optional(),
	words: z.array(z.looseObject({ word: z.string(), start: z.number().finite(), end: z.number().finite() })).optional(),
});

export const OpenAIAudioTranscriptionsResponseSchema = z.union([OpenAITranscriptionSchema, z.string()]);
export const OpenAIAudioTranscriptionsStreamEventSchema = z.union([
	z.looseObject({ type: z.literal('transcript.text.delta'), delta: z.string() }),
	z.looseObject({ type: z.literal('transcript.text.done'), text: z.string() }),
	z.looseObject({
		type: z.literal('transcript.text.segment'),
		text: z.string(),
		start: z.number().finite(),
		end: z.number().finite(),
	}),
]);

export type OpenAIAudioTranscriptionsRequest = z.infer<typeof OpenAIAudioTranscriptionsRequestSchema>;
export type OpenAIAudioTranscriptionsResponse = z.infer<typeof OpenAIAudioTranscriptionsResponseSchema>;
export type OpenAIAudioTranscriptionsStreamEvent = z.infer<typeof OpenAIAudioTranscriptionsStreamEventSchema>;
export type OpenAITranscription = z.infer<typeof OpenAITranscriptionSchema>;
