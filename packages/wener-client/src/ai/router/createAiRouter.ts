import { Hono } from 'hono';
import { createGenerateMessageAdapter, type GenerateMessageProcessor } from '../../api/generate-message/adapter';
import type { GenerateMessageError } from '../../api/generate-message/adapter/types';
import { type ApiEndpoint, parseApiEndpoint } from '../../api/schema/ApiEndpointDef';
import { ApiType } from '../../api/schema/ApiType';
import { createAiRouterStream } from './sse';
import type { AiRouter, AiRouterContext, AiRouterUpstream, CreateAiRouterOptions } from './types';

const conversational = new Set<ApiType>([
	ApiType.OpenAIChatCompletions,
	ApiType.OpenAIResponses,
	ApiType.AnthropicMessages,
	ApiType.GoogleGenerativeAI,
]);
const native = new Set<ApiType>([
	ApiType.OpenAIEmbeddings,
	ApiType.Rerank,
	ApiType.OpenAIImageGenerations,
	ApiType.OpenAIImageEdits,
	ApiType.OpenAIAudioSpeech,
	ApiType.OpenAIAudioTranscriptions,
	ApiType.SystemOneDecision,
]);

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { ...Object.fromEntries(new Headers(headers)), 'content-type': 'application/json' },
	});

function modelFrom(body: AiRouterContext['body'], endpoint: ApiEndpoint): string | undefined {
	const model = body instanceof FormData ? body.get('model') : body.model;
	return endpoint.model || (typeof model === 'string' ? model : undefined);
}

function upstreamURL(baseURL: string, path: string): URL {
	const base = new URL(baseURL);
	if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Upstream must use HTTP or HTTPS');
	const endpoint = new URL(path, 'http://endpoint.invalid');
	const version = endpoint.pathname.split('/')[1];
	let prefix = base.pathname.replace(/\/$/, '');
	if (/^v\d/.test(version) && prefix.endsWith(`/${version}`)) prefix = prefix.slice(0, -(version.length + 1));
	base.pathname = `${prefix}${endpoint.pathname}`;
	base.search = endpoint.search;
	base.hash = '';
	return base;
}

function nativePath(endpoint: ApiEndpoint): string {
	return `/v1/${endpoint.operation}`;
}

function conversationPath(api: ApiType): string {
	switch (api) {
		case ApiType.OpenAIChatCompletions:
			return '/v1/chat/completions';
		case ApiType.OpenAIResponses:
			return '/v1/responses';
		case ApiType.AnthropicMessages:
			return '/v1/messages';
		default:
			throw new Error('Upstream protocol needs an encoded request path');
	}
}

/** Creates a portable Fetch application. Mount it in Hono or pass its fetch method to a client SDK. */
export function createAiRouter(options: CreateAiRouterOptions): AiRouter {
	const app = new Hono();
	const localError = async (api: ApiType, status: number, message: string) => {
		if (!conversational.has(api)) return json({ error: { message } }, status);
		const adapter = createGenerateMessageAdapter({ source: api, target: api, processors: options.processors });
		const converted = await adapter.error({ kind: status === 400 ? 'invalid-request' : 'server', status, message });
		return json(converted.body, status);
	};
	app.post('*', async (c) => {
		const request = c.req.raw;
		const endpoint = parseApiEndpoint(request.url, 'POST');
		if (!endpoint || (!conversational.has(endpoint.type) && !native.has(endpoint.type))) return c.notFound();
		let body: AiRouterContext['body'];
		try {
			if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
				body = await request.formData();
			} else {
				const value: unknown = await request.json();
				if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
				body = value as Record<string, unknown>;
			}
		} catch {
			return localError(endpoint.type, 400, 'Invalid request body');
		}
		const controller = new AbortController();
		const signal = AbortSignal.any([request.signal, controller.signal]);
		const context: AiRouterContext = { request, endpoint, body, model: modelFrom(body, endpoint), signal };
		const streamState: { finished: boolean; error?: GenerateMessageError } = { finished: false };
		let upstream: AiRouterUpstream | undefined;
		let phase: 'resolve' | 'request' | 'fetch' | 'response' = 'resolve';
		try {
			const resolved = await options.resolve(context);
			if (resolved instanceof Response) return resolved;
			upstream = resolved;
			phase = 'request';
			const headers = new Headers(upstream.headers);
			headers.delete('content-length');
			let encoded: { body: unknown; path?: string };
			if (conversational.has(endpoint.type) && conversational.has(upstream.api)) {
				if (body instanceof FormData) throw new Error('Conversational endpoints require JSON');
				const transport: GenerateMessageProcessor = {
					name: 'router-transport',
					priority: Number.NEGATIVE_INFINITY,
					onStreamEvent(event) {
						if (event.type === 'finish') streamState.finished = true;
						if (event.type === 'error') streamState.error = event.error;
					},
					onRequest(value) {
						return {
							...value,
							...(endpoint.type === ApiType.GoogleGenerativeAI
								? { stream: endpoint.operation === 'streamGenerateContent' }
								: {}),
							...(upstream?.model === undefined ? {} : { model: upstream.model }),
						};
					},
				};
				context.adapter = createGenerateMessageAdapter({
					source: endpoint.type,
					target: upstream.api,
					model: context.model,
					signal,
					processors: [...(options.processors ?? []), ...(upstream.processors ?? []), transport],
				});
				const intercepted = await options.onRequest?.(context);
				if (intercepted instanceof Response) return intercepted;
				encoded = await context.adapter.request(body);
				encoded.path ??= conversationPath(upstream.api);
				headers.set('content-type', 'application/json');
				if (upstream.api === ApiType.AnthropicMessages && !headers.has('anthropic-version')) {
					headers.set('anthropic-version', '2023-06-01');
				}
			} else if (native.has(endpoint.type) && upstream.api === endpoint.type) {
				const intercepted = await options.onRequest?.(context);
				if (intercepted instanceof Response) return intercepted;
				if (body instanceof FormData) {
					if (upstream.model !== undefined) body.set('model', upstream.model);
					headers.delete('content-type');
					encoded = { body, path: nativePath(endpoint) };
				} else {
					encoded = {
						body: { ...body, ...(upstream.model === undefined ? {} : { model: upstream.model }) },
						path: nativePath(endpoint),
					};
					headers.set('content-type', 'application/json');
				}
			} else {
				return localError(endpoint.type, 400, 'Unsupported protocol conversion');
			}
			const url = upstreamURL(upstream.baseURL, encoded.path as string);
			phase = 'fetch';
			const response = await (upstream.fetch ?? options.fetch ?? globalThis.fetch)(url, {
				method: 'POST',
				headers,
				body: encoded.body instanceof FormData ? encoded.body : JSON.stringify(encoded.body),
				signal,
			});
			phase = 'response';
			let output: Response;
			if (!context.adapter) {
				// Native APIs retain binary, multipart-related metadata and provider-specific envelopes.
				output = response;
			} else if (!response.ok) {
				const text = await response.text();
				let errorBody: unknown;
				try {
					errorBody = JSON.parse(text);
				} catch {
					errorBody = { error: { message: text || response.statusText } };
				}
				const converted = await context.adapter.error({ status: response.status, body: errorBody });
				const errorHeaders = new Headers();
				const retryAfter = response.headers.get('retry-after');
				if (retryAfter) errorHeaders.set('retry-after', retryAfter);
				output = json(converted.body, converted.status, errorHeaders);
			} else if (context.adapter.context.request?.stream) {
				if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
					await response.body?.cancel();
					throw new Error('Expected an upstream SSE response');
				}
				output = new Response(
					createAiRouterStream({
						adapter: context.adapter,
						state: streamState,
						body: response.body,
						signal,
						maxBufferSize: options.maxStreamEventSize ?? 4 * 1024 * 1024,
						onCancel: () => controller.abort(),
						onError: async (error) => {
							await options.onError?.(error, context);
						},
					}),
					{ headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } },
				);
			} else {
				const wire: unknown = await response.json();
				const record = wire && typeof wire === 'object' ? (wire as Record<string, unknown>) : undefined;
				if (upstream.api === ApiType.OpenAIResponses && record?.status === 'failed') {
					const failure = record.error;
					const converted = await context.adapter.error(
						failure && typeof failure === 'object'
							? { body: { error: failure } }
							: { kind: 'server', status: 502, message: 'Upstream response failed' },
					);
					const message =
						failure && typeof failure === 'object' && 'message' in failure
							? String(failure.message)
							: 'Upstream response failed';
					const handled = await options.onError?.(new Error(message), context);
					output = handled instanceof Response ? handled : json(converted.body, converted.status);
				} else {
					output = json(await context.adapter.response(wire));
				}
			}
			return (await options.onResponse?.(output, context)) ?? output;
		} catch (error) {
			controller.abort();
			const handled = await options.onError?.(error, context);
			if (handled instanceof Response) return handled;
			const status = phase === 'request' ? 400 : 502;
			const message = phase === 'request' ? 'Request conversion failed' : 'Upstream request failed';
			if (context.adapter) {
				const converted = await context.adapter.error({
					kind: status === 400 ? 'invalid-request' : 'server',
					status,
					message,
				});
				return json(converted.body, status);
			}
			return localError(endpoint.type, status, message);
		}
	});
	return app;
}
