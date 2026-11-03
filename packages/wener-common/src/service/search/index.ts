import type { ServiceCallOptions } from '../runtime/types';

export interface SearchRequest {
	query: string;
	limit?: number;
	offset?: number;
	includeDomains?: readonly string[];
	excludeDomains?: readonly string[];
	range?: string;
	from?: string;
	to?: string;
	content?: { text?: boolean; summary?: boolean; maxCharacters?: number };
}

export interface SearchResultItem {
	url: string;
	title?: string;
	text?: string;
	summary?: string;
	publishedAt?: string;
	score?: number;
	metadata?: Record<string, unknown>;
}

export interface SearchResponse {
	items: SearchResultItem[];
	nextCursor?: string;
	metadata?: Record<string, unknown>;
}

/** 搜索能力不依赖具体搜索引擎或 CLI transport。 */
export interface ISearchService {
	readonly type: string;
	readonly readOnly: true;
	search(input: SearchRequest, options?: ServiceCallOptions): Promise<SearchResponse>;
	close?(): void | Promise<void>;
}
