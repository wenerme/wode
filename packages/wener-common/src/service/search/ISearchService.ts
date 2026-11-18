import { defineServiceCapability } from '../registry/ServiceCapability';
import type { ISearchServiceContract } from './SearchServiceContract';

export type { SearchContentOptions, SearchRequest, SearchResultItem, SearchResponse } from './SearchServiceContract';

/** 搜索能力不依赖具体搜索引擎或 CLI transport。 */
export interface ISearchService extends ISearchServiceContract {
	readonly type: string;
	readonly readOnly: true;
	/** Optional legacy lifecycle hook; stateless providers need not implement it. */
	close?(): void | Promise<void>;
}

/** Capability key for `ISearchService`; `registry.load(SearchServiceCapability)` resolves to `ISearchService`. */
export const SearchServiceCapability = defineServiceCapability<ISearchService>('search');
