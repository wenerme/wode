import { z } from 'zod';
import { OpenAIChatStreamOptionsSchema } from '../../openai-chat-completions/schema/OpenAIChatCompletionsSchema';

const OpenAICompletionPromptSchema = z.union([
	z.string(),
	z.array(z.string()),
	z.array(z.number().multipleOf(1)),
	z.array(z.array(z.number().multipleOf(1))),
]);

/** OpenAI Legacy Completions 请求；保留未知字段以兼容上游扩展参数。 */
export const OpenAICompletionsRequestSchema = z.looseObject({
	model: z.string().describe('Model identifier'),
	prompt: OpenAICompletionPromptSchema.nullish().describe('Input prompt'),
	best_of: z.number().multipleOf(1).min(0).max(20).nullish().describe('Number of candidate generations'),
	echo: z.boolean().nullish().describe('Echo input'),
	frequency_penalty: z.number().min(-2).max(2).nullish(),
	logit_bias: z.record(z.string(), z.number().multipleOf(1)).nullish(),
	logprobs: z.number().multipleOf(1).min(0).max(5).nullish(),
	max_tokens: z.number().multipleOf(1).nonnegative().nullish().describe('Maximum output tokens'),
	n: z.number().multipleOf(1).min(1).max(128).nullish().describe('Number of candidates'),
	presence_penalty: z.number().min(-2).max(2).nullish(),
	seed: z.number().multipleOf(1).nullish(),
	stop: z
		.union([z.string(), z.array(z.string())])
		.nullish()
		.describe('Stop sequences'),
	stream: z.boolean().nullish().describe('Stream output'),
	stream_options: OpenAIChatStreamOptionsSchema.nullish(),
	suffix: z.string().nullish(),
	temperature: z.number().min(0).max(2).nullish().describe('Sampling temperature'),
	top_p: z.number().min(0).max(1).nullish().describe('Nucleus sampling probability'),
	user: z.string().optional().describe('User identifier'),
});

export type OpenAICompletionsRequest = z.infer<typeof OpenAICompletionsRequestSchema>;

export const OpenAICompletionsResponseSchema = z.unknown();
