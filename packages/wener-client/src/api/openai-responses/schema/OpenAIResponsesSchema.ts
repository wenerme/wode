import { z } from 'zod';

const wireString = z.string().min(1);
const knownContentPartTypes = new Set(['input_text', 'output_text', 'text', 'input_image', 'image', 'refusal']);
const knownItemTypes = new Set(['message', 'function_call', 'function_call_output', 'reasoning', 'compaction']);
const knownEventTypes = new Set([
	'response.created',
	'response.in_progress',
	'response.output_item.added',
	'response.output_item.done',
	'response.content_part.added',
	'response.content_part.done',
	'response.output_text.delta',
	'response.output_text.done',
	'response.completed',
	'response.incomplete',
	'response.failed',
	'error',
]);

export const OpenAIResponseTextContentPartSchema = z.looseObject({
	type: z.enum(['input_text', 'output_text', 'text']),
	text: z.string(),
});

export const OpenAIResponseImageContentPartSchema = z
	.looseObject({
		type: z.enum(['input_image', 'image']),
		image_url: z.string().min(1).optional(),
		file_id: z.string().min(1).optional(),
		detail: z.string().optional(),
	})
	.refine(
		(part) => part.image_url !== undefined || part.file_id !== undefined,
		'image parts require image_url or file_id',
	);

export const OpenAIResponseRefusalContentPartSchema = z.looseObject({
	type: z.literal('refusal'),
	refusal: z.string(),
});

const OpenAIResponseUnknownContentPartSchema = z
	.looseObject({ type: z.string().min(1) })
	.refine((part) => !knownContentPartTypes.has(part.type), 'known content parts must satisfy their wire schema');

export const OpenAIResponseContentPartSchema = z.union([
	OpenAIResponseTextContentPartSchema,
	OpenAIResponseImageContentPartSchema,
	OpenAIResponseRefusalContentPartSchema,
	OpenAIResponseUnknownContentPartSchema,
]);

export const OpenAIResponseMessageItemSchema = z.looseObject({
	type: z.literal('message'),
	role: z.enum(['system', 'developer', 'user', 'assistant']),
	content: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]),
	status: z.string().optional(),
});

/**
 * Responses 请求中的 message item 允许省略 type；pi 等兼容客户端会发送这种形式。
 * 响应 output 中的 message 仍要求显式 type，避免把响应协议校验放宽到无法识别的对象。
 */
export const OpenAIResponseInputMessageItemSchema = z.looseObject({
	type: z.literal('message').optional(),
	role: z.enum(['system', 'developer', 'user', 'assistant']),
	content: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]),
	status: z.string().optional(),
});

export const OpenAIResponseFunctionToolSchema = z.looseObject({
	type: z.literal('function'),
	name: wireString,
	description: z.string().optional(),
	parameters: z.unknown().optional(),
	strict: z.boolean().optional(),
});

export const OpenAIResponseCustomToolSchema = z.looseObject({
	type: z.literal('custom'),
	name: wireString,
	description: z.string().optional(),
	format: z.unknown().optional(),
});

export const OpenAIResponseFileSearchToolSchema = z.looseObject({
	type: z.literal('file_search'),
	vector_store_ids: z.array(wireString),
	filters: z.unknown().optional(),
	max_num_results: z.number().int().min(1).max(50).optional(),
	ranking_options: z.looseObject({}).optional(),
});

export const OpenAIResponseCodeInterpreterToolSchema = z.looseObject({
	type: z.literal('code_interpreter'),
	container: z.union([
		wireString,
		z.looseObject({
			type: z.literal('auto'),
			file_ids: z.array(wireString).optional(),
			memory_limit: z.enum(['1g', '4g', '16g', '64g']).nullish(),
			network_policy: z.unknown().optional(),
		}),
	]),
});

const knownToolTypes = new Set(['function', 'custom', 'file_search', 'code_interpreter']);

const OpenAIResponseExtensionToolSchema = z
	.looseObject({ type: wireString })
	.refine((tool) => !knownToolTypes.has(tool.type), 'known tools must satisfy their wire schema');

export const OpenAIResponseToolSchema = z.union([
	OpenAIResponseFunctionToolSchema,
	OpenAIResponseCustomToolSchema,
	OpenAIResponseFileSearchToolSchema,
	OpenAIResponseCodeInterpreterToolSchema,
	OpenAIResponseExtensionToolSchema,
]);

export const OpenAIResponseFunctionCallItemSchema = z.looseObject({
	type: z.literal('function_call'),
	call_id: wireString,
	name: wireString,
	arguments: z.string(),
	id: z.string().optional(),
	status: z.string().optional(),
});

export const OpenAIResponseFunctionCallOutputItemSchema = z.looseObject({
	type: z.literal('function_call_output'),
	call_id: wireString,
	output: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]),
	id: z.string().optional(),
	status: z.string().optional(),
});

export const OpenAIResponseReasoningItemSchema = z.looseObject({
	type: z.literal('reasoning'),
	id: z.string().optional(),
	summary: z.array(OpenAIResponseContentPartSchema).optional(),
	content: z.array(OpenAIResponseContentPartSchema).optional(),
	status: z.string().optional(),
});

const OpenAIResponseUnknownItemSchema = z
	.looseObject({ type: z.string().min(1) })
	.refine((item) => !knownItemTypes.has(item.type), 'known response items must satisfy their wire schema');

export const OpenAIResponseCompactionItemSchema = z.looseObject({
	id: wireString,
	type: z.literal('compaction'),
	encrypted_content: wireString,
});

export const OpenAIResponseInputCompactionItemSchema = OpenAIResponseCompactionItemSchema.extend({
	id: wireString.nullish(),
});

export const OpenAIResponseItemSchema = z.union([
	OpenAIResponseMessageItemSchema,
	OpenAIResponseFunctionCallItemSchema,
	OpenAIResponseReasoningItemSchema,
	OpenAIResponseCompactionItemSchema,
	OpenAIResponseUnknownItemSchema,
]);

export const OpenAIResponseInputItemSchema = z.union([
	OpenAIResponseInputMessageItemSchema,
	OpenAIResponseFunctionCallItemSchema,
	OpenAIResponseFunctionCallOutputItemSchema,
	OpenAIResponseReasoningItemSchema,
	OpenAIResponseInputCompactionItemSchema,
	OpenAIResponseUnknownItemSchema,
]);

export const OpenAIResponseToolChoiceSchema = z.union([
	z.enum(['none', 'auto', 'required']),
	z.looseObject({
		type: z.literal('function'),
		name: wireString,
	}),
	z.looseObject({ type: z.literal('custom'), name: wireString }),
	z
		.looseObject({ type: wireString })
		.refine(
			(choice) => choice.type !== 'function' && choice.type !== 'custom',
			'function and custom tool choices require a name',
		),
]);

export const OpenAIResponsesRequestSchema = z.looseObject({
	model: wireString,
	input: z.union([z.string(), z.array(OpenAIResponseInputItemSchema)]).nullish(),
	previous_response_id: wireString.nullish(),
	instructions: z.string().optional(),
	tools: z.array(OpenAIResponseToolSchema).optional(),
	tool_choice: OpenAIResponseToolChoiceSchema.optional(),
	parallel_tool_calls: z.boolean().optional(),
	stream: z.boolean().optional(),
	background: z.boolean().optional(),
	max_output_tokens: z.number().int().positive().optional(),
	temperature: z.number().finite().optional(),
	top_p: z.number().finite().optional(),
	reasoning: z.looseObject({ effort: z.string().optional(), summary: z.string().optional() }).optional(),
	text: z.looseObject({ format: z.unknown().optional(), verbosity: z.string().optional() }).optional(),
	metadata: z.record(z.string(), z.string()).optional(),
	user: z.string().optional(),
});

// Input Tokens 请求是 Responses 请求的子集：不含 stream/max_output_tokens 等生成参数
export const OpenAIResponsesInputTokensRequestSchema = z.looseObject({
	model: wireString,
	input: z.union([z.string(), z.array(OpenAIResponseInputItemSchema)]),
	instructions: z.string().optional(),
	tools: z.array(OpenAIResponseToolSchema).optional(),
	tool_choice: OpenAIResponseToolChoiceSchema.optional(),
	parallel_tool_calls: z.boolean().optional(),
	reasoning: z.looseObject({ effort: z.string().optional(), summary: z.string().optional() }).optional(),
	text: z.looseObject({ format: z.unknown().optional(), verbosity: z.string().optional() }).optional(),
});
export type OpenAIResponsesInputTokensRequest = z.infer<typeof OpenAIResponsesInputTokensRequestSchema>;

export const OpenAIResponsesInputTokensResponseSchema = z.looseObject({
	object: z.literal('response.input_tokens'),
	input_tokens: z.number().int().nonnegative(),
});
export type OpenAIResponsesInputTokensResponse = z.infer<typeof OpenAIResponsesInputTokensResponseSchema>;

export const OpenAIResponseUsageSchema = z.looseObject({
	input_tokens: z.number().int().nonnegative(),
	output_tokens: z.number().int().nonnegative(),
	total_tokens: z.number().int().nonnegative(),
	input_tokens_details: z.looseObject({ cached_tokens: z.number().int().nonnegative() }).optional(),
	output_tokens_details: z.looseObject({ reasoning_tokens: z.number().int().nonnegative() }).optional(),
});

export const OpenAIResponseErrorSchema = z.looseObject({
	code: z.string().nullable().optional(),
	message: z.string(),
	param: z.string().nullable().optional(),
	type: z.string().optional(),
});

export const OpenAIResponsesResponseSchema = z.looseObject({
	id: wireString,
	object: z.literal('response'),
	created_at: z.number().int().nonnegative(),
	model: wireString,
	status: z.enum(['queued', 'in_progress', 'completed', 'failed', 'incomplete', 'cancelled']),
	output: z.array(OpenAIResponseItemSchema),
	usage: OpenAIResponseUsageSchema.nullable().optional(),
	error: OpenAIResponseErrorSchema.nullable().optional(),
	incomplete_details: z.looseObject({}).nullable().optional(),
});

export const OpenAIResponseCreatedEventSchema = z.looseObject({
	type: z.literal('response.created'),
	sequence_number: z.number().int().nonnegative(),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseInProgressEventSchema = z.looseObject({
	type: z.literal('response.in_progress'),
	sequence_number: z.number().int().nonnegative(),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseOutputItemAddedEventSchema = z.looseObject({
	type: z.literal('response.output_item.added'),
	sequence_number: z.number().int().nonnegative(),
	output_index: z.number().int().nonnegative(),
	item: OpenAIResponseItemSchema,
});

export const OpenAIResponseOutputItemDoneEventSchema = z.looseObject({
	type: z.literal('response.output_item.done'),
	sequence_number: z.number().int().nonnegative(),
	output_index: z.number().int().nonnegative(),
	item: OpenAIResponseItemSchema,
});

export const OpenAIResponseContentPartAddedEventSchema = z.looseObject({
	type: z.literal('response.content_part.added'),
	sequence_number: z.number().int().nonnegative(),
	item_id: wireString,
	output_index: z.number().int().nonnegative(),
	content_index: z.number().int().nonnegative(),
	part: OpenAIResponseContentPartSchema,
});

export const OpenAIResponseContentPartDoneEventSchema = z.looseObject({
	type: z.literal('response.content_part.done'),
	sequence_number: z.number().int().nonnegative(),
	item_id: wireString,
	output_index: z.number().int().nonnegative(),
	content_index: z.number().int().nonnegative(),
	part: OpenAIResponseContentPartSchema,
});

export const OpenAIResponseOutputTextDeltaEventSchema = z.looseObject({
	type: z.literal('response.output_text.delta'),
	sequence_number: z.number().int().nonnegative(),
	item_id: wireString,
	output_index: z.number().int().nonnegative(),
	content_index: z.number().int().nonnegative(),
	delta: z.string(),
});

export const OpenAIResponseOutputTextDoneEventSchema = z.looseObject({
	type: z.literal('response.output_text.done'),
	sequence_number: z.number().int().nonnegative(),
	item_id: wireString,
	output_index: z.number().int().nonnegative(),
	content_index: z.number().int().nonnegative(),
	text: z.string(),
});

export const OpenAIResponseCompletedEventSchema = z.looseObject({
	type: z.literal('response.completed'),
	sequence_number: z.number().int().nonnegative(),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseIncompleteEventSchema = z.looseObject({
	type: z.literal('response.incomplete'),
	sequence_number: z.number().int().nonnegative(),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseFailedEventSchema = z.looseObject({
	type: z.literal('response.failed'),
	sequence_number: z.number().int().nonnegative(),
	response: OpenAIResponsesResponseSchema,
});

export const OpenAIResponseErrorEventSchema = z.looseObject({
	type: z.literal('error'),
	sequence_number: z.number().int().nonnegative(),
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

const OpenAIResponseUnknownStreamEventSchema = z
	.looseObject({ type: z.string().min(1).brand<'OpenAIResponseUnknownEventType'>() })
	.refine((event) => !knownEventTypes.has(event.type), 'known response events must satisfy their wire schema');

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
