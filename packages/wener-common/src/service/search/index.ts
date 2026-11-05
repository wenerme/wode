import { z } from 'zod';

export type { SearchContentOptions, SearchRequest, SearchResultItem, SearchResponse, ISearchService } from './ISearchService';

export const SearchContentOptionsSchema = z.strictObject({
	text: z.boolean().optional(),
	summary: z.boolean().optional(),
	highlights: z.boolean().optional(),
	live: z.boolean().optional(),
	maxCharacters: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
});

export const SearchRequestSchema = z.strictObject({
	query: z.string().regex(/\S/),
	urls: z.array(z.string().url()).optional(),
	limit: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
	includeDomains: z.array(z.string().min(1)).optional(),
	excludeDomains: z.array(z.string().min(1)).optional(),
	range: z.string().optional(),
	from: z.union([z.string(), z.date()]).optional(),
	to: z.union([z.string(), z.date()]).optional(),
	searchType: z.string().min(1).optional(),
	category: z.string().min(1).optional(),
	cursor: z.string().optional(),
	content: SearchContentOptionsSchema.optional(),
	raw: z.boolean().optional(),
});