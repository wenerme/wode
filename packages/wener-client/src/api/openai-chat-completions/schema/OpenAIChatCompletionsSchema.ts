import { z } from 'zod';

export const OpenAIChatTextContentPartSchema = z.looseObject({
	type: z.literal('text'),
	text: z.string(),
});

export const OpenAIChatImageContentPartSchema = z.looseObject({
	type: z.literal('image_url'),
	image_url: z.union([
		z.string(),
		z.looseObject({
			url: z.string(),
			detail: z.string().optional(),
		}),
	]),
});

export const OpenAIChatAudioContentPartSchema = z.looseObject({
	type: z.literal('input_audio'),
	input_audio: z.looseObject({ data: z.string(), format: z.string() }),
});
export const OpenAIChatFileContentPartSchema = z.looseObject({
	type: z.literal('file'),
	file: z.looseObject({
		file_data: z.string().optional(),
		file_id: z.string().optional(),
		filename: z.string().optional(),
	}),
});
export const OpenAIChatRefusalContentPartSchema = z.looseObject({ type: z.literal('refusal'), refusal: z.string() });

// Exact branches run first; this fallback preserves unknown and incomplete known parts.
const OpenAIChatUnknownContentPartSchema = z.looseObject({ type: z.string() });

export const OpenAIChatContentPartSchema = z.union([
	OpenAIChatTextContentPartSchema,
	OpenAIChatImageContentPartSchema,
	OpenAIChatAudioContentPartSchema,
	OpenAIChatFileContentPartSchema,
	OpenAIChatRefusalContentPartSchema,
	OpenAIChatUnknownContentPartSchema,
]);

export const OpenAIChatFunctionToolSchema = z.looseObject({
	type: z.literal('function'),
	function: z.looseObject({
		name: z.string(),
		description: z.string().optional(),
		parameters: z.unknown().optional(),
		strict: z.boolean().nullish(),
	}),
});

export const OpenAIChatCustomToolSchema = z.looseObject({
	type: z.literal('custom'),
	custom: z.looseObject({ name: z.string(), description: z.string().optional(), format: z.unknown().optional() }),
});
// Exact branches run first; this fallback preserves unknown and incomplete tool definitions.
const OpenAIChatToolFallbackSchema = z.looseObject({ type: z.string() });
export const OpenAIChatToolSchema = z.union([
	OpenAIChatFunctionToolSchema,
	OpenAIChatCustomToolSchema,
	OpenAIChatToolFallbackSchema,
]);

export const OpenAIChatAllowedToolsSchema = z.looseObject({
	mode: z.string().describe('Tool choice mode'),
	tools: z.array(z.looseObject({})).describe('Allowed tools'),
});

export const OpenAIChatAllowedToolsChoiceSchema = z.looseObject({
	type: z.literal('allowed_tools'),
	allowed_tools: OpenAIChatAllowedToolsSchema,
});

export const OpenAIChatToolChoiceSchema = z.union([
	z.string(),
	z.looseObject({
		type: z.literal('function'),
		function: z.looseObject({ name: z.string() }),
	}),
	z.looseObject({ type: z.literal('custom'), custom: z.looseObject({ name: z.string() }) }),
	OpenAIChatAllowedToolsChoiceSchema,
	z.looseObject({ type: z.string() }),
]);

export const OpenAIChatFunctionCallSchema = z.looseObject({
	name: z.string(),
	arguments: z.string(),
});

export const OpenAIChatFunctionToolCallSchema = z.looseObject({
	id: z.string(),
	type: z.literal('function'),
	function: OpenAIChatFunctionCallSchema,
});

export const OpenAIChatCustomToolCallSchema = z.looseObject({
	id: z.string(),
	type: z.literal('custom'),
	custom: z.looseObject({ name: z.string(), input: z.string() }),
});
const OpenAIChatToolCallFallbackSchema = z.looseObject({ type: z.string() });
export const OpenAIChatToolCallSchema = z.union([
	OpenAIChatFunctionToolCallSchema,
	OpenAIChatCustomToolCallSchema,
	OpenAIChatToolCallFallbackSchema,
]);

export const OpenAIChatSystemMessageSchema = z.looseObject({
	role: z.literal('system'),
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema)]),
	name: z.string().optional(),
});

export const OpenAIChatDeveloperMessageSchema = z.looseObject({
	role: z.literal('developer'),
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema)]),
	name: z.string().optional(),
});

export const OpenAIChatUserMessageSchema = z.looseObject({
	role: z.literal('user'),
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema)]),
	name: z.string().optional(),
});

export const OpenAIChatAssistantMessageSchema = z.looseObject({
	role: z.literal('assistant'),
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema), z.null()]).optional(),
	name: z.string().optional(),
	refusal: z.string().nullish(),
	tool_calls: z.array(OpenAIChatToolCallSchema).nullish(),
	function_call: OpenAIChatFunctionCallSchema.nullish(),
});

export const OpenAIChatFunctionMessageSchema = z.looseObject({
	role: z.literal('function'),
	content: z.string().nullable(),
	name: z.string(),
});

export const OpenAIChatToolMessageSchema = z.looseObject({
	role: z.literal('tool'),
	tool_call_id: z.string(),
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema)]),
});

// Exact role branches run first; this fallback preserves unknown and incomplete known messages.
const OpenAIChatUnknownMessageSchema = z.looseObject({ role: z.string() });

export const OpenAIChatMessageSchema = z.union([
	OpenAIChatSystemMessageSchema,
	OpenAIChatDeveloperMessageSchema,
	OpenAIChatUserMessageSchema,
	OpenAIChatAssistantMessageSchema,
	OpenAIChatToolMessageSchema,
	OpenAIChatFunctionMessageSchema,
	OpenAIChatUnknownMessageSchema,
]);

export const OpenAIChatStreamOptionsSchema = z.looseObject({
	include_usage: z.boolean().optional(),
	include_obfuscation: z.boolean().optional(),
});

export const OpenAIChatCompletionsRequestSchema = z.looseObject({
	model: z.string().describe('Model identifier'),
	messages: z.array(OpenAIChatMessageSchema).min(1).describe('Conversation messages'),
	stream: z.boolean().nullish(),
	stream_options: OpenAIChatStreamOptionsSchema.nullish(),
	tools: z.array(OpenAIChatToolSchema).optional().describe('Tool definitions'),
	tool_choice: OpenAIChatToolChoiceSchema.optional().describe('Tool choice'),
	functions: z.array(OpenAIChatFunctionToolSchema.shape.function).optional(),
	function_call: z.union([z.string(), z.looseObject({ name: z.string() })]).optional(),
	parallel_tool_calls: z.boolean().nullish(),
	temperature: z.number().finite().nullish().describe('Sampling temperature'),
	top_p: z.number().finite().nullish(),
	frequency_penalty: z.number().finite().nullish(),
	presence_penalty: z.number().finite().nullish(),
	logit_bias: z.record(z.string(), z.number().finite()).nullish(),
	logprobs: z.boolean().nullish(),
	top_logprobs: z.number().multipleOf(1).nullish(),
	max_tokens: z.number().multipleOf(1).nullish().describe('Maximum output tokens'),
	max_completion_tokens: z.number().multipleOf(1).nullish().describe('Maximum output tokens including reasoning'),
	n: z.number().multipleOf(1).nullish(),
	stop: z.union([z.string(), z.array(z.string())]).nullish(),
	seed: z.number().multipleOf(1).nullish(),
	response_format: z.unknown().optional(),
	reasoning_effort: z.string().nullish(),
	verbosity: z.string().nullish(),
	user: z.string().nullish(),
});

export const OpenAIChatCompletionUsageSchema = z.looseObject({
	prompt_tokens: z.number().multipleOf(1).describe('Input token count'),
	completion_tokens: z.number().multipleOf(1).describe('Output token count'),
	total_tokens: z.number().multipleOf(1).describe('Total token count'),
	prompt_tokens_details: z.looseObject({}).nullish(),
	completion_tokens_details: z.looseObject({}).nullish(),
});

export const OpenAIChatCompletionChoiceSchema = z.looseObject({
	index: z.number().multipleOf(1),
	message: OpenAIChatMessageSchema,
	finish_reason: z.string().nullable().describe('Finish reason'),
	logprobs: z.unknown().optional(),
});

export const OpenAIChatCompletionsResponseSchema = z.looseObject({
	id: z.string(),
	object: z.string().min(1),
	created: z.number().multipleOf(1),
	model: z.string(),
	choices: z.array(OpenAIChatCompletionChoiceSchema),
	usage: OpenAIChatCompletionUsageSchema.optional(),
});

export const OpenAIChatCompletionDeltaToolCallSchema = z.looseObject({
	index: z.number().multipleOf(1),
	id: z.string().optional(),
	type: z.string().optional(),
	custom: z.looseObject({ name: z.string().optional(), input: z.string().optional() }).optional(),
	function: z
		.looseObject({
			name: z.string().optional(),
			arguments: z.string().optional(),
		})
		.optional(),
});

export const OpenAIChatCompletionDeltaSchema = z.looseObject({
	function_call: OpenAIChatFunctionCallSchema.partial().optional(),
	role: z.string().optional(),
	content: z.string().nullable().optional(),
	refusal: z.string().nullable().optional(),
	tool_calls: z.array(OpenAIChatCompletionDeltaToolCallSchema).optional(),
});

export const OpenAIChatCompletionChunkChoiceSchema = z.looseObject({
	index: z.number().multipleOf(1),
	delta: OpenAIChatCompletionDeltaSchema,
	finish_reason: z.string().nullish().describe('Finish reason'),
	logprobs: z.unknown().optional(),
});

export const OpenAIChatCompletionsChunkSchema = z.looseObject({
	id: z.string(),
	object: z.string().min(1),
	created: z.number().multipleOf(1),
	model: z.string(),
	choices: z.array(OpenAIChatCompletionChunkChoiceSchema),
	usage: OpenAIChatCompletionUsageSchema.nullable().optional(),
});

/** Streaming failures use an error envelope without a completion choices array. */
export const OpenAIChatCompletionsStreamErrorSchema = z.looseObject({
	error: z.looseObject({
		message: z.string(),
		type: z.string().nullish(),
		code: z.string().nullish(),
		param: z.string().nullish(),
	}),
});

export const OpenAIChatCompletionsStreamEventSchema = z.union([
	OpenAIChatCompletionsChunkSchema,
	OpenAIChatCompletionsStreamErrorSchema,
]);

export type OpenAIChatTextContentPart = z.infer<typeof OpenAIChatTextContentPartSchema>;
export type OpenAIChatImageContentPart = z.infer<typeof OpenAIChatImageContentPartSchema>;
export type OpenAIChatAudioContentPart = z.infer<typeof OpenAIChatAudioContentPartSchema>;
export type OpenAIChatFileContentPart = z.infer<typeof OpenAIChatFileContentPartSchema>;
export type OpenAIChatRefusalContentPart = z.infer<typeof OpenAIChatRefusalContentPartSchema>;
export type OpenAIChatCustomTool = z.infer<typeof OpenAIChatCustomToolSchema>;
export type OpenAIChatTool = z.infer<typeof OpenAIChatToolSchema>;
export type OpenAIChatFunctionToolCall = z.infer<typeof OpenAIChatFunctionToolCallSchema>;
export type OpenAIChatFunctionCall = z.infer<typeof OpenAIChatFunctionCallSchema>;
export type OpenAIChatCustomToolCall = z.infer<typeof OpenAIChatCustomToolCallSchema>;
export type OpenAIChatContentPart = z.infer<typeof OpenAIChatContentPartSchema>;
export type OpenAIChatFunctionTool = z.infer<typeof OpenAIChatFunctionToolSchema>;
export type OpenAIChatToolChoice = z.infer<typeof OpenAIChatToolChoiceSchema>;
export type OpenAIChatAllowedTools = z.infer<typeof OpenAIChatAllowedToolsSchema>;
export type OpenAIChatAllowedToolsChoice = z.infer<typeof OpenAIChatAllowedToolsChoiceSchema>;
export type OpenAIChatFunctionMessage = z.infer<typeof OpenAIChatFunctionMessageSchema>;
export type OpenAIChatToolCall = z.infer<typeof OpenAIChatToolCallSchema>;
export type OpenAIChatMessage = z.infer<typeof OpenAIChatMessageSchema>;
export type OpenAIChatStreamOptions = z.infer<typeof OpenAIChatStreamOptionsSchema>;
export type OpenAIChatCompletionsRequest = z.infer<typeof OpenAIChatCompletionsRequestSchema>;
export type OpenAIChatCompletionUsage = z.infer<typeof OpenAIChatCompletionUsageSchema>;
export type OpenAIChatCompletionChoice = z.infer<typeof OpenAIChatCompletionChoiceSchema>;
export type OpenAIChatCompletionsResponse = z.infer<typeof OpenAIChatCompletionsResponseSchema>;
export type OpenAIChatCompletionDeltaToolCall = z.infer<typeof OpenAIChatCompletionDeltaToolCallSchema>;
export type OpenAIChatCompletionDelta = z.infer<typeof OpenAIChatCompletionDeltaSchema>;
export type OpenAIChatCompletionChunkChoice = z.infer<typeof OpenAIChatCompletionChunkChoiceSchema>;
export type OpenAIChatCompletionsChunk = z.infer<typeof OpenAIChatCompletionsChunkSchema>;
export type OpenAIChatCompletionsStreamEvent = z.infer<typeof OpenAIChatCompletionsStreamEventSchema>;
