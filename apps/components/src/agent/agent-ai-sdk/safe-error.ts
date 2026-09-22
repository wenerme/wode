export const AGENT_SAFE_ERROR_MAX_LENGTH = 320;

// @ai-sdk/provider-utils wraps response-body failures with this fixed message.
const TRANSPARENT_ERROR_MESSAGES = new Set(['Failed to process successful response']);

export function toSafeAgentError(error: unknown, secrets: readonly string[] = []): Error {
	if (isAbortError(error)) return new DOMException('操作已取消。', 'AbortError');
	let message = resolveErrorMessage(error);
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

function resolveErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return typeof error === 'string' ? error : '请求失败。';
	let current = error;
	const seen = new Set<unknown>();
	for (let depth = 0; depth < 4 && !seen.has(current); depth += 1) {
		seen.add(current);
		if (!TRANSPARENT_ERROR_MESSAGES.has(current.message) || !(current.cause instanceof Error)) return current.message;
		current = current.cause;
	}
	return current.message;
}

export function isAbortError(error: unknown): boolean {
	return error instanceof DOMException
		? error.name === 'AbortError'
		: error instanceof Error && error.name === 'AbortError';
}
