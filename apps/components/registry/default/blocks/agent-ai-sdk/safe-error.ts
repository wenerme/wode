export const AGENT_SAFE_ERROR_MAX_LENGTH = 320;

export function toSafeAgentError(error: unknown, secrets: readonly string[] = []): Error {
	if (isAbortError(error)) return new DOMException('操作已取消。', 'AbortError');
	let message = error instanceof Error ? error.message : typeof error === 'string' ? error : '请求失败。';
	for (const secret of secrets) {
		if (secret.length > 0) message = message.split(secret).join('[已隐藏]');
	}
	message = message
		.replace(/\bBearer\s+[^\s,;]+/giu, 'Bearer [已隐藏]')
		.replace(/\b(authorization|api[-_ ]?key)\s*[:=]\s*[^\s,;]+/giu, '$1=[已隐藏]')
		.replace(/https?:\/\/[^\s)\]}>'"]+/giu, '[服务地址]')
		.replace(/[\r\n\t]+/gu, ' ')
		.trim();
	if (message.length === 0) message = '请求失败。';
	if (message.length > AGENT_SAFE_ERROR_MAX_LENGTH) message = `${message.slice(0, AGENT_SAFE_ERROR_MAX_LENGTH - 1)}…`;
	return new Error(message);
}

export function isAbortError(error: unknown): boolean {
	return error instanceof DOMException
		? error.name === 'AbortError'
		: error instanceof Error && error.name === 'AbortError';
}
