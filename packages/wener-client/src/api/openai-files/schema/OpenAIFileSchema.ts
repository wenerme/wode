import { z } from 'zod';

export const OpenAICreatePurposeSchema = z.enum(['assistants', 'batch', 'evals', 'fine-tune', 'vision', 'user_data']);

export const OpenAIFileStatusSchema = z.enum(['uploaded', 'processed', 'error']);

export const OpenAIFileListLimitSchema = z.union([
	z.number().multipleOf(1).min(1).max(10_000),
	z
		.string()
		.regex(/^\s*(?:[1-9]|[1-9][0-9]{1,3}|10000)\s*$/)
		.transform(Number),
]);

export const OpenAIFileExpirationSecondsSchema = z.union([
	z.number().multipleOf(1).min(3600).max(2_592_000),
	z
		.string()
		.regex(
			/^\s*(?:3[6-9][0-9]{2}|[4-9][0-9]{3}|[1-9][0-9]{4}|[1-9][0-9]{5}|1[0-9]{6}|2[0-4][0-9]{5}|25[0-8][0-9]{4}|259[01][0-9]{3}|2592000)\s*$/,
		)
		.transform(Number),
]);

export const OpenAIFileSchema = z.looseObject({
	id: z.string().describe('File identifier'),
	object: z.literal('file'),
	bytes: z.number().multipleOf(1).nullable().describe('File size in bytes, nullable'),
	created_at: z.number().multipleOf(1).describe('Creation time, Unix seconds'),
	filename: z.string().describe('File name'),
	purpose: z.string().describe('File purpose'),
	status: OpenAIFileStatusSchema.describe('File processing status'),
	status_details: z.string().nullable().optional(),
	expires_at: z.number().multipleOf(1).optional().describe('Expiration time, Unix seconds'),
});

export const OpenAIMultipartFileSchema = z.file().meta({ type: 'string', format: 'binary' });

export const OpenAIFileContentSchema = z.string().meta({ type: 'string', format: 'binary' });

export type OpenAICreatePurpose = z.infer<typeof OpenAICreatePurposeSchema>;
export type OpenAIFileStatus = z.infer<typeof OpenAIFileStatusSchema>;
export type OpenAIFileListLimit = z.infer<typeof OpenAIFileListLimitSchema>;
export type OpenAIFileExpirationSeconds = z.infer<typeof OpenAIFileExpirationSecondsSchema>;
export type OpenAIFile = z.infer<typeof OpenAIFileSchema>;
export type OpenAIFileContent = z.infer<typeof OpenAIFileContentSchema>;
