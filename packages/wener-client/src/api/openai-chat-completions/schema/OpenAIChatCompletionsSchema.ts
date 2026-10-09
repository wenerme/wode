import { z } from 'zod';

const wireString = z.string().min(1);
const knownContentPartTypes = new Set(['text', 'image_url', 'input_audio', 'file', 'refusal']);
const knownMessageRoles = new Set(['system', 'developer', 'user', 'assistant', 'tool']);

export const OpenAIChatTextContentPartSchema = z.looseObject({
	type: z.literal('text'),
	text: z.string(),
});

export const OpenAIChatImageContentPartSchema = z.looseObject({
	type: z.literal('image_url'),
	image_url: z.union([
		z.string().min(1),
		z.looseObject({
			url: z.string().min(1),
			detail: z.string().optional(),
		}),
	]),
});

export const OpenAIChatAudioContentPartSchema = z.looseObject({
	type: z.literal('input_audio'),
	input_audio: z.looseObject({ data: wireString, format: z.enum(['wav', 'mp3']) }),
});
export const OpenAIChatFileContentPartSchema = z.looseObject({
	type: z.literal('file'),
	file: z
		.looseObject({ file_data: wireString.optional(), file_id: wireString.optional(), filename: z.string().optional() })
		.refine((file) => file.file_id !== undefined || file.file_data !== undefined, 'files require file_id or file_data'),
});
export const OpenAIChatRefusalContentPartSchema = z.looseObject({ type: z.literal('refusal'), refusal: z.string() });

const OpenAIChatUnknownContentPartSchema = z
	.looseObject({ type: z.string().min(1) })
	.refine((part) => !knownContentPartTypes.has(part.type), 'known content parts must satisfy their wire schema');

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
		name: wireString,
		description: z.string().optional(),
		parameters: z.unknown().optional(),
		strict: z.boolean().optional(),
	}),
});

export const OpenAIChatCustomToolSchema = z.looseObject({
	type: z.literal('custom'),
	custom: z.looseObject({ name: wireString, description: z.string().optional(), format: z.unknown().optional() }),
});
export const OpenAIChatToolSchema = z.union([OpenAIChatFunctionToolSchema, OpenAIChatCustomToolSchema]);

export const OpenAIChatToolChoiceSchema = z.union([
	z.enum(['none', 'auto', 'required']),
	z.looseObject({
		type: z.literal('function'),
		function: z.looseObject({ name: wireString }),
	}),
	z.looseObject({ type: z.literal('custom'), custom: z.looseObject({ name: wireString }) }),
]);

export const OpenAIChatFunctionCallSchema = z.looseObject({
	name: wireString,
	arguments: z.string(),
});

export const OpenAIChatFunctionToolCallSchema = z.looseObject({
	id: wireString,
	type: z.literal('function'),
	function: OpenAIChatFunctionCallSchema,
});

export const OpenAIChatCustomToolCallSchema = z.looseObject({
	id: wireString,
	type: z.literal('custom'),
	custom: z.looseObject({ name: wireString, input: z.string() }),
});
export const OpenAIChatToolCallSchema = z.union([OpenAIChatFunctionToolCallSchema, OpenAIChatCustomToolCallSchema]);

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

export const OpenAIChatAssistantMessageSchema = z
	.looseObject({
		role: z.literal('assistant'),
		content: z.union([z.string(), z.array(OpenAIChatContentPartSchema), z.null()]).optional(),
		name: z.string().optional(),
		refusal: z.string().nullable().optional(),
		tool_calls: z.array(OpenAIChatToolCallSchema).optional(),
		function_call: OpenAIChatFunctionCallSchema.nullish(),
	})
	.refine(
		(message) =>
			message.content !== undefined ||
			message.refusal !== undefined ||
			message.tool_calls !== undefined ||
			message.function_call != null,
		'assistant messages require content, refusal, tool_calls, or function_call',
	);

export const OpenAIChatToolMessageSchema = z.looseObject({
	role: z.literal('tool'),
	tool_call_id: wireString,
	content: z.union([z.string(), z.array(OpenAIChatContentPartSchema)]),
});

const OpenAIChatUnknownMessageSchema = z
	.looseObject({ role: z.string().min(1) })
	.refine((message) => !knownMessageRoles.has(message.role), 'known message roles must satisfy their wire schema');

export const OpenAIChatMessageSchema = z.union([
	OpenAIChatSystemMessageSchema,
	OpenAIChatDeveloperMessageSchema,
	OpenAIChatUserMessageSchema,
	OpenAIChatAssistantMessageSchema,
	OpenAIChatToolMessageSchema,
	OpenAIChatUnknownMessageSchema,
]);

export const OpenAIChatStreamOptionsSchema = z.looseObject({
	include_usage: z.boolean().optional(),
	include_obfuscation: z.boolean().optional(),
});

export const OpenAIChatCompletionsRequestSchema = z.looseObject({
	model: wireString,
	messages: z.array(OpenAIChatMessageSchema).min(1),
	stream: z.boolean().optional(),
	stream_options: OpenAIChatStreamOptionsSchema.optional(),
	tools: z.array(OpenAIChatToolSchema).optional(),
	tool_choice: OpenAIChatToolChoiceSchema.optional(),
	functions: z.array(OpenAIChatFunctionToolSchema.shape.function).optional(),
	function_call: z.union([z.enum(['none', 'auto']), z.looseObject({ name: wireString })]).optional(),
	parallel_tool_calls: z.boolean().optional(),
	temperature: z.number().finite().optional(),
	top_p: z.number().finite().optional(),
	frequency_penalty: z.number().finite().optional(),
	presence_penalty: z.number().finite().optional(),
	logit_bias: z.record(z.string(), z.number().finite()).optional(),
	logprobs: z.boolean().optional(),
	top_logprobs: z.number().int().nonnegative().optional(),
	max_tokens: z.number().int().positive().optional(),
	max_completion_tokens: z.number().int().positive().optional(),
	n: z.number().int().positive().optional(),
	stop: z.union([z.string(), z.array(z.string())]).optional(),
	seed: z.number().int().optional(),
	response_format: z.unknown().optional(),
	reasoning_effort: z.string().min(1).optional(),
	verbosity: z.string().min(1).optional(),
	user: z.string().optional(),
});

export const OpenAIChatCompletionUsageSchema = z.looseObject({
	prompt_tokens: z.number().int().nonnegative(),
	completion_tokens: z.number().int().nonnegative(),
	total_tokens: z.number().int().nonnegative(),
	prompt_tokens_details: z.looseObject({}).optional(),
	completion_tokens_details: z.looseObject({}).optional(),
});

export const OpenAIChatCompletionChoiceSchema = z.looseObject({
	index: z.number().int().nonnegative(),
	message: OpenAIChatAssistantMessageSchema,
	finish_reason: z.string().nullable(),
	logprobs: z.unknown().optional(),
});

export const OpenAIChatCompletionsResponseSchema = z.looseObject({
	id: wireString,
	object: z.literal('chat.completion'),
	created: z.number().int().nonnegative(),
	model: wireString,
	choices: z.array(OpenAIChatCompletionChoiceSchema),
	usage: OpenAIChatCompletionUsageSchema.optional(),
});

export const OpenAIChatCompletionDeltaToolCallSchema = z.looseObject({
	index: z.number().int().nonnegative(),
	id: z.string().optional(),
	type: z.enum(['function', 'custom']).optional(),
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
	role: z.literal('assistant').optional(),
	content: z.string().nullable().optional(),
	refusal: z.string().nullable().optional(),
	tool_calls: z.array(OpenAIChatCompletionDeltaToolCallSchema).optional(),
});

export const OpenAIChatCompletionChunkChoiceSchema = z.looseObject({
	index: z.number().int().nonnegative(),
	delta: OpenAIChatCompletionDeltaSchema,
	finish_reason: z.string().nullable(),
	logprobs: z.unknown().optional(),
});

export const OpenAIChatCompletionsChunkSchema = z.looseObject({
	id: wireString,
	object: z.literal('chat.completion.chunk'),
	created: z.number().int().nonnegative(),
	model: wireString,
	choices: z.array(OpenAIChatCompletionChunkChoiceSchema),
	usage: OpenAIChatCompletionUsageSchema.nullable().optional(),
});

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
