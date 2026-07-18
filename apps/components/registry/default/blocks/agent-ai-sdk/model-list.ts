import { z } from 'zod';
import { validateOpenAICompatibleBaseUrl } from './connection-config';

export const OPENAI_MODEL_LIST_DEFAULT_TIMEOUT_MS = 10_000;
export const OPENAI_MODEL_LIST_DEFAULT_MAX_BYTES = 1024 * 1024;
export const OPENAI_MODEL_LIST_MAX_MODELS = 1000;

export type OpenAICompatibleModel = {
	created?: number;
	id: string;
	ownedBy?: string;
};

export type OpenAICompatibleModelListConfig = {
	apiKey?: string;
	baseUrl: string;
	headers?: Record<string, string>;
};

export type OpenAICompatibleModelListOptions = {
	fetch?: typeof globalThis.fetch;
	maxResponseBytes?: number;
	signal?: AbortSignal;
	timeoutMs?: number;
};

export class OpenAICompatibleModelListError extends Error {
	readonly code:
		| 'aborted'
		| 'connection'
		| 'invalid-config'
		| 'invalid-response'
		| 'response-too-large'
		| 'status'
		| 'timeout';

	constructor(code: OpenAICompatibleModelListError['code'], message: string) {
		super(message);
		this.name = 'OpenAICompatibleModelListError';
		this.code = code;
	}
}

const modelSchema = z
	.object({
		created: z.number().int().nonnegative().optional(),
		id: z.string().min(1).max(256),
		object: z.literal('model').optional(),
		owned_by: z.string().max(256).optional(),
	})
	.passthrough();
const modelListSchema = z
	.object({ object: z.literal('list'), data: z.array(modelSchema).max(OPENAI_MODEL_LIST_MAX_MODELS) })
	.passthrough();

export async function listOpenAICompatibleModels(
	config: OpenAICompatibleModelListConfig,
	options: OpenAICompatibleModelListOptions = {},
): Promise<OpenAICompatibleModel[]> {
	const baseUrl = validateOpenAICompatibleBaseUrl(config.baseUrl);
	if (!baseUrl.success) throw new OpenAICompatibleModelListError('invalid-config', baseUrl.message);
	if (options.signal?.aborted) {
		throw new OpenAICompatibleModelListError('aborted', '模型列表请求已取消。');
	}
	const timeoutMs = resolveBound(options.timeoutMs, OPENAI_MODEL_LIST_DEFAULT_TIMEOUT_MS, 60_000);
	const maxBytes = resolveBound(options.maxResponseBytes, OPENAI_MODEL_LIST_DEFAULT_MAX_BYTES, 4 * 1024 * 1024);
	const controller = new AbortController();
	let timedOut = false;
	const abortFromCaller = () => controller.abort(options.signal?.reason);
	options.signal?.addEventListener('abort', abortFromCaller, { once: true });
	const timer = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, timeoutMs);
	const headers = new Headers(config.headers);
	headers.set('Accept', 'application/json');
	headers.delete('Authorization');
	if (config.apiKey?.trim()) headers.set('Authorization', `Bearer ${config.apiKey}`);
	try {
		const response = await (options.fetch ?? globalThis.fetch)(`${baseUrl.value}/models`, {
			headers,
			method: 'GET',
			signal: controller.signal,
		});
		if (!response.ok) {
			throw new OpenAICompatibleModelListError('status', `模型列表请求失败（HTTP ${response.status}）。`);
		}
		const contentType = response.headers.get('content-type');
		if (contentType && !/\bapplication\/(?:[\w.+-]+\+)?json\b/iu.test(contentType)) {
			throw new OpenAICompatibleModelListError('invalid-response', '模型列表响应不是 JSON。');
		}
		const text = await readBoundedResponseText(response, maxBytes);
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new OpenAICompatibleModelListError('invalid-response', '模型列表响应不是有效 JSON。');
		}
		const validated = modelListSchema.safeParse(parsed);
		if (!validated.success) {
			throw new OpenAICompatibleModelListError('invalid-response', '模型列表响应不符合 OpenAI models list 格式。');
		}
		const seen = new Set<string>();
		return validated.data.data.flatMap((model) => {
			if (seen.has(model.id)) return [];
			seen.add(model.id);
			return [{ id: model.id, created: model.created, ownedBy: model.owned_by }];
		});
	} catch (error) {
		if (error instanceof OpenAICompatibleModelListError) throw error;
		if (controller.signal.aborted) {
			throw new OpenAICompatibleModelListError(
				timedOut ? 'timeout' : 'aborted',
				timedOut ? '模型列表请求超时。' : '模型列表请求已取消。',
			);
		}
		throw new OpenAICompatibleModelListError('connection', '无法连接到模型服务。');
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener('abort', abortFromCaller);
	}
}

async function readBoundedResponseText(response: Response, maxBytes: number): Promise<string> {
	const contentLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > maxBytes) {
		throw new OpenAICompatibleModelListError('response-too-large', '模型列表响应超过大小限制。');
	}
	if (!response.body) return '';
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel();
				throw new OpenAICompatibleModelListError('response-too-large', '模型列表响应超过大小限制。');
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		throw new OpenAICompatibleModelListError('invalid-response', '模型列表响应不是有效 UTF-8。');
	}
}

function resolveBound(value: number | undefined, fallback: number, maximum: number): number {
	return Number.isFinite(value) && value !== undefined && value > 0 ? Math.min(Math.floor(value), maximum) : fallback;
}
