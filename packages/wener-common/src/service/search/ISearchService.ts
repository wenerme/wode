import type { ServiceCallOptions } from '../runtime/types';
import { defineServiceCapability } from '../registry/ServiceCapability';

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

/** Capability key for `ISearchService`; `registry.load(SearchServiceCapability)` resolves to `ISearchService`. */
export const SearchServiceCapability = defineServiceCapability<ISearchService>('search');
