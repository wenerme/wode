import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const s3 = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

export const S3WriteOperations = new Set(['putObject', 'deleteObject']);

export const S3ListObjectInputSchema = z.strictObject({
	delimiter: z.string().min(1).optional(),
	prefix: z.string().optional(),
	maxKeys: z.number().int().positive().optional(),
}).default({});

/** s3mini metadata, with Date serialized explicitly for the JSON tool transport. */
export const S3ObjectMetadataSchema = z.looseObject({
	Key: z.string(),
	Size: z.number(),
	// Date#toJSON yields null for an invalid SDK date, matching its native JSON behavior.
	LastModified: z.iso.datetime().nullable(),
	ETag: z.string(),
	StorageClass: z.string(),
	VersionId: z.string().optional(),
	IsLatest: z.boolean().optional(),
	IsDeleteMarker: z.boolean().optional(),
});
export const S3ListObjectOutputSchema = z.array(S3ObjectMetadataSchema).nullable();

export const S3GetObjectInputSchema = z.strictObject({ key: z.string().min(1) });
// This operation decodes UTF-8 text. Raw bytes/ArrayBuffer are not JSON tool results.
export const S3GetObjectOutputSchema = z.string().nullable();

export const S3PutObjectInputSchema = z.strictObject({
	key: z.string().min(1),
	content: z.string(),
	contentType: z.string().optional(),
});
export const S3PutObjectOutputSchema = z.strictObject({
	ok: z.boolean(),
	status: z.number().int(),
	etag: z.string().optional(),
});

export const S3DeleteObjectInputSchema = z.strictObject({ key: z.string().min(1) });
export const S3DeleteObjectOutputSchema = z.boolean();

export const S3ServiceContract = {
	listObject: s3.input(S3ListObjectInputSchema).output(S3ListObjectOutputSchema).meta(readOnlyTool),
	getObject: s3.input(S3GetObjectInputSchema).output(S3GetObjectOutputSchema).meta(readOnlyTool),
	putObject: s3.input(S3PutObjectInputSchema).output(S3PutObjectOutputSchema).meta(writeTool),
	deleteObject: s3.input(S3DeleteObjectInputSchema).output(S3DeleteObjectOutputSchema).meta(writeTool),
};

export type S3ServiceInputs = InferContractRouterInputs<typeof S3ServiceContract>;
export type S3ServiceOutputs = InferContractRouterOutputs<typeof S3ServiceContract>;
export interface S3ServiceClientContext { timeoutMs?: number }
export type IS3ServiceContract = ContractRouterClient<typeof S3ServiceContract, S3ServiceClientContext>;
export type S3ServiceCallOptions = NonNullable<Parameters<IS3ServiceContract['getObject']>[1]>;
