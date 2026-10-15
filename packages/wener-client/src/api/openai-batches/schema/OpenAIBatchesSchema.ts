import { z } from 'zod';

const batchId = { batch_id: z.string() };
const timestamp = z.number().multipleOf(1);

export const OpenAIBatchSchema = z.looseObject({
	id: z.string().describe('Batch identifier'),
	object: z.literal('batch'),
	endpoint: z.string().describe('Batch request endpoint'),
	input_file_id: z.string().describe('Input file identifier'),
	completion_window: z.string().describe('Batch completion window'),
	status: z
		.enum(['validating', 'failed', 'in_progress', 'finalizing', 'completed', 'expired', 'cancelling', 'cancelled'])
		.describe('Batch status'),
	created_at: timestamp.describe('Creation time, Unix seconds'),
	output_file_id: z.string().nullish().describe('Output file identifier'),
	error_file_id: z.string().nullish().describe('Error file identifier'),
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
		.looseObject({
			object: z.string().optional(),
			data: z
				.array(
					z.looseObject({
						code: z.string().optional(),
						message: z.string().optional(),
						param: z.string().nullish(),
						line: z.number().multipleOf(1).nullish(),
					}),
				)
				.optional(),
		})
		.nullish(),
	metadata: z.record(z.string(), z.string()).nullish(),
});

export const OpenAIBatchesCreateRequestSchema = z.looseObject({
	input_file_id: z.string(),
	endpoint: z.string(),
	completion_window: z.literal('24h'),
	metadata: z.record(z.string(), z.string()).nullish(),
});
export const OpenAIBatchesCreateResponseSchema = OpenAIBatchSchema;
export const OpenAIBatchesListRequestSchema = z.looseObject({
	after: z.string().optional(),
	limit: z.coerce.number().multipleOf(1).positive().optional(),
});
export const OpenAIBatchesListResponseSchema = z.looseObject({
	object: z.literal('list'),
	data: z.array(OpenAIBatchSchema),
	has_more: z.boolean(),
	first_id: z.string().nullish(),
	last_id: z.string().nullish(),
});
export const OpenAIBatchesRetrieveRequestSchema = z.looseObject(batchId);
export const OpenAIBatchesRetrieveResponseSchema = OpenAIBatchSchema;
export const OpenAIBatchesCancelRequestSchema = z.looseObject(batchId);
export const OpenAIBatchesCancelResponseSchema = OpenAIBatchSchema;

/** Batch 输入/输出文件中的单行 JSON；文件本身仍由 Files Content 操作获取。 */
export const OpenAIBatchRequestLineSchema = z.looseObject({
	custom_id: z.string(),
	method: z.literal('POST'),
	url: z.string(),
	body: z.record(z.string(), z.unknown()),
});
export const OpenAIBatchResponseLineSchema = z.looseObject({
	id: z.string(),
	custom_id: z.string(),
	response: z
		.looseObject({ status_code: z.number().multipleOf(1).min(100).max(599), request_id: z.string(), body: z.unknown() })
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
