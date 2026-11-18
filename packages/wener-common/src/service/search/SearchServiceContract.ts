import {
	oc,
	type ContractRouterClient,
	type InferContractRouterInputs,
	type InferContractRouterOutputs,
} from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

export const SearchContentOptionsSchema = z.strictObject({
	text: z.boolean().optional(),
	summary: z.boolean().optional(),
	highlights: z.boolean().optional(),
	live: z.boolean().optional(),
	maxCharacters: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
});

// Accept the existing readonly request arrays while parsing to mutable provider inputs.
const urls: z.ZodType<string[], readonly string[]> = z.array(z.string().url());
const domains: z.ZodType<string[], readonly string[]> = z.array(z.string().min(1));
// Local providers accept Date; JSON transports represent it as a string.
const date = z.union([z.string(), z.date()]).meta({ type: 'string' });

export const SearchRequestSchema = z.strictObject({
	query: z.string().regex(/\S/),
	urls: urls.optional(),
	limit: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
	includeDomains: domains.optional(),
	excludeDomains: domains.optional(),
	range: z.string().optional(),
	from: date.optional(),
	to: date.optional(),
	searchType: z.string().min(1).optional(),
	category: z.string().min(1).optional(),
	cursor: z.string().optional(),
	content: SearchContentOptionsSchema.optional(),
	raw: z.boolean().optional(),
});

/** Common result fields are validated; supplier extensions remain dynamic and are preserved. */
export const SearchResultItemSchema = z.object({
	url: z.string(),
	title: z.string().optional(),
	text: z.string().optional(),
	summary: z.string().optional(),
	highlights: z.array(z.string()).optional(),
	publishedAt: z.string().optional(),
	score: z.number().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
}).catchall(z.unknown());

/**
 * The normalized envelope is shared by Exa and DuckDuckGo. Metadata and supplier
 * extensions are open records, not a closed supplier protocol. Raw remains unknown:
 * it may contain original supplier JSON, HTML, or a generic provider response.
 */
export const SearchResponseSchema = z.object({
	items: z.array(SearchResultItemSchema),
	nextCursor: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	// Explicit JSON types also keep optional unknown compilable by the shared schema exporter.
	raw: z.unknown().optional().meta({ type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }),
}).catchall(z.unknown());

export const SearchServiceContract = {
	search: oc.input(SearchRequestSchema).output(SearchResponseSchema).meta(readOnlyTool),
};

export type SearchServiceInputs = InferContractRouterInputs<typeof SearchServiceContract>;
export type SearchServiceOutputs = InferContractRouterOutputs<typeof SearchServiceContract>;
/** Search currently supports cancellation only; no per-call transport context is defined. */
export type SearchServiceClientContext = Record<string, never>;
export type ISearchServiceContract = ContractRouterClient<typeof SearchServiceContract, SearchServiceClientContext>;
export type SearchServiceCallOptions = NonNullable<Parameters<ISearchServiceContract['search']>[1]>;

export type SearchContentOptions = z.infer<typeof SearchContentOptionsSchema>;
export type SearchRequest = SearchServiceInputs['search'];
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
export type SearchResponse = SearchServiceOutputs['search'];
