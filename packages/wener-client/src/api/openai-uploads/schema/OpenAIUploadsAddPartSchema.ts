import { z } from 'zod';
import { OpenAIUploadPartSchema } from './OpenAIUploadSchema';

/** 分片不能为空；整文件上传（openai-files）允许空文件，两者语义不同。 */
export const OpenAIUploadPartFileSchema = z.file().min(1).meta({ type: 'string', format: 'binary', minLength: 1 });

export const OpenAIUploadsAddPartRequestSchema = z.looseObject({
	upload_id: z.string().min(1),
	data: OpenAIUploadPartFileSchema,
});

export const OpenAIUploadsAddPartResponseSchema = OpenAIUploadPartSchema;

export type OpenAIUploadsAddPartRequest = z.infer<typeof OpenAIUploadsAddPartRequestSchema>;
export type OpenAIUploadsAddPartResponse = z.infer<typeof OpenAIUploadsAddPartResponseSchema>;
