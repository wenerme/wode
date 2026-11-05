import type { ListTopicResponse, SearchLogResponse } from '@wener/client/tencent/cls';
import { defineServiceCapability } from '../registry/ServiceCapability';

export interface TencentClsQueryInput {
	/** Topic IDs or names; 1-20 entries. Mixed IDs and names are resolved against the CLS API. */
	topic: readonly string[];
	/** CQL/SQL query expression. */
	query: string;
	/** Range start, Unix epoch milliseconds. */
	from: number;
	/** Range end, Unix epoch milliseconds. */
	to: number;
	limit?: number;
	sort?: 'asc' | 'desc';
	/** Pagination cursor returned by a previous query. */
	cursor?: string;
	/** Treat `query` as including a SQL analysis clause. */
	sql?: boolean;
}

export interface TencentClsListTopicInput {
	search?: string;
	limit?: number;
	offset?: number;
}

export interface ITencentClsService extends AsyncDisposable {
	readonly type: 'cls';
	readonly readOnly: true;
	query(input: TencentClsQueryInput, options?: { signal?: AbortSignal }): Promise<SearchLogResponse>;
	listTopic(input?: TencentClsListTopicInput, options?: { signal?: AbortSignal }): Promise<ListTopicResponse>;
	close(): Promise<void>;
}
export type TencentClsService = ITencentClsService;

/** Capability key for `ITencentClsService`; `registry.load(TencentClsServiceCapability)` resolves to `ITencentClsService`. */
export const TencentClsServiceCapability = defineServiceCapability<ITencentClsService>('cls');
