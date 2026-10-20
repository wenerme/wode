import {
	Client,
	type ClientOptions,
	type RequestOptions,
	SdkError,
	SdkErrorCode,
	SdkHttpError,
	StreamableHTTPClientTransport,
	type Transport,
} from '@modelcontextprotocol/client';

export type ConnectMcpClientInput = {
	/** 每次连接尝试新建一个 transport（transport 不能复用：协商失败回退时要重建）。 */
	createTransport: () => Transport;
	clientInfo: ConstructorParameters<typeof Client>[0];
	clientOptions?: Omit<ClientOptions, 'versionNegotiation'>;
	requestOptions?: RequestOptions;
	/**
	 * 版本协商。默认 `auto`：Streamable HTTP 先用 `server/discover` 探测 2026-07-28，不是新协议就回退 2025 initialize。
	 * SSE（2025 已废弃的 transport）、stdio 与进程内 transport 固定用 `legacy`：
	 * stdio 下 `auto` 会额外起一个探测子进程，进程内对端只讲 2025。
	 */
	versionNegotiation?: 'auto' | 'legacy';
	/**
	 * 每次尝试创建 client/transport 后、connect 之前回调：调用方在超时或取消时据此关闭仍在连接中的实例，避免泄漏。
	 */
	onAttempt?: (attempt: ConnectedMcpClient) => void;
};

export type ConnectedMcpClient = { client: Client; transport: Transport };

/**
 * 统一的 MCP 客户端连接：对 Streamable HTTP 默认 `auto` 协商。SDK 在以下情况不回退而是直接失败：
 * 探测返回 5xx、拿到无法识别的 2xx。第三方 MCP 可能这样回应未知方法，这里再用 legacy 重连一次，保持 v1 时的可用性。
 * 只在“服务端回了 HTTP 响应”时回退；fetch 抛错（网络不通、SSRF/地址守卫拒绝、宿主把 401/403 转成异常）、
 * 认证失败、超时和取消都不回退，原样抛出，避免带凭据的请求多发一次。
 */
export async function connectMcpClient(input: ConnectMcpClientInput): Promise<ConnectedMcpClient> {
	const first = input.createTransport();
	const mode = input.versionNegotiation ?? 'auto';
	if (mode === 'legacy' || !(first instanceof StreamableHTTPClientTransport))
		return connectOnce(input, first, 'legacy');
	try {
		return await connectOnce(input, first, 'auto');
	} catch (error) {
		if (!shouldRetryLegacy(error, input.requestOptions?.signal)) throw unwrapProbeError(error);
		return connectOnce(input, input.createTransport(), 'legacy');
	}
}

async function connectOnce(
	input: ConnectMcpClientInput,
	transport: Transport,
	mode: 'auto' | 'legacy',
): Promise<ConnectedMcpClient> {
	const client = new Client(input.clientInfo, { ...input.clientOptions, versionNegotiation: { mode } });
	input.onAttempt?.({ client, transport });
	try {
		await client.connect(transport, input.requestOptions);
		return { client, transport };
	} catch (error) {
		await Promise.allSettled([client.close(), transport.close()]);
		throw error;
	}
}

/**
 * 探测阶段 fetch 抛出的异常被 SDK 包成 `SdkError(EraNegotiationFailed, { cause })`；
 * 还原成原始异常，宿主的错误类型（端点 404、认证、地址守卫等）与 legacy 连接时一致。
 */
function unwrapProbeError(error: unknown): unknown {
	if (!(error instanceof SdkError) || error instanceof SdkHttpError) return error;
	if (error.code !== SdkErrorCode.EraNegotiationFailed || error.message.startsWith(UnusableReplyMessage)) return error;
	return error.cause ?? error;
}

/** SDK 对“2xx 但无法识别的回复”的消息前缀（probeClassifier 的 unusable-reply）；网络错误同一 code 但前缀不同。 */
const UnusableReplyMessage = 'Version negotiation probe failed: the server answered with an unusable reply';

function shouldRetryLegacy(error: unknown, signal: AbortSignal | undefined): boolean {
	if (signal?.aborted) return false;
	if (error instanceof SdkHttpError) return error.code === SdkErrorCode.EraNegotiationFailed && error.status >= 500;
	return (
		error instanceof SdkError &&
		error.code === SdkErrorCode.EraNegotiationFailed &&
		error.message.startsWith(UnusableReplyMessage)
	);
}
