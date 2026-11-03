import type { ServiceCallOptions } from '../runtime/types';

export interface FetchRequest {
	url: string;
	maxCharacters?: number;
}

export interface FetchResponse {
	url: string;
	content: string;
	contentType?: string;
	title?: string;
	metadata?: Record<string, unknown>;
}

/** 页面内容获取；与底层 Web Fetch 的 Response 接口分离。 */
export interface IFetchService {
	readonly type: string;
	readonly readOnly: true;
	fetch(input: FetchRequest, options?: ServiceCallOptions): Promise<FetchResponse>;
	close?(): void | Promise<void>;
}
