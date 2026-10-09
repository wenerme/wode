import { z } from 'zod';

const OpenAICompletionPromptSchema = z.union([
	z.string(),
	z.array(z.string()),
	z.array(z.number().int()),
	z.array(z.array(z.number().int())),
]);

/** OpenAI Legacy Completions 请求；保留未知字段以兼容上游扩展参数。 */
export const OpenAICompletionsRequestSchema = z.looseObject({
	model: z.string().min(1),
	prompt: OpenAICompletionPromptSchema,
	best_of: z.number().int().positive().optional(),
	echo: z.boolean().optional(),
	frequency_penalty: z.number().finite().optional(),
	logit_bias: z.record(z.string(), z.number()).optional(),
	logprobs: z.number().int().nonnegative().nullable().optional(),
	max_tokens: z.number().int().nonnegative().optional(),
	n: z.number().int().positive().optional(),
	presence_penalty: z.number().finite().optional(),
	seed: z.number().int().optional(),
	stop: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
	stream: z.boolean().optional(),
	suffix: z.string().nullable().optional(),
	temperature: z.number().finite().optional(),
	top_p: z.number().finite().optional(),
	user: z.string().optional(),
});

export type OpenAICompletionsRequest = z.infer<typeof OpenAICompletionsRequestSchema>;

export const OpenAICompletionsResponseSchema = z.unknown();
