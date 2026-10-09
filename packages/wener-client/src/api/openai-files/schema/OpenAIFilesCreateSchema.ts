import { z } from 'zod';
import {
	OpenAICreatePurposeSchema,
	OpenAIFileExpirationSecondsSchema,
	OpenAIFileSchema,
	OpenAIMultipartFileSchema,
} from './OpenAIFileSchema';

const fileCreateFields = {
	file: OpenAIMultipartFileSchema,
	purpose: OpenAICreatePurposeSchema,
};

// 用不可匹配的可选字符串表达“字段不能出现”，同时保持 OpenAPI 可生成。
const absentFormFieldSchema = z
	.string()
	.regex(/^(?!)$/)
	.optional();

const fileCreateWithoutExpirationSchema = z.looseObject({
	...fileCreateFields,
	'expires_after[anchor]': absentFormFieldSchema,
	'expires_after[seconds]': absentFormFieldSchema,
});

const fileCreateWithExpirationSchema = z.looseObject({
	...fileCreateFields,
	'expires_after[anchor]': z.literal('created_at'),
	'expires_after[seconds]': OpenAIFileExpirationSecondsSchema,
});

export const OpenAIFilesCreateRequestSchema = z.union([
	fileCreateWithoutExpirationSchema,
	fileCreateWithExpirationSchema,
]);

export const OpenAIFilesCreateResponseSchema = OpenAIFileSchema;

export type OpenAIFilesCreateRequest = z.infer<typeof OpenAIFilesCreateRequestSchema>;
export type OpenAIFilesCreateResponse = z.infer<typeof OpenAIFilesCreateResponseSchema>;
