import { FeishuOpenApiError } from '@wener/client/feishu/server';
import type { z } from 'zod';
import { FeishuServiceError, FeishuServiceErrorCodes } from './errors';
import type { FeishuServiceCallOptions } from './FeishuServiceContract';

export function feishuTimeout(options?: FeishuServiceCallOptions): number | undefined {
	const timeout = options?.context?.timeoutMs;
	if (timeout !== undefined && (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 3_600_000)) {
		throw new FeishuServiceError(FeishuServiceErrorCodes.InvalidConfig, 'Invalid Feishu timeout');
	}
	return timeout;
}

/**
 * Bound the entire operation, including the tenant token exchange and response parsing.
 * The callback must pass the effective signal to every fetch so the deadline aborts it.
 */
export async function feishuCall<T>(
	signal: AbortSignal,
	operation: (signal: AbortSignal) => Promise<T>,
	timeoutMs?: number,
): Promise<T> {
	signal.throwIfAborted();
	const deadline = timeoutMs === undefined ? undefined : new AbortController();
	const effective = deadline ? AbortSignal.any([signal, deadline.signal]) : signal;
	let onAbort!: () => void;
	const aborted = new Promise<never>((_, reject) => {
		onAbort = () => reject(effective.reason);
		effective.addEventListener('abort', onAbort, { once: true });
	});
	const timer = deadline === undefined ? undefined : setTimeout(() => deadline.abort(
		new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Feishu request timed out'),
	), timeoutMs);
	try {
		return await Promise.race([Promise.resolve().then(() => {
			effective.throwIfAborted();
			return operation(effective);
		}), aborted]);
	} catch (error) {
		effective.throwIfAborted();
		if (error instanceof FeishuServiceError) throw error;
		// The typed OpenAPI client builds scrubbed, URL-free messages (status/code/msg/log_id only);
		// its log_id is already validated against a strict character set.
		if (error instanceof FeishuOpenApiError) {
			const message = error.logId && !error.message.includes(error.logId) ? `${error.message} (log_id=${error.logId})` : error.message;
			throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, message, error.logId ? { logId: error.logId } : {});
		}
		// Other errors (webhook helper, fetch) may carry payloads, URLs or tokens: do not retain a raw cause.
		throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Feishu service operation failed');
	} finally {
		if (timer !== undefined) clearTimeout(timer);
		effective.removeEventListener('abort', onAbort);
	}
}

export function feishuOutput<T extends z.ZodType>(schema: T, output: unknown): z.output<T> {
	const parsed = schema.safeParse(output);
	if (!parsed.success) throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Invalid Feishu service response');
	return parsed.data;
}
