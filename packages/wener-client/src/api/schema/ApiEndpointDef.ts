import { ApiType } from './ApiType';

export const ApiHttpMethod = Object.freeze({
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE',
} as const);
export type ApiHttpMethod = (typeof ApiHttpMethod)[keyof typeof ApiHttpMethod];

export interface ApiEndpointDef {
	readonly type: ApiType;
	/** Canonical endpoint path. Dynamic parts use `{name}`; `{version}` is optional during matching. */
	readonly path: string;
	readonly operation: string;
	readonly methods?: readonly ApiHttpMethod[];
}

export interface ApiEndpoint {
	/** Normalized path without query or fragment. */
	readonly raw: string;
	readonly type: ApiType;
	readonly version: string;
	/** Path prefix before the version segment, without leading or trailing slash. */
	readonly prefix: string;
	readonly operation: string;
	/** Model identifier embedded in the endpoint path, when present. */
	readonly model: string;
}

const versionPattern = /^v[0-9]+(?:[a-z]+[0-9]*)?$/;

function endpoint(type: ApiType, path: string, operation: string, methods?: readonly ApiHttpMethod[]): ApiEndpointDef {
	return Object.freeze({ type, path, operation, ...(methods ? { methods: Object.freeze([...methods]) } : {}) });
}

export const ApiEndpointDefs: readonly ApiEndpointDef[] = Object.freeze([
	endpoint(ApiType.OpenAIChatCompletions, '/{version}/chat/completions', 'chat/completions', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAICompletions, '/{version}/completions', 'completions', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIResponses, '/{version}/responses', 'responses', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIResponseCompact, '/{version}/responses/compact', 'responses/compact', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIResponsesInputTokens, '/{version}/responses/input_tokens', 'responses/input_tokens', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.OpenAIModels, '/{version}/models', 'models', [ApiHttpMethod.GET]),
	endpoint(ApiType.OpenAIModels, '/{version}/models/{model}', 'models/retrieve', [ApiHttpMethod.GET]),
	endpoint(ApiType.OpenAIEmbeddings, '/{version}/embeddings', 'embeddings', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIImageGenerations, '/{version}/images/generations', 'images/generations', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIImageEdits, '/{version}/images/edits', 'images/edits', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIFiles, '/{version}/files', 'files'),
	endpoint(ApiType.OpenAIFiles, '/{version}/files/{file_id}', 'files/retrieve'),
	endpoint(ApiType.OpenAIFiles, '/{version}/files/{file_id}/content', 'files/content', [ApiHttpMethod.GET]),
	endpoint(ApiType.OpenAIUploads, '/{version}/uploads', 'uploads', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIUploads, '/{version}/uploads/{upload_id}/parts', 'uploads/parts', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIUploads, '/{version}/uploads/{upload_id}/complete', 'uploads/complete', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIUploads, '/{version}/uploads/{upload_id}/cancel', 'uploads/cancel', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIBatches, '/{version}/batches', 'batches'),
	endpoint(ApiType.OpenAIBatches, '/{version}/batches/{batch_id}', 'batches/retrieve'),
	endpoint(ApiType.OpenAIBatches, '/{version}/batches/{batch_id}/cancel', 'batches/cancel', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIAudioSpeech, '/{version}/audio/speech', 'audio/speech', [ApiHttpMethod.POST]),
	endpoint(ApiType.OpenAIAudioTranscriptions, '/{version}/audio/transcriptions', 'audio/transcriptions', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.AnthropicMessages, '/{version}/messages', 'messages', [ApiHttpMethod.POST]),
	endpoint(ApiType.AnthropicMessagesCountTokens, '/{version}/messages/count_tokens', 'messages/count_tokens', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.AnthropicMessagesBatches, '/{version}/messages/batches', 'messages/batches'),
	endpoint(ApiType.Rerank, '/{version}/rerank', 'rerank', [ApiHttpMethod.POST]),
	endpoint(ApiType.Rerank, '/{version}/reranking', 'reranking', [ApiHttpMethod.POST]),
	endpoint(ApiType.SystemOneDecision, '/{version}/systemone', 'systemone', [ApiHttpMethod.POST]),
	endpoint(ApiType.GoogleGenerativeAI, '/{version}/models/{model}:generateContent', 'generateContent', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.GoogleGenerativeAI, '/{version}/models/{model}:streamGenerateContent', 'streamGenerateContent', [
		ApiHttpMethod.POST,
	]),
	endpoint(
		ApiType.GoogleVertex,
		'/{version}/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent',
		'generateContent',
		[ApiHttpMethod.POST],
	),
	endpoint(
		ApiType.GoogleVertex,
		'/{version}/projects/{project}/locations/{location}/publishers/google/models/{model}:streamGenerateContent',
		'streamGenerateContent',
		[ApiHttpMethod.POST],
	),
	endpoint(ApiType.GoogleGenerativeAIEmbeddings, '/{version}/models/{model}:embedContent', 'embedContent', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.GoogleGenerativeAIEmbeddings, '/{version}/models/{model}:batchEmbedContents', 'batchEmbedContents', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.GoogleGenerativeAICountTokens, '/{version}/models/{model}:countTokens', 'countTokens', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.GoogleGenerativeAICachedContents, '/{version}/cachedContents', 'cachedContents'),
	endpoint(
		ApiType.GoogleVertexAnthropicMessages,
		'/{version}/projects/{project}/locations/{location}/publishers/anthropic/models/{model}:rawPredict',
		'rawPredict',
		[ApiHttpMethod.POST],
	),
	endpoint(
		ApiType.GoogleVertexAnthropicMessages,
		'/{version}/projects/{project}/locations/{location}/publishers/anthropic/models/{model}:streamRawPredict',
		'streamRawPredict',
		[ApiHttpMethod.POST],
	),
	endpoint(
		ApiType.GoogleVertexAnthropicMessagesCountTokens,
		'/{version}/projects/{project}/locations/{location}/publishers/anthropic/models/count-tokens:rawPredict',
		'rawPredict',
		[ApiHttpMethod.POST],
	),
	endpoint(ApiType.BedrockConverse, '/model/{model}/converse', 'converse', [ApiHttpMethod.POST]),
	endpoint(ApiType.BedrockConverse, '/model/{model}/converse-stream', 'converse-stream', [ApiHttpMethod.POST]),
	endpoint(ApiType.BedrockInvoke, '/model/{model}/invoke', 'invoke', [ApiHttpMethod.POST]),
	endpoint(ApiType.BedrockInvoke, '/model/{model}/invoke-with-response-stream', 'invoke-with-response-stream', [
		ApiHttpMethod.POST,
	]),
	endpoint(ApiType.SDAPITxt2Img, '/sdapi/{version}/txt2img', 'txt2img', [ApiHttpMethod.POST]),
	endpoint(ApiType.SDAPIImg2Img, '/sdapi/{version}/img2img', 'img2img', [ApiHttpMethod.POST]),
]);

const endpointDefsByType: ReadonlyMap<ApiType, readonly ApiEndpointDef[]> = new Map(
	Object.values(ApiType)
		.filter((type): type is ApiType => typeof type === 'string')
		.map((type) => [type, Object.freeze(ApiEndpointDefs.filter((endpoint) => endpoint.type === type))]),
);

export function getApiEndpointDefs(type: ApiType): readonly ApiEndpointDef[] {
	return endpointDefsByType.get(type) ?? [];
}

function normalizePath(pathOrUrl: string): string {
	const value = pathOrUrl.trim();
	if (!value) return '';
	try {
		const url = new URL(value);
		if (url.protocol && url.hostname) return url.pathname || '/';
	} catch {
		// Treat non-URL input as a path below.
	}
	if (
		!value.startsWith('/') &&
		/^[^/?#]+\//.test(value) &&
		/^[^/?#]+\.(?:[a-z0-9-]+|localhost)(?::\d+)?\//i.test(value)
	) {
		try {
			return new URL(`https://${value}`).pathname || '/';
		} catch {
			// Treat malformed host-like input as a path below.
		}
	}
	return value.split(/[?#]/, 1)[0] || '/';
}

function segments(path: string): string[] {
	return path
		.split('/')
		.filter(Boolean)
		.map((segment) => {
			try {
				return decodeURIComponent(segment);
			} catch {
				return segment;
			}
		});
}

function splitVersion(parts: readonly string[]): { version: string; prefix: string } {
	for (let index = parts.length - 1; index >= 0; index--) {
		if (versionPattern.test(parts[index])) {
			return { version: parts[index], prefix: parts.slice(0, index).join('/') };
		}
	}
	return { version: '', prefix: parts.join('/') };
}

function parseGoogle(parts: readonly string[]): ApiEndpoint | undefined {
	const index = parts.findIndex(
		(part, position) => position > 0 && parts[position - 1] === 'models' && part.includes(':'),
	);
	if (index < 0) return undefined;
	const [model, operation] = parts[index].split(':', 2);
	const isVertex = parts
		.slice(0, index - 1)
		.some((part, position) => part === 'publishers' && parts[position + 1] === 'google');
	const type =
		operation === 'generateContent' || operation === 'streamGenerateContent'
			? isVertex
				? ApiType.GoogleVertex
				: ApiType.GoogleGenerativeAI
			: operation === 'embedContent' || operation === 'batchEmbedContents'
				? ApiType.GoogleGenerativeAIEmbeddings
				: operation === 'countTokens'
					? ApiType.GoogleGenerativeAICountTokens
					: undefined;
	if (!type || !model) return undefined;
	const { version, prefix } = splitVersion(parts.slice(0, index - 1));
	return { raw: `/${parts.join('/')}`, type, version, prefix, operation, model };
}

function parseBedrock(parts: readonly string[]): ApiEndpoint | undefined {
	if (parts[0] !== 'model' || parts.length < 3) return undefined;
	const operation = parts.at(-1) as string;
	const type =
		operation === 'converse' || operation === 'converse-stream'
			? ApiType.BedrockConverse
			: operation === 'invoke' || operation === 'invoke-with-response-stream'
				? ApiType.BedrockInvoke
				: undefined;
	if (!type) return undefined;
	return { raw: `/${parts.join('/')}`, type, version: '', prefix: '', operation, model: parts.slice(1, -1).join('/') };
}

function parseGeneric(parts: readonly string[], method?: ApiHttpMethod): ApiEndpoint | undefined {
	for (const definition of ApiEndpointDefs) {
		if (definition.path.includes(':') || definition.path.startsWith('/model/')) continue;
		const templateParts = definition.path.split('/').filter(Boolean);
		const versionIndex = templateParts.indexOf('{version}');
		const candidates =
			versionIndex >= 0
				? [
						{ pathParts: templateParts, versionIndex },
						{ pathParts: templateParts.filter((_, index) => index !== versionIndex), versionIndex: -1 },
					]
				: [{ pathParts: templateParts, versionIndex: -1 }];
		for (const candidate of candidates) {
			const { pathParts } = candidate;
			const start = parts.length - pathParts.length;
			if (start < 0) continue;
			const actual = parts.slice(start, start + pathParts.length);
			const matches = pathParts.every((part, index) => {
				const actualPart = actual[index];
				if (actualPart === undefined) return false;
				if (part === '{version}') return versionPattern.test(actualPart);
				return part.startsWith('{') && part.endsWith('}') ? actualPart.length > 0 : part === actualPart;
			});
			if (!matches) continue;
			if (definition.methods && method && !definition.methods.includes(method)) continue;
			const version = candidate.versionIndex >= 0 ? (actual[candidate.versionIndex] ?? '') : '';
			const prefixParts = parts.slice(0, start);
			if (candidate.versionIndex >= 0) prefixParts.push(...actual.slice(0, candidate.versionIndex));
			const prefix = prefixParts.join('/');
			const modelIndex = pathParts.indexOf('{model}');
			const model = modelIndex >= 0 ? (actual[modelIndex] ?? '') : '';
			let operation = definition.operation;
			if (definition.type === ApiType.OpenAIBatches && operation === 'batches' && method) {
				if (method === ApiHttpMethod.GET) operation = 'batches/list';
				else if (method === ApiHttpMethod.POST) operation = 'batches/create';
				else continue;
			}
			if (definition.type === ApiType.AnthropicMessagesBatches && operation === 'messages/batches' && method) {
				if (method === ApiHttpMethod.GET) operation = 'messages/batches/list';
				else if (method === ApiHttpMethod.POST) operation = 'messages/batches/create';
				else continue;
			}
			return {
				raw: `/${parts.join('/')}`,
				type: definition.type,
				version,
				prefix,
				operation,
				model,
			};
		}
	}
	return undefined;
}

export function parseApiEndpoint(pathOrUrl: string, method?: ApiHttpMethod): ApiEndpoint | undefined {
	const raw = normalizePath(pathOrUrl);
	const parts = segments(raw);
	if (!parts.length) return undefined;
	const parsed = parseBedrock(parts) ?? parseGoogle(parts) ?? parseGeneric(parts, method);
	return parsed ? { ...parsed, raw } : undefined;
}

export function parseApiTypeFromEndpoint(pathOrUrl: string, method?: ApiHttpMethod): ApiType | undefined {
	return parseApiEndpoint(pathOrUrl, method)?.type;
}
