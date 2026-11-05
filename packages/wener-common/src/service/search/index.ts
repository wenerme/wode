import { z } from 'zod';
import type { ServiceCallOptions } from '../runtime/types';

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

export interface SearchContentOptions {
	text?: boolean;
	summary?: boolean;
	highlights?: boolean;
	live?: boolean;
	maxCharacters?: number;
}

export interface SearchRequest {
	query: string;
	urls?: readonly string[];
	limit?: number;
	offset?: number;
	includeDomains?: readonly string[];
	excludeDomains?: readonly string[];
	range?: string;
	from?: Date | string;
	to?: Date | string;
	searchType?: string;
	category?: string;
	cursor?: string;
	content?: SearchContentOptions;
	raw?: boolean;
}

export interface SearchResultItem {
	url: string;
	title?: string;
	text?: string;
	summary?: string;
	highlights?: string[];
	publishedAt?: string;
	score?: number;
	metadata?: Record<string, unknown>;
}

export interface SearchResponse {
	items: SearchResultItem[];
	nextCursor?: string;
	metadata?: Record<string, unknown>;
	/** Sanitized supplier response, present only when explicitly requested. */
	raw?: unknown;
}

/** 搜索能力不依赖具体搜索引擎或 CLI transport。 */
export interface ISearchService {
	readonly type: string;
	readonly readOnly: true;
	search(input: SearchRequest, options?: ServiceCallOptions): Promise<SearchResponse>;
	close?(): void | Promise<void>;
}
