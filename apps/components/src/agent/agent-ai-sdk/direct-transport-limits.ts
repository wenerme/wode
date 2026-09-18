export type OpenAICompatibleDirectTransportTimeouts = {
	chunkMs?: number;
	stepMs?: number;
	toolMs?: number;
	totalMs?: number;
};

export type OpenAICompatibleDirectTransportLimits = {
	maxOutputTokens?: number;
	maxResponseBytes?: number;
	maxResponseChunks?: number;
	maxRetries?: number;
	maxStreamChunks?: number;
	maxStreamProjectionBytes?: number;
	timeout?: OpenAICompatibleDirectTransportTimeouts;
};

export type ResolvedOpenAICompatibleDirectTransportLimits = {
	maxOutputTokens: number;
	maxResponseBytes: number;
	maxResponseChunks: number;
	maxRetries: number;
	maxStreamChunks: number;
	maxStreamProjectionBytes: number;
	timeout: Required<OpenAICompatibleDirectTransportTimeouts>;
};

export const OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS: ResolvedOpenAICompatibleDirectTransportLimits = {
	maxOutputTokens: 8_192,
	maxResponseBytes: 8 * 1024 * 1024,
	maxResponseChunks: 16_384,
	maxRetries: 2,
	maxStreamChunks: 16_384,
	maxStreamProjectionBytes: 8 * 1024 * 1024,
	timeout: {
		chunkMs: 20_000,
		stepMs: 60_000,
		toolMs: 30_000,
		totalMs: 120_000,
	},
};

export function resolveOpenAICompatibleDirectTransportLimits(
	limits: OpenAICompatibleDirectTransportLimits = {},
): ResolvedOpenAICompatibleDirectTransportLimits {
	return {
		maxOutputTokens: boundedInteger(
			limits.maxOutputTokens,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxOutputTokens,
			1,
			'maxOutputTokens',
		),
		maxResponseBytes: boundedInteger(
			limits.maxResponseBytes,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxResponseBytes,
			1,
			'maxResponseBytes',
		),
		maxResponseChunks: boundedInteger(
			limits.maxResponseChunks,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxResponseChunks,
			1,
			'maxResponseChunks',
		),
		maxRetries: boundedInteger(
			limits.maxRetries,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxRetries,
			0,
			'maxRetries',
		),
		maxStreamChunks: boundedInteger(
			limits.maxStreamChunks,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxStreamChunks,
			1,
			'maxStreamChunks',
		),
		maxStreamProjectionBytes: boundedInteger(
			limits.maxStreamProjectionBytes,
			OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.maxStreamProjectionBytes,
			1,
			'maxStreamProjectionBytes',
		),
		timeout: {
			chunkMs: timeoutValue(limits.timeout?.chunkMs, 'chunkMs'),
			stepMs: timeoutValue(limits.timeout?.stepMs, 'stepMs'),
			toolMs: timeoutValue(limits.timeout?.toolMs, 'toolMs'),
			totalMs: timeoutValue(limits.timeout?.totalMs, 'totalMs'),
		},
	};
}

export function wrapBoundedResponse(
	response: Response,
	limits: Pick<ResolvedOpenAICompatibleDirectTransportLimits, 'maxResponseBytes' | 'maxResponseChunks'>,
): Response {
	if (!response.body) return response;
	const reader = response.body.getReader();
	let bytes = 0;
	let chunks = 0;
	const body = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const result = await reader.read();
				if (result.done) {
					controller.close();
					return;
				}
				chunks += 1;
				bytes += result.value.byteLength;
				if (chunks > limits.maxResponseChunks || bytes > limits.maxResponseBytes) {
					await reader.cancel('response limit exceeded').catch(() => undefined);
					controller.error(new Error('模型响应超过客户端安全限制。'));
					return;
				}
				controller.enqueue(result.value);
			} catch (error) {
				controller.error(error);
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
	return new Response(body, {
		headers: response.headers,
		status: response.status,
		statusText: response.statusText,
	});
}

function timeoutValue(value: number | undefined, name: keyof OpenAICompatibleDirectTransportTimeouts): number {
	return boundedInteger(value, OPENAI_COMPATIBLE_DIRECT_TRANSPORT_CEILINGS.timeout[name]!, 1, `timeout.${name}`);
}

function boundedInteger(value: number | undefined, ceiling: number, minimum: number, name: string): number {
	if (value === undefined) return ceiling;
	if (!Number.isInteger(value) || value < minimum || value > ceiling) {
		throw new Error(`${name} 必须是 ${minimum} 到 ${ceiling} 之间的整数。`);
	}
	return value;
}
