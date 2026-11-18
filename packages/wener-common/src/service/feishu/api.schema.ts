import { z } from 'zod';
import { optionalDynamicValue } from './schema';

/**
 * Generic Feishu OpenAPI layer schemas (phase 1). The catalog itself lives in
 * `@wener/client/feishu/openapi` and is imported lazily by the service, never by these schemas.
 */
export const FeishuApiRiskSchema = z.enum(['read', 'write', 'high-risk-write']);
const apiId = z.string().min(3).max(200).regex(/^[a-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/u);
const record = z.record(z.string(), z.unknown());

export const FeishuApiSummarySchema = z.looseObject({
	id: z.string(),
	service: z.string(),
	resource: z.string(),
	method: z.string(),
	httpMethod: z.string(),
	path: z.string(),
	risk: z.string(),
	accessTokens: z.array(z.string()),
	scopes: z.array(z.string()),
	summary: z.string(),
	docUrl: z.string(),
	multipart: z.boolean().optional(),
	/** False when this service cannot call it (user-token only, or multipart upload). */
	available: z.boolean(),
	unavailableReason: z.string().optional(),
});

export const FeishuListApiInputSchema = z
	.strictObject({
		service: z.string().min(1).max(64).optional(),
		risk: FeishuApiRiskSchema.optional(),
		/** Case-insensitive text filter over id, path and summary. */
		query: z.string().min(1).max(200).optional(),
		includeUnavailable: z.boolean().optional(),
	})
	.default({});
export const FeishuListApiOutputSchema = z.strictObject({
	items: z.array(FeishuApiSummarySchema),
	total: z.number().int(),
});

export const FeishuDescribeApiInputSchema = z.strictObject({ id: apiId });
export const FeishuDescribeApiOutputSchema = FeishuApiSummarySchema.extend({
	/** JSON Schemas of the request parts and of the response `data` payload. */
	schemas: z.strictObject({
		pathParams: record.optional(),
		query: record.optional(),
		body: record.optional(),
		response: record.optional(),
	}),
});

const callInput = {
	id: apiId,
	path: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
	query: record.optional(),
	body: optionalDynamicValue,
	/** Validate and return the built request without credentials or HTTP. */
	dryRun: z.boolean().optional(),
};
export const FeishuCallReadApiInputSchema = z.strictObject(callInput);
export const FeishuCallWriteApiInputSchema = z.strictObject({
	...callInput,
	/** Required in addition to a writable service for `high-risk-write` APIs. */
	confirmHighRisk: z.boolean().optional(),
});

export const FeishuApiRequestSchema = z.strictObject({
	method: z.string(),
	path: z.string(),
	query: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
	body: optionalDynamicValue,
});
export const FeishuCallApiOutputSchema = z.strictObject({
	id: z.string(),
	dryRun: z.boolean().optional(),
	/** Present for dry runs only. */
	request: FeishuApiRequestSchema.optional(),
	/** The response envelope `data` payload (or raw text/Blob for non-JSON responses). */
	data: optionalDynamicValue,
	/** Set when `data` does not match the catalog response schema; the data is still returned. */
	schemaWarning: z.string().optional(),
});
