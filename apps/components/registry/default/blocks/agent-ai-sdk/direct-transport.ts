import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
	type ChatTransport,
	DirectChatTransport,
	type Instructions,
	isStepCount,
	ToolLoopAgent,
	type ToolLoopAgentSettings,
	type ToolSet,
	type UIMessage,
	type UIMessageChunk,
} from 'ai';
import { measureAgentRuntimeValue } from '../agent-chat/runtime-message-validation';
import type { OpenAICompatibleConnectionConfig } from './connection-config';
import { requireOpenAICompatibleConnection } from './connection-config';
import {
	type OpenAICompatibleDirectTransportLimits,
	type ResolvedOpenAICompatibleDirectTransportLimits,
	resolveOpenAICompatibleDirectTransportLimits,
	wrapBoundedResponse,
} from './direct-transport-limits';
import { toSafeAgentError } from './safe-error';

export type OpenAICompatibleDirectTransportOptions = {
	connection: OpenAICompatibleConnectionConfig;
	fetch?: typeof globalThis.fetch;
	instructions?: Instructions;
	limits?: OpenAICompatibleDirectTransportLimits;
	maxSteps?: number;
	tools?: ToolSet;
};

export function createOpenAICompatibleDirectTransport({
	connection: input,
	fetch,
	instructions,
	limits: inputLimits,
	maxSteps = 8,
	tools,
}: OpenAICompatibleDirectTransportOptions): ChatTransport<UIMessage> {
	const connection = requireOpenAICompatibleConnection(input);
	const limits = resolveOpenAICompatibleDirectTransportLimits(inputLimits);
	if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 20) {
		throw new Error('最大步骤数必须是 1 到 20 之间的整数。');
	}
	const secrets = [connection.apiKey ?? '', ...Object.values(connection.headers ?? {})].filter(Boolean);
	const baseFetch = fetch ?? globalThis.fetch;
	const safeFetch: typeof globalThis.fetch = async (request, init) => {
		try {
			return wrapBoundedResponse(await baseFetch(request, init), limits);
		} catch (error) {
			throw toSafeAgentError(error, secrets);
		}
	};
	const provider = createOpenAICompatible({
		apiKey: connection.apiKey?.trim() ? connection.apiKey : undefined,
		baseURL: connection.baseUrl,
		fetch: safeFetch,
		headers: withoutAuthorizationHeader(connection.headers),
		name: 'compatible-direct',
	});
	const agent = new ToolLoopAgent<never, ToolSet>({
		instructions,
		maxOutputTokens: limits.maxOutputTokens,
		maxRetries: limits.maxRetries,
		model: provider(connection.model),
		stopWhen: isStepCount(maxSteps),
		timeout: limits.timeout,
		tools: tools ?? {},
	} as ToolLoopAgentSettings<never, ToolSet>);
	const direct = new DirectChatTransport({
		agent,
		onError: (error) => toSafeAgentError(error, secrets).message,
	}) as unknown as ChatTransport<UIMessage>;
	return {
		async reconnectToStream(options) {
			try {
				const stream = await direct.reconnectToStream(options);
				return stream ? boundAndRedactStream(stream, secrets, limits) : null;
			} catch (error) {
				throw toSafeAgentError(error, secrets);
			}
		},
		async sendMessages(options) {
			try {
				return boundAndRedactStream(await direct.sendMessages(options), secrets, limits);
			} catch (error) {
				throw toSafeAgentError(error, secrets);
			}
		},
	};
}

function withoutAuthorizationHeader(headers?: Record<string, string>): Record<string, string> | undefined {
	if (!headers) return undefined;
	return Object.fromEntries(Object.entries(headers).filter(([name]) => name.toLowerCase() !== 'authorization'));
}

function boundAndRedactStream(
	stream: ReadableStream<UIMessageChunk>,
	secrets: readonly string[],
	limits: ResolvedOpenAICompatibleDirectTransportLimits,
) {
	const reader = stream.getReader();
	let chunks = 0;
	let projectionBytes = 0;
	return new ReadableStream<UIMessageChunk>({
		async pull(controller) {
			try {
				const result = await reader.read();
				if (result.done) {
					controller.close();
					return;
				}
				chunks += 1;
				if (chunks > limits.maxStreamChunks) {
					await cancelForLimit(reader);
					controller.error(new Error('模型输出事件数量超过客户端安全限制。'));
					return;
				}
				const remaining = limits.maxStreamProjectionBytes - projectionBytes;
				const measurement = measureAgentRuntimeValue(result.value, {
					maxArrayItems: 128,
					maxDataUrlBytes: Math.max(0, remaining),
					maxDepth: 16,
					maxNodes: 512,
					maxObjectKeys: 64,
					maxStringBytes: Math.max(0, remaining),
				});
				if (!measurement.success) {
					await cancelForLimit(reader);
					controller.error(new Error('模型输出内容超过客户端安全限制。'));
					return;
				}
				projectionBytes += measurement.stringBytes + measurement.dataUrlBytes;
				if (projectionBytes > limits.maxStreamProjectionBytes) {
					await cancelForLimit(reader);
					controller.error(new Error('模型输出内容超过客户端安全限制。'));
					return;
				}
				controller.enqueue(result.value);
			} catch (error) {
				controller.error(toSafeAgentError(error, secrets));
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
}

async function cancelForLimit(reader: ReadableStreamDefaultReader<UIMessageChunk>) {
	await reader.cancel('stream limit exceeded').catch(() => undefined);
}
