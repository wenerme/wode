import { z } from 'zod';

const wireString = z.string().min(1);
const batchId = { batch_id: wireString };
const timestamp = z.number().int().nonnegative();

export const OpenAIBatchSchema = z.looseObject({
	id: wireString,
	object: z.literal('batch'),
	endpoint: wireString,
	input_file_id: wireString,
	completion_window: wireString,
	status: z.enum([
		'validating',
		'failed',
		'in_progress',
		'finalizing',
		'completed',
		'expired',
		'cancelling',
		'cancelled',
	]),
	created_at: timestamp,
	output_file_id: wireString.nullish(),
	error_file_id: wireString.nullish(),
	expires_at: timestamp.nullish(),
	in_progress_at: timestamp.nullish(),
	finalizing_at: timestamp.nullish(),
	completed_at: timestamp.nullish(),
	failed_at: timestamp.nullish(),
	expired_at: timestamp.nullish(),
	cancelling_at: timestamp.nullish(),
	cancelled_at: timestamp.nullish(),
	request_counts: z.looseObject({ total: timestamp, completed: timestamp, failed: timestamp }).optional(),
	errors: z
		.looseObject({ object: z.literal('list').optional(), data: z.array(z.looseObject({ message: z.string() })) })
		.nullish(),
	metadata: z.record(z.string(), z.string()).nullish(),
});

export const OpenAIBatchesCreateRequestSchema = z.looseObject({
	input_file_id: wireString,
	endpoint: wireString,
	completion_window: z.literal('24h'),
	metadata: z.record(z.string(), z.string()).nullish(),
});
export const OpenAIBatchesCreateResponseSchema = OpenAIBatchSchema;
export const OpenAIBatchesListRequestSchema = z.looseObject({
	after: wireString.optional(),
	limit: z.coerce.number().int().positive().optional(),
});
export const OpenAIBatchesListResponseSchema = z.looseObject({
	object: z.literal('list'),
	data: z.array(OpenAIBatchSchema),
	has_more: z.boolean(),
	first_id: wireString.nullish(),
	last_id: wireString.nullish(),
});
export const OpenAIBatchesRetrieveRequestSchema = z.looseObject(batchId);
export const OpenAIBatchesRetrieveResponseSchema = OpenAIBatchSchema;
export const OpenAIBatchesCancelRequestSchema = z.looseObject(batchId);
export const OpenAIBatchesCancelResponseSchema = OpenAIBatchSchema;

/** Batch 输入/输出文件中的单行 JSON；文件本身仍由 Files Content 操作获取。 */
export const OpenAIBatchRequestLineSchema = z.looseObject({
	custom_id: wireString,
	method: z.literal('POST'),
	url: wireString,
	body: z.record(z.string(), z.unknown()),
});
export const OpenAIBatchResponseLineSchema = z.looseObject({
	id: wireString,
	custom_id: wireString,
	response: z
		.looseObject({ status_code: z.number().int().min(100).max(599), request_id: z.string(), body: z.unknown() })
		.nullable(),
	error: z.looseObject({ code: z.string(), message: z.string() }).nullable(),
});

export type OpenAIBatch = z.infer<typeof OpenAIBatchSchema>;
export type OpenAIBatchesCreateRequest = z.infer<typeof OpenAIBatchesCreateRequestSchema>;
export type OpenAIBatchesCreateResponse = z.infer<typeof OpenAIBatchesCreateResponseSchema>;
export type OpenAIBatchesListRequest = z.infer<typeof OpenAIBatchesListRequestSchema>;
export type OpenAIBatchesListResponse = z.infer<typeof OpenAIBatchesListResponseSchema>;
export type OpenAIBatchesRetrieveRequest = z.infer<typeof OpenAIBatchesRetrieveRequestSchema>;
export type OpenAIBatchesRetrieveResponse = z.infer<typeof OpenAIBatchesRetrieveResponseSchema>;
export type OpenAIBatchesCancelRequest = z.infer<typeof OpenAIBatchesCancelRequestSchema>;
export type OpenAIBatchesCancelResponse = z.infer<typeof OpenAIBatchesCancelResponseSchema>;
export type OpenAIBatchRequestLine = z.infer<typeof OpenAIBatchRequestLineSchema>;
export type OpenAIBatchResponseLine = z.infer<typeof OpenAIBatchResponseLineSchema>;
