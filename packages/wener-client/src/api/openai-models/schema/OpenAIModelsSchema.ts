import { z } from 'zod';

const wireString = z.string().min(1);

export const OpenAIModelSchema = z.looseObject({
	id: wireString,
	title: wireString.optional(),
	description: z.string().optional(),
	object: z.literal('model'),
	created: z.number().int().nonnegative(),
	owned_by: z.string(),
	apis: z.array(z.string()).optional(),
	inputs: z.union([z.array(z.string()), z.looseObject({})]).optional(),
	outputs: z.union([z.array(z.string()), z.looseObject({})]).optional(),
	reasoning: z
		.union([
			z.boolean(),
			z.looseObject({
				effort: z.array(z.string().min(1)).min(1).max(32).optional(),
			}),
		])
		.optional(),
	max_tokens: z.number().int().positive().optional(),
	max_input_tokens: z.number().int().positive().optional(),
	max_output_tokens: z.number().int().positive().optional(),
	thinking_level_map: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAIModelsRequestSchema = z.strictObject({});

export const OpenAIModelsResponseSchema = z.looseObject({
	object: z.literal('list'),
	data: z.array(OpenAIModelSchema),
});

export type OpenAIModel = z.infer<typeof OpenAIModelSchema>;
export type OpenAIModelsRequest = z.infer<typeof OpenAIModelsRequestSchema>;
export type OpenAIModelsResponse = z.infer<typeof OpenAIModelsResponseSchema>;
