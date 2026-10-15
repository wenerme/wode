import type { Hono } from 'hono';
import type { GenerateMessageAdapter, GenerateMessageProcessor } from '../../api/generate-message/adapter';
import type { ApiEndpoint } from '../../api/schema/ApiEndpointDef';
import type { ApiType } from '../../api/schema/ApiType';

/** Web Fetch signature without runtime-specific helpers such as Bun's preconnect. */
export type AiRouterFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** One incoming HTTP exchange. The resolver owns upstream selection and credentials. */
export interface AiRouterContext {
	readonly request: Request;
	readonly endpoint: ApiEndpoint;
	readonly body: Record<string, unknown> | FormData;
	readonly model?: string;
	readonly signal: AbortSignal;
	adapter?: GenerateMessageAdapter;
}

export interface AiRouterUpstream {
	api: ApiType;
	/** API root, optionally with a deployment prefix; endpoint paths include their version. */
	baseURL: string;
	/** Replaces the client's model alias in the upstream body or path. */
	model?: string;
	/** Only these configured credentials and headers are sent upstream. */
	headers?: HeadersInit;
	processors?: readonly GenerateMessageProcessor[];
	fetch?: AiRouterFetch;
}

export interface CreateAiRouterOptions {
	/** Return a Response to short-circuit the exchange, for example on authorization failure. */
	resolve(context: AiRouterContext): AiRouterUpstream | Response | Promise<AiRouterUpstream | Response>;
	fetch?: AiRouterFetch;
	processors?: readonly GenerateMessageProcessor[];
	/** Maximum buffered SSE event size in characters. Defaults to 4 MiB. */
	maxStreamEventSize?: number;
	/** Runs after resolution and before conversion; may short-circuit or inspect adapter diagnostics. */
	onRequest?(context: AiRouterContext): void | Response | Promise<void | Response>;
	onResponse?(response: Response, context: AiRouterContext): void | Response | Promise<void | Response>;
	/** Handles transport and conversion failures, including failures after SSE headers were sent. */
	onError?(error: unknown, context: AiRouterContext): void | Response | Promise<void | Response>;
}

export type AiRouter = Hono;
