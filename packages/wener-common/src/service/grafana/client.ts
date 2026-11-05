import type { GrafanaRequestOptions } from '@wener/client/grafana';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../runtime/types';
import { GrafanaWriteOperations } from '../runtime/grafana-tools';
import type { IGrafanaService } from './index';

export async function createGrafanaServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IGrafanaService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<T>(toolName: string, input: unknown, callOptions?: GrafanaRequestOptions): Promise<T> {
		if (closed) throw new Error('Grafana client is closed');
		controller.signal.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Grafana operation unavailable');
		if (GrafanaWriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const timeoutMs = callOptions?.timeoutMs;
		if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
			throw new Error('Invalid Grafana timeout');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		const abortError = () => merged.reason instanceof Error ? merged.reason : new Error('Grafana request was aborted');
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('Grafana client is closed')),
			done: Promise.resolve(),
		};
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => { finish = resolve; });
		active.add(activeCall);
		const request = runtime.call({ params: { service }, body: { toolName, input } }, { signal: merged });
		void request.catch(() => undefined);
		if (merged.aborted) onAbort();
		const timer = timeoutMs === undefined ? undefined : setTimeout(() => local.abort(new Error('Grafana request timed out')), timeoutMs);
		try {
			return (await Promise.race([request, aborted])) as T;
		} finally {
			if (timer !== undefined) clearTimeout(timer);
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	return {
		type: 'grafana', readOnly: options.readOnly ?? true,
		health: (callOptions) => call('health', {}, callOptions),
		whoAmI: (callOptions) => call('whoAmI', {}, callOptions),
		request: (input, callOptions) => call('request', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('Grafana client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
	};
}
