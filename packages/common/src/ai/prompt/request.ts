import {
	createGenerateMessageAdapterContext,
	type GenerateMessageAdapterContext,
	type GenerateMessageCodec,
	type GenerateMessageRequest,
	getGenerateMessageCodec,
} from '@wener/client/api/generate-message';

import type { PreparedPromptRequest, PromptRequest } from './types';

/** Maps the four public provider aliases to the concrete client codec APIs. */
export const PromptProtocolApi = Object.freeze({
	openai: 'openai-chat-completions',
	'openai-response': 'openai-responses',
	anthropic: 'anthropic-messages',
	gemini: 'google-generative-ai',
});

export interface PreparedPromptExchange {
	prepared: PreparedPromptRequest;
	codec: GenerateMessageCodec;
	context: GenerateMessageAdapterContext;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
	return Object.keys(headers).some((key) => key.toLowerCase() === name);
}

function joinPath(baseUrl: string, path: string): string {
	const url = new URL(baseUrl);
	const base = url.pathname.replace(/\/+$/, '');
	url.pathname = `${base}${path}`.replace(/\/+/g, '/');
	return url.toString();
}

function endpoint(baseUrl: string, suffix: string): string {
	const url = new URL(baseUrl);
	const base = url.pathname.replace(/\/+$/, '');
	if (base.endsWith(suffix)) return url.toString();
	if (/\/v\d+(?:beta)?$/i.test(base)) return joinPath(baseUrl, suffix.replace(/^\/v\d+(?:beta)?/i, ''));
	return joinPath(baseUrl, suffix);
}

function geminiEndpoint(baseUrl: string, model: string, stream: boolean): string {
	const url = new URL(baseUrl);
	const action = stream ? 'streamGenerateContent' : 'generateContent';
	const base = url.pathname.replace(/\/+$/, '');
	if (/:streamGenerateContent$|:generateContent$/i.test(base)) {
		url.pathname = base.replace(/:(?:streamGenerateContent|generateContent)$/i, `:${action}`);
		if (stream) url.searchParams.set('alt', 'sse');
		else url.searchParams.delete('alt');
		return url.toString();
	}
	const encoded = encodeURIComponent(model);
	const prefix = base.endsWith('/models')
		? base
		: /\/v\d+(?:beta)?$/i.test(base)
			? `${base}/models`
			: `${base}/v1beta/models`;
	url.pathname = `${prefix}/${encoded}:${action}`.replace(/\/+/g, '/');
	if (stream) url.searchParams.set('alt', 'sse');
	return url.toString();
}

function requestUrl(input: PromptRequest): string {
	const { api, baseUrl } = input.target;
	if (api === 'gemini') return geminiEndpoint(baseUrl, input.model, input.stream === true);
	if (api === 'anthropic') return endpoint(baseUrl, '/v1/messages');
	if (api === 'openai-response') return endpoint(baseUrl, '/v1/responses');
	return endpoint(baseUrl, '/v1/chat/completions');
}

function requestHeaders(input: PromptRequest): Record<string, string> {
	const headers = { ...(input.target.headers ?? {}) };
	const { apiKey, api } = input.target;
	if (apiKey) {
		if ((api === 'openai' || api === 'openai-response') && !hasHeader(headers, 'authorization'))
			headers.Authorization = `Bearer ${apiKey}`;
		if (api === 'anthropic' && !hasHeader(headers, 'x-api-key')) headers['x-api-key'] = apiKey;
		if (api === 'gemini' && !hasHeader(headers, 'x-goog-api-key')) headers['x-goog-api-key'] = apiKey;
	}
	if (!hasHeader(headers, 'content-type')) headers['content-type'] = 'application/json';
	if (api === 'anthropic' && !hasHeader(headers, 'anthropic-version')) headers['anthropic-version'] = '2023-06-01';
	return headers;
}

function commonRequest(input: PromptRequest): GenerateMessageRequest {
	return {
		model: input.model,
		messages: input.messages,
		...(input.system === undefined ? {} : { system: [{ type: 'text', text: input.system }] }),
		...(input.temperature === undefined ? {} : { temperature: input.temperature }),
		...(input.topP === undefined ? {} : { topP: input.topP }),
		...(input.maxOutputTokens === undefined ? {} : { maxOutputTokens: input.maxOutputTokens }),
		...(input.responseFormat === undefined ? {} : { responseFormat: input.responseFormat }),
		stream: input.stream === true,
	};
}

export function preparePromptExchange(input: PromptRequest): PreparedPromptExchange {
	const api = PromptProtocolApi[input.target.api];
	const codec = getGenerateMessageCodec(api);
	if (!codec) throw new Error(`Prompt codec is unavailable for ${input.target.api}`);
	const context = createGenerateMessageAdapterContext({ source: api, target: api, model: input.model });
	const request = commonRequest(input);
	context.request = request;
	const prepared: PreparedPromptRequest = {
		url: requestUrl(input),
		method: 'POST',
		headers: requestHeaders(input),
		body: codec.encodeRequest(request, context),
	};
	return { prepared, codec, context };
}

export function preparePromptRequest(input: PromptRequest): PreparedPromptRequest {
	return preparePromptExchange(input).prepared;
}

export function redactPromptRequest(prepared: PreparedPromptRequest): PreparedPromptRequest {
	const url = new URL(prepared.url);
	if (url.username) url.username = '[REDACTED]';
	if (url.password) url.password = '[REDACTED]';
	for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, '[REDACTED]');
	return {
		...prepared,
		url: url.toString(),
		headers: Object.fromEntries(Object.keys(prepared.headers).map((key) => [key, '[REDACTED]'])),
	};
}
