import { z } from 'zod';

const wireString = z.string().min(1);

export const OpenAICreatePurposeSchema = z.enum(['assistants', 'batch', 'evals', 'fine-tune', 'vision', 'user_data']);

export const OpenAIFileStatusSchema = z.enum(['uploaded', 'processed', 'error']);

export const OpenAIFileListLimitSchema = z.union([
	z.number().int().min(1).max(10_000),
	z
		.string()
		.regex(/^\s*(?:[1-9]|[1-9][0-9]{1,3}|10000)\s*$/)
		.transform(Number),
]);

export const OpenAIFileExpirationSecondsSchema = z.union([
	z.number().int().min(3600).max(2_592_000),
	z
		.string()
		.regex(
			/^\s*(?:3[6-9][0-9]{2}|[4-9][0-9]{3}|[1-9][0-9]{4}|[1-9][0-9]{5}|1[0-9]{6}|2[0-4][0-9]{5}|25[0-8][0-9]{4}|259[01][0-9]{3}|2592000)\s*$/,
		)
		.transform(Number),
]);

export const OpenAIFileSchema = z.looseObject({
	id: wireString,
	object: z.literal('file'),
	bytes: z.number().int().nonnegative(),
	created_at: z.number().int().nonnegative(),
	filename: wireString,
	purpose: wireString,
	status: OpenAIFileStatusSchema,
	status_details: z.string().nullable().optional(),
	expires_at: z.number().int().nonnegative().optional(),
});

export const OpenAIMultipartFileSchema = z.file().meta({ type: 'string', format: 'binary' });

export const OpenAIFileContentSchema = z.string().meta({ type: 'string', format: 'binary' });

export type OpenAICreatePurpose = z.infer<typeof OpenAICreatePurposeSchema>;
export type OpenAIFileStatus = z.infer<typeof OpenAIFileStatusSchema>;
export type OpenAIFileListLimit = z.infer<typeof OpenAIFileListLimitSchema>;
export type OpenAIFileExpirationSeconds = z.infer<typeof OpenAIFileExpirationSecondsSchema>;
export type OpenAIFile = z.infer<typeof OpenAIFileSchema>;
export type OpenAIFileContent = z.infer<typeof OpenAIFileContentSchema>;
