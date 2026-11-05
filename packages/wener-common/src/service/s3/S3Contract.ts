import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

/** Names of operations that mutate bucket state; also used by client.ts to enforce read-only mode. */
export const S3WriteOperations = new Set(['putObject', 'deleteObject']);

export const S3ListObjectInputSchema = z.strictObject({
	delimiter: z.string().optional(),
	prefix: z.string().optional(),
	maxKeys: z.number().int().positive().optional(),
});
export const S3ListObjectOutputSchema = z.unknown();

export const S3GetObjectInputSchema = z.strictObject({
	key: z.string().min(1),
});
export const S3GetObjectOutputSchema = z.unknown();

export const S3PutObjectInputSchema = z.strictObject({
	key: z.string().min(1),
	content: z.string(),
	contentType: z.string().optional(),
});
export const S3PutObjectOutputSchema = z.object({
	ok: z.boolean(),
	status: z.number(),
	etag: z.string().optional(),
});

export const S3DeleteObjectInputSchema = z.strictObject({
	key: z.string().min(1),
});
export const S3DeleteObjectOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). This is not wired to a real oRPC router/handler yet --
 * no network boundary exists for this service today -- but `defineContractOperation`
 * (packages/wener-common/src/service/runtime/contract.ts) derives the local `ServiceOperation`
 * tool metadata from this contract, replacing the hand-rolled `ServiceTool` JSON Schema in the
 * former schema.ts. See packages/wener-common/src/service/cls/TencentClsContract.ts for the
 * sibling contract this one mirrors.
 */
export const S3Contract = {
	listObject: oc.input(S3ListObjectInputSchema).output(S3ListObjectOutputSchema).meta(readOnlyTool),
	getObject: oc.input(S3GetObjectInputSchema).output(S3GetObjectOutputSchema).meta(readOnlyTool),
	putObject: oc.input(S3PutObjectInputSchema).output(S3PutObjectOutputSchema).meta(writeTool),
	deleteObject: oc.input(S3DeleteObjectInputSchema).output(S3DeleteObjectOutputSchema).meta(writeTool),
};
