import { z } from 'zod';
import { AnthropicMessagesRequestSchema, AnthropicMessagesResponseSchema } from '../../anthropic-messages/schema';

const wireString = z.string().min(1);
const batchId = { message_batch_id: wireString };
const count = z.number().int().nonnegative();

export const AnthropicMessageBatchSchema = z.looseObject({
	id: wireString,
	type: z.literal('message_batch'),
	processing_status: z.enum(['in_progress', 'canceling', 'ended']),
	request_counts: z.looseObject({
		processing: count,
		succeeded: count,
		errored: count,
		canceled: count,
		expired: count,
	}),
	created_at: wireString,
	expires_at: wireString,
	ended_at: wireString.nullish(),
	cancel_initiated_at: wireString.nullish(),
	archived_at: wireString.nullish(),
	results_url: wireString.nullish(),
});

export const AnthropicMessagesBatchesCreateRequestSchema = z.looseObject({
	requests: z.array(z.looseObject({ custom_id: wireString, params: AnthropicMessagesRequestSchema })).min(1),
});
export const AnthropicMessagesBatchesCreateResponseSchema = AnthropicMessageBatchSchema;
export const AnthropicMessagesBatchesListRequestSchema = z.looseObject({
	before_id: wireString.optional(),
	after_id: wireString.optional(),
	limit: z.coerce.number().int().positive().optional(),
});
export const AnthropicMessagesBatchesListResponseSchema = z.looseObject({
	data: z.array(AnthropicMessageBatchSchema),
	has_more: z.boolean(),
	first_id: wireString.nullish(),
	last_id: wireString.nullish(),
});
export const AnthropicMessagesBatchesRetrieveRequestSchema = z.looseObject(batchId);
export const AnthropicMessagesBatchesRetrieveResponseSchema = AnthropicMessageBatchSchema;
export const AnthropicMessagesBatchesCancelRequestSchema = z.looseObject(batchId);
export const AnthropicMessagesBatchesCancelResponseSchema = AnthropicMessageBatchSchema;
export const AnthropicMessagesBatchesDeleteRequestSchema = z.looseObject(batchId);
export const AnthropicMessagesBatchesDeleteResponseSchema = z.looseObject({
	id: wireString,
	type: z.literal('message_batch_deleted'),
});

/** Results 是 JSONL 流；此 schema 描述单行结果，不把整个流当成 JSON array。 */
export const AnthropicMessageBatchResultSchema = z.looseObject({
	custom_id: wireString,
	result: z.union([
		z.looseObject({ type: z.literal('succeeded'), message: AnthropicMessagesResponseSchema }),
		z.looseObject({
			type: z.literal('errored'),
			error: z.looseObject({
				type: z.literal('error'),
				error: z.looseObject({ type: wireString, message: z.string() }),
			}),
		}),
		z.looseObject({ type: z.enum(['canceled', 'expired']) }),
	]),
});
export const AnthropicMessagesBatchesResultsRequestSchema = z.looseObject(batchId);
export const AnthropicMessagesBatchesResultsResponseSchema = z.string().describe('逐行 JSON 的原始响应文本');

export type AnthropicMessageBatch = z.infer<typeof AnthropicMessageBatchSchema>;
export type AnthropicMessagesBatchesCreateRequest = z.infer<typeof AnthropicMessagesBatchesCreateRequestSchema>;
export type AnthropicMessagesBatchesCreateResponse = z.infer<typeof AnthropicMessagesBatchesCreateResponseSchema>;
export type AnthropicMessagesBatchesListRequest = z.infer<typeof AnthropicMessagesBatchesListRequestSchema>;
export type AnthropicMessagesBatchesListResponse = z.infer<typeof AnthropicMessagesBatchesListResponseSchema>;
export type AnthropicMessagesBatchesRetrieveRequest = z.infer<typeof AnthropicMessagesBatchesRetrieveRequestSchema>;
export type AnthropicMessagesBatchesRetrieveResponse = z.infer<typeof AnthropicMessagesBatchesRetrieveResponseSchema>;
export type AnthropicMessagesBatchesCancelRequest = z.infer<typeof AnthropicMessagesBatchesCancelRequestSchema>;
export type AnthropicMessagesBatchesCancelResponse = z.infer<typeof AnthropicMessagesBatchesCancelResponseSchema>;
export type AnthropicMessagesBatchesDeleteRequest = z.infer<typeof AnthropicMessagesBatchesDeleteRequestSchema>;
export type AnthropicMessagesBatchesDeleteResponse = z.infer<typeof AnthropicMessagesBatchesDeleteResponseSchema>;
export type AnthropicMessageBatchResult = z.infer<typeof AnthropicMessageBatchResultSchema>;
export type AnthropicMessagesBatchesResultsRequest = z.infer<typeof AnthropicMessagesBatchesResultsRequestSchema>;
export type AnthropicMessagesBatchesResultsResponse = z.infer<typeof AnthropicMessagesBatchesResultsResponseSchema>;
