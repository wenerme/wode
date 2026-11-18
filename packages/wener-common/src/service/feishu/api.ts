import type { FeishuOpenApiClient } from '@wener/client/feishu/server';
import { z } from 'zod';
import { toJsonSchema } from '../../schema';
import type { FeishuDescribeApiOutputSchema, FeishuListApiOutputSchema } from './api.schema';
import { FeishuServiceError, FeishuServiceErrorCodes } from './errors';

type OpenApiModule = typeof import('@wener/client/feishu/openapi');
type FeishuApiSummary = import('@wener/client/feishu/openapi').FeishuApiSummary;
type FeishuApiDefinition = import('@wener/client/feishu/openapi').FeishuApiDefinition;

let catalog: Promise<OpenApiModule> | undefined;
/**
 * The generated catalog (index + per-service zod chunks) is loaded only when a generic API
 * operation runs, so registering the provider or using curated operations never evaluates it.
 */
export function loadFeishuApiCatalog(): Promise<OpenApiModule> {
	catalog ||= import('@wener/client/feishu/openapi').catch((error: unknown) => {
		catalog = undefined;
		throw error;
	});
	return catalog;
}

const invalid = (message: string) => new FeishuServiceError(FeishuServiceErrorCodes.InvalidInput, message);

/** Why this tenant-token service cannot call an API, or undefined when it can. */
export function feishuApiUnavailableReason(summary: Pick<FeishuApiSummary, 'accessTokens' | 'multipart'>): string | undefined {
	if (!summary.accessTokens.includes('tenant')) return 'Requires a user access token; only tenant access tokens are supported';
	if (summary.multipart) return 'Multipart upload; use the curated upload operations';
	return undefined;
}

function describeSummary(summary: FeishuApiSummary) {
	const reason = feishuApiUnavailableReason(summary);
	return {
		...summary,
		accessTokens: [...summary.accessTokens],
		scopes: [...summary.scopes],
		available: reason === undefined,
		...(reason ? { unavailableReason: reason } : {}),
	};
}

export async function listFeishuApi(input: {
	service?: string;
	risk?: string;
	query?: string;
	includeUnavailable?: boolean;
}): Promise<z.output<typeof FeishuListApiOutputSchema>> {
	const { FeishuApiIndex } = await loadFeishuApiCatalog();
	const text = input.query?.toLowerCase();
	const items = FeishuApiIndex
		.filter((api) => input.service === undefined || api.service === input.service)
		.filter((api) => input.risk === undefined || api.risk === input.risk)
		.filter((api) => text === undefined || [api.id, api.path, api.summary].some((value) => value.toLowerCase().includes(text)))
		.map(describeSummary)
		.filter((api) => input.includeUnavailable === true || api.available);
	return { items, total: items.length };
}

async function loadDefinition(id: string): Promise<FeishuApiDefinition> {
	const openapi = await loadFeishuApiCatalog();
	if (!openapi.getFeishuApiSummary(id)) throw invalid(`Unknown Feishu API: ${id}`);
	return openapi.loadFeishuApi(id);
}

export async function describeFeishuApi(id: string): Promise<z.output<typeof FeishuDescribeApiOutputSchema>> {
	const definition = await loadDefinition(id);
	const { pathParams, query, body, response, ...summary } = definition;
	const json = (schema: z.ZodType | undefined) => schema ? (toJsonSchema(schema) as Record<string, unknown>) : undefined;
	// Request parts describe what callers may send (coerced strings included), so they use zod's input view.
	const input = (schema: z.ZodType | undefined) =>
		schema ? (z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>) : undefined;
	const schemas = Object.fromEntries(
		Object.entries({ pathParams: input(pathParams), query: input(query), body: input(body), response: json(response) })
			.filter(([, value]) => value !== undefined),
	);
	return { ...describeSummary(summary), schemas };
}

function issues(error: z.ZodError): string {
	return error.issues.slice(0, 5).map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}

function validate(schema: z.ZodType | undefined, value: unknown, label: string, id: string): unknown {
	const empty = value === undefined || (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
	if (!schema) {
		if (!empty) throw invalid(`Feishu API ${id} does not accept ${label}`);
		return undefined;
	}
	const parsed = schema.safeParse(value ?? {});
	if (!parsed.success) throw invalid(`Invalid ${label} for Feishu API ${id}: ${issues(parsed.error)}`);
	return parsed.data;
}

export type FeishuApiCallMode = 'read' | 'write';

export interface PreparedFeishuApiCall {
	definition: FeishuApiDefinition;
	request: { method: string; path: string; query: Record<string, string | string[]>; body?: unknown };
}

/**
 * Gate and validate a generic call without credentials or HTTP. The read tool accepts only
 * `read` APIs; the write tool only non-read APIs, with `high-risk-write` also requiring
 * `confirmHighRisk`. Path, query and body are validated with the catalog schemas.
 */
export async function prepareFeishuApiCall(
	mode: FeishuApiCallMode,
	input: { id: string; path?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown; confirmHighRisk?: boolean },
): Promise<PreparedFeishuApiCall> {
	const openapi = await loadFeishuApiCatalog();
	const summary = openapi.getFeishuApiSummary(input.id);
	if (!summary) throw invalid(`Unknown Feishu API: ${input.id}`);
	if (mode === 'read' && summary.risk !== 'read') {
		throw invalid(`Feishu API ${input.id} is ${summary.risk}; use callWriteApi`);
	}
	if (mode === 'write') {
		if (summary.risk === 'read') throw invalid(`Feishu API ${input.id} is read; use callReadApi`);
		if (summary.risk === 'high-risk-write' && input.confirmHighRisk !== true) {
			throw invalid(`Feishu API ${input.id} is high-risk-write and requires confirmHighRisk`);
		}
	}
	const reason = feishuApiUnavailableReason(summary);
	if (reason) throw invalid(`Feishu API ${input.id} is unavailable: ${reason}`);
	const definition = await openapi.loadFeishuApi(input.id);
	const path = validate(definition.pathParams, input.path, 'path parameters', input.id) as Record<string, unknown> | undefined;
	const query = validate(definition.query, input.query, 'query', input.id) as Record<string, unknown> | undefined;
	const body = definition.body ? validate(definition.body, input.body, 'body', input.id) : validate(undefined, input.body, 'body', input.id);
	let request: PreparedFeishuApiCall['request'];
	try {
		request = openapi.buildFeishuApiRequest(definition, { path, query, body });
	} catch (error) {
		throw invalid(error instanceof Error ? error.message : 'Invalid Feishu API request');
	}
	return { definition, request };
}

/** Execute a prepared call and return the payload `data`; a response schema mismatch only warns. */
export async function executeFeishuApiCall(
	client: FeishuOpenApiClient,
	prepared: PreparedFeishuApiCall,
	signal: AbortSignal,
): Promise<{ id: string; data?: unknown; schemaWarning?: string }> {
	const { definition, request } = prepared;
	const result = await client.request({ method: request.method, path: request.path, query: request.query, body: request.body }, { signal });
	const isEnvelope = result !== null && typeof result === 'object' && !Array.isArray(result) && 'code' in result;
	const data = isEnvelope ? (result as { data?: unknown }).data : result;
	if (!isEnvelope || !definition.response || data === undefined) return { id: definition.id, data };
	const parsed = definition.response.safeParse(data);
	return parsed.success
		? { id: definition.id, data }
		: { id: definition.id, data, schemaWarning: `Response does not match the catalog schema: ${issues(parsed.error)}` };
}
