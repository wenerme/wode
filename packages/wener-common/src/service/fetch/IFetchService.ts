import type { ServiceCallOptions } from '../runtime/types';

export interface FetchRequest {
	url: string;
	maxCharacters?: number;
	text?: boolean;
	summary?: boolean;
	highlights?: boolean;
	live?: boolean;
	/** Extract the main content; defaults to true. */
	main?: boolean;
	/** Include provider metadata; presentation remains the caller's responsibility. */
	metadata?: boolean;
	raw?: boolean;
}

export interface FetchResponse {
	url: string;
	content: string;
	contentType?: string;
	title?: string;
	summary?: string;
	highlights?: string[];
	description?: string;
	publishedDate?: string;
	author?: string;
	metadata?: Record<string, unknown>;
	/** Sanitized supplier response, present only when explicitly requested. */
	raw?: unknown;
}

/** 页面内容获取；与底层 Web Fetch 的 Response 接口分离。 */
export interface IFetchService {
	readonly type: string;
	readonly readOnly: true;
	fetch(input: FetchRequest, options?: ServiceCallOptions): Promise<FetchResponse>;
	close?(): void | Promise<void>;
}
