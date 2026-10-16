import { z } from 'zod';

export const OpenAIResponseTextContentPartSchema = z.looseObject({
	type: z.enum(['input_text', 'output_text', 'text']),
	text: z.string().describe('Text content'),
});

export const OpenAIResponseImageContentPartSchema = z
	.looseObject({
		type: z.enum(['input_image', 'image']),
		image_url: z.string().nullish().describe('Image URL'),
		file_id: z.string().nullish().describe('Uploaded file identifier'),
		detail: z.string().optional().describe('Image detail'),
	})
	.refine(
		(part) => part.image_url !== undefined || part.file_id !== undefined || part.detail !== undefined,
		'exact image parts require image_url, file_id, or detail',
	);

export const OpenAIResponseRefusalContentPartSchema = z.looseObject({
	type: z.literal('refusal'),
	refusal: z.string(),
});

// Exact branches run first; this fallback preserves unknown and incomplete known content parts.
const OpenAIResponseUnknownContentPartSchema = z.looseObject({ type: z.string() });

export const OpenAIResponseContentPartSchema = z.union([
	OpenAIResponseTextContentPartSchema,
	OpenAIResponseImageContentPartSchema,
	OpenAIResponseRefusalContentPartSchema,
	OpenAIResponseUnknownContentPartSchema,
]);

export const OpenAIResponseMessageItemSchema = z.looseObject({
	type: z.literal('message'),
	role: z.string().describe('Message role'),
	content: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]).describe('Message content'),
	status: z.string().optional().describe('Message status'),
});

/**
 * Responses 请求中的 message item 允许省略 type；pi 等兼容客户端会发送这种形式。
 * 响应 output 中的 message 仍要求显式 type，避免把响应协议校验放宽到无法识别的对象。
 */
export const OpenAIResponseInputMessageItemSchema = z.looseObject({
	type: z.literal('message').optional(),
	role: z.string().describe('Message role'),
	content: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]).describe('Message content'),
	status: z.string().optional().describe('Message status'),
});

export const OpenAIResponseFunctionToolSchema = z.looseObject({
	type: z.literal('function'),
	name: z.string().describe('Function name'),
	description: z.string().nullish().describe('Function description'),
	parameters: z.unknown().optional().describe('Parameter JSON Schema'),
	strict: z.boolean().nullish().describe('Strict parameter schema'),
});

export const OpenAIResponseCustomToolSchema = z.looseObject({
	type: z.literal('custom'),
	name: z.string(),
	description: z.string().optional(),
	format: z.unknown().optional(),
});

export const OpenAIResponseFileSearchToolSchema = z.looseObject({
	type: z.literal('file_search'),
	vector_store_ids: z.array(z.string()).describe('Vector store identifiers'),
	filters: z.unknown().optional().describe('Retrieval filters'),
	max_num_results: z.number().multipleOf(1).optional().describe('Maximum retrieval results'),
	ranking_options: z.looseObject({}).optional().describe('Result ranking options'),
});

export const OpenAIResponseCodeInterpreterToolSchema = z.looseObject({
	type: z.literal('code_interpreter'),
	container: z.union([
		z.string(),
		z.looseObject({
			type: z.literal('auto'),
			file_ids: z.array(z.string()).optional(),
			memory_limit: z.enum(['1g', '4g', '16g', '64g']).nullish(),
			network_policy: z.unknown().optional(),
		}),
	]),
});

const OpenAIResponseExtensionToolSchema = z.looseObject({ type: z.string() });

export const OpenAIResponseToolSchema = z.union([
	OpenAIResponseFunctionToolSchema,
	OpenAIResponseCustomToolSchema,
	OpenAIResponseFileSearchToolSchema,
	OpenAIResponseCodeInterpreterToolSchema,
	OpenAIResponseExtensionToolSchema,
]);

export const OpenAIResponseFunctionCallItemSchema = z.looseObject({
	type: z.literal('function_call'),
	call_id: z.string().describe('Tool call identifier'),
	name: z.string().describe('Invoked function name'),
	arguments: z.string().describe('JSON-encoded function arguments'),
	id: z.string().optional().describe('Response item identifier'),
	status: z.string().optional().describe('Call status'),
});

export const OpenAIResponseFunctionCallOutputItemSchema = z.looseObject({
	type: z.literal('function_call_output'),
	call_id: z.string().describe('Associated tool call identifier'),
	output: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]).describe('Tool output'),
	id: z.string().optional(),
	status: z.string().optional(),
});

export const OpenAIResponseFunctionCallOutputResourceSchema = OpenAIResponseFunctionCallOutputItemSchema.extend({
	call_id: z.string().optional().describe('Associated tool call identifier'),
});

export const OpenAIResponseReasoningItemSchema = z.looseObject({
	type: z.literal('reasoning'),
	id: z.string().optional(),
	summary: z.array(OpenAIResponseContentPartSchema).optional(),
	content: z.array(OpenAIResponseContentPartSchema).optional(),
	status: z.string().optional(),
});

// Exact branches run first; this fallback preserves unknown and incomplete known response items.
const OpenAIResponseUnknownItemSchema = z.looseObject({ type: z.string() });

export const OpenAIResponseCompactionItemSchema = z.looseObject({
	id: z.string(),
	type: z.literal('compaction'),
	encrypted_content: z.string(),
});

export const OpenAIResponseInputCompactionItemSchema = OpenAIResponseCompactionItemSchema.extend({
	id: z.string().nullish(),
});

export const OpenAIResponseInputItemReferenceSchema = z.looseObject({
	type: z.literal('item_reference').optional(),
	id: z.string().describe('Reused input item identifier'),
});

const OpenAIResponseInputUnknownItemSchema = OpenAIResponseUnknownItemSchema;

export const OpenAIResponseItemSchema = z.union([
	OpenAIResponseMessageItemSchema,
	OpenAIResponseFunctionCallItemSchema,
	OpenAIResponseFunctionCallOutputResourceSchema,
	OpenAIResponseReasoningItemSchema,
	OpenAIResponseCompactionItemSchema,
	OpenAIResponseUnknownItemSchema,
]);

export const OpenAIResponseInputItemSchema = z.union([
	OpenAIResponseInputMessageItemSchema,
	OpenAIResponseFunctionCallItemSchema,
	OpenAIResponseFunctionCallOutputItemSchema,
	OpenAIResponseFunctionCallOutputResourceSchema,
	OpenAIResponseReasoningItemSchema,
	OpenAIResponseInputCompactionItemSchema,
	OpenAIResponseInputItemReferenceSchema,
	OpenAIResponseInputUnknownItemSchema,
]);

export const OpenAIResponseToolChoiceSchema = z.union([
	z.string(),
	z.looseObject({
		type: z.literal('function'),
		name: z.string(),
	}),
	z.looseObject({ type: z.literal('custom'), name: z.string() }),
	z.looseObject({ type: z.string() }),
]);

export const OpenAIResponsesRequestSchema = z.looseObject({
	model: z.string().optional().describe('Model identifier'),
	input: z
		.union([z.string(), z.array(OpenAIResponseInputItemSchema)])
		.nullish()
		.describe('Text or input items'),
	previous_response_id: z.string().nullish().describe('Previous response identifier'),
	instructions: z.string().nullish().describe('System instructions'),
	tools: z.array(OpenAIResponseToolSchema).optional().describe('Available tools'),
	tool_choice: OpenAIResponseToolChoiceSchema.optional().describe('Tool choice strategy'),
	parallel_tool_calls: z.boolean().nullish().describe('Parallel tool calls allowed'),
	stream: z.boolean().nullish().describe('Stream response'),
	background: z.boolean().nullish().describe('Run in background'),
	max_output_tokens: z.number().multipleOf(1).nullish().describe('Maximum output tokens'),
	temperature: z.number().finite().nullish().describe('Sampling temperature'),
	top_p: z.number().finite().nullish().describe('Nucleus sampling threshold'),
	reasoning: z
		.looseObject({ effort: z.string().nullish(), summary: z.string().nullish() })
		.nullish()
		.describe('Reasoning settings'),
	text: z
		.looseObject({ format: z.unknown().optional(), verbosity: z.string().nullish() })
		.nullish()
		.describe('Text output settings'),
	metadata: z.record(z.string(), z.string()).nullish().describe('Additional request metadata'),
	user: z.string().nullish().describe('End-user identifier'),
});

// Input Tokens 请求是 Responses 请求的子集：不含 stream/max_output_tokens 等生成参数
export const OpenAIResponsesInputTokensRequestSchema = z.looseObject({
	model: z.string().nullish(),
	input: z.union([z.string(), z.array(OpenAIResponseInputItemSchema)]).nullish(),
	instructions: z.string().nullish(),
	tools: z.array(OpenAIResponseToolSchema).nullish(),
	tool_choice: OpenAIResponseToolChoiceSchema.nullish(),
	parallel_tool_calls: z.boolean().nullish(),
	reasoning: z.looseObject({ effort: z.string().nullish(), summary: z.string().nullish() }).nullish(),
	text: z.looseObject({ format: z.unknown().optional(), verbosity: z.string().nullish() }).nullish(),
});
export type OpenAIResponsesInputTokensRequest = z.infer<typeof OpenAIResponsesInputTokensRequestSchema>;

export const OpenAIResponsesInputTokensResponseSchema = z.looseObject({
	object: z.string().min(1),
	input_tokens: z.number().multipleOf(1),
});
export type OpenAIResponsesInputTokensResponse = z.infer<typeof OpenAIResponsesInputTokensResponseSchema>;

export const OpenAIResponseUsageSchema = z.looseObject({
	input_tokens: z.number().multipleOf(1).describe('Input token count'),
	output_tokens: z.number().multipleOf(1).describe('Output token count'),
	total_tokens: z.number().multipleOf(1).describe('Total token count'),
	input_tokens_details: z.looseObject({ cached_tokens: z.number().multipleOf(1) }).optional(),
	output_tokens_details: z.looseObject({ reasoning_tokens: z.number().multipleOf(1) }).optional(),
});

export const OpenAIResponseErrorSchema = z.looseObject({
	code: z.string().nullable().optional(),
	message: z.string(),
	param: z.string().nullable().optional(),
	type: z.string().optional(),
});

export const OpenAIResponsesResponseSchema = z.looseObject({
	id: z.string().describe('Response identifier'),
	object: z.string().min(1),
	created_at: z.number().finite().describe('Creation time, Unix seconds'),
	model: z.string().describe('Model identifier'),
	status: z.string().optional().describe('Response status'),
	output: z.array(OpenAIResponseItemSchema).describe('Output items'),
	usage: OpenAIResponseUsageSchema.nullable().optional().describe('Token usage'),
	error: OpenAIResponseErrorSchema.nullable().optional().describe('Request error'),
	incomplete_details: z.looseObject({}).nullable().optional().describe('Incomplete response reason'),
});

export const OpenAIResponseCreatedEventSchema = z.looseObject({
	type: z.literal('response.created'),
	sequence_number: z.number().multipleOf(1),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseInProgressEventSchema = z.looseObject({
	type: z.literal('response.in_progress'),
	sequence_number: z.number().multipleOf(1),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseOutputItemAddedEventSchema = z.looseObject({
	type: z.literal('response.output_item.added'),
	sequence_number: z.number().multipleOf(1),
	output_index: z.number().multipleOf(1),
	item: OpenAIResponseItemSchema,
});

export const OpenAIResponseOutputItemDoneEventSchema = z.looseObject({
	type: z.literal('response.output_item.done'),
	sequence_number: z.number().multipleOf(1),
	output_index: z.number().multipleOf(1),
	item: OpenAIResponseItemSchema,
});

export const OpenAIResponseContentPartAddedEventSchema = z.looseObject({
	type: z.literal('response.content_part.added'),
	sequence_number: z.number().multipleOf(1),
	item_id: z.string(),
	output_index: z.number().multipleOf(1),
	content_index: z.number().multipleOf(1),
	part: OpenAIResponseContentPartSchema,
});

export const OpenAIResponseContentPartDoneEventSchema = z.looseObject({
	type: z.literal('response.content_part.done'),
	sequence_number: z.number().multipleOf(1),
	item_id: z.string(),
	output_index: z.number().multipleOf(1),
	content_index: z.number().multipleOf(1),
	part: OpenAIResponseContentPartSchema,
});

export const OpenAIResponseOutputTextDeltaEventSchema = z.looseObject({
	type: z.literal('response.output_text.delta'),
	sequence_number: z.number().multipleOf(1),
	item_id: z.string(),
	output_index: z.number().multipleOf(1),
	content_index: z.number().multipleOf(1),
	delta: z.string(),
});

export const OpenAIResponseOutputTextDoneEventSchema = z.looseObject({
	type: z.literal('response.output_text.done'),
	sequence_number: z.number().multipleOf(1),
	item_id: z.string(),
	output_index: z.number().multipleOf(1),
	content_index: z.number().multipleOf(1),
	text: z.string(),
});

export const OpenAIResponseCompletedEventSchema = z.looseObject({
	type: z.literal('response.completed'),
	sequence_number: z.number().multipleOf(1),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseIncompleteEventSchema = z.looseObject({
	type: z.literal('response.incomplete'),
	sequence_number: z.number().multipleOf(1),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseFailedEventSchema = z.looseObject({
	type: z.literal('response.failed'),
	sequence_number: z.number().multipleOf(1),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseErrorEventSchema = z.looseObject({
	type: z.literal('error'),
	sequence_number: z.number().multipleOf(1),
	error: OpenAIResponseErrorSchema.optional(),
	code: z.string().nullable().optional(),
	message: z.string().optional(),
});

export const OpenAIResponseKnownStreamEventSchema = z.union([
	OpenAIResponseCreatedEventSchema,
	OpenAIResponseInProgressEventSchema,
	OpenAIResponseOutputItemAddedEventSchema,
	OpenAIResponseOutputItemDoneEventSchema,
	OpenAIResponseContentPartAddedEventSchema,
	OpenAIResponseContentPartDoneEventSchema,
	OpenAIResponseOutputTextDeltaEventSchema,
	OpenAIResponseOutputTextDoneEventSchema,
	OpenAIResponseCompletedEventSchema,
	OpenAIResponseIncompleteEventSchema,
	OpenAIResponseFailedEventSchema,
	OpenAIResponseErrorEventSchema,
]);

// Exact event branches run first; this fallback preserves unknown and incomplete known events.
const OpenAIResponseUnknownStreamEventSchema = z.looseObject({
	type: z.string().brand<'OpenAIResponseUnknownEventType'>(),
});

export const OpenAIResponsesStreamEventSchema = z.union([
	OpenAIResponseKnownStreamEventSchema,
	OpenAIResponseUnknownStreamEventSchema,
]);

export type OpenAIResponseTextContentPart = z.infer<typeof OpenAIResponseTextContentPartSchema>;
export type OpenAIResponseImageContentPart = z.infer<typeof OpenAIResponseImageContentPartSchema>;
export type OpenAIResponseContentPart = z.infer<typeof OpenAIResponseContentPartSchema>;
export type OpenAIResponseMessageItem = z.infer<typeof OpenAIResponseMessageItemSchema>;
export type OpenAIResponseFunctionTool = z.infer<typeof OpenAIResponseFunctionToolSchema>;
export type OpenAIResponseCustomTool = z.infer<typeof OpenAIResponseCustomToolSchema>;
export type OpenAIResponseFileSearchTool = z.infer<typeof OpenAIResponseFileSearchToolSchema>;
export type OpenAIResponseCodeInterpreterTool = z.infer<typeof OpenAIResponseCodeInterpreterToolSchema>;
export type OpenAIResponseTool = z.infer<typeof OpenAIResponseToolSchema>;
export type OpenAIResponseFunctionCallItem = z.infer<typeof OpenAIResponseFunctionCallItemSchema>;
export type OpenAIResponseFunctionCallOutputItem = z.infer<typeof OpenAIResponseFunctionCallOutputItemSchema>;
export type OpenAIResponseReasoningItem = z.infer<typeof OpenAIResponseReasoningItemSchema>;
export type OpenAIResponseCompactionItem = z.infer<typeof OpenAIResponseCompactionItemSchema>;
export type OpenAIResponseInputCompactionItem = z.infer<typeof OpenAIResponseInputCompactionItemSchema>;
export type OpenAIResponseItem = z.infer<typeof OpenAIResponseItemSchema>;
export type OpenAIResponseInputMessageItem = z.infer<typeof OpenAIResponseInputMessageItemSchema>;
export type OpenAIResponseInputItem = z.infer<typeof OpenAIResponseInputItemSchema>;
export type OpenAIResponseToolChoice = z.infer<typeof OpenAIResponseToolChoiceSchema>;
export type OpenAIResponsesRequest = z.infer<typeof OpenAIResponsesRequestSchema>;
export type OpenAIResponseUsage = z.infer<typeof OpenAIResponseUsageSchema>;
export type OpenAIResponseError = z.infer<typeof OpenAIResponseErrorSchema>;
export type OpenAIResponsesResponse = z.infer<typeof OpenAIResponsesResponseSchema>;
export type OpenAIResponseKnownStreamEvent = z.infer<typeof OpenAIResponseKnownStreamEventSchema>;
export type OpenAIResponsesStreamEvent = z.infer<typeof OpenAIResponsesStreamEventSchema>;
