import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { ISqlService } from '../types';
import { SqlServiceContract, type SqlServiceCallOptions, type SqlServiceInputs, type SqlServiceOutputs } from '../SqlServiceContract';

/** Contract calls retain context locally; the generic transport receives cancellation only. */
export async function createSqlServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<ISqlService> {
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	let closed = false;
	const active = new Set<AbortController>();
	async function call<K extends keyof typeof SqlServiceContract>(toolName: K, input: SqlServiceInputs[K], callOptions: SqlServiceCallOptions = {}): Promise<SqlServiceOutputs[K]> {
		if (closed) throw new Error('SQL service is closed');
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('SQL operation unavailable');
		if (!callOptions || typeof callOptions !== 'object' || Array.isArray(callOptions) ||
			Object.keys(callOptions).some((key) => !['signal', 'context', 'lastEventId'].includes(key)) ||
			(callOptions.context !== undefined && (!callOptions.context || typeof callOptions.context !== 'object' || Array.isArray(callOptions.context) ||
				Object.keys(callOptions.context).some((key) => key !== 'timeoutMs'))) ||
			(callOptions.signal !== undefined && !(callOptions.signal instanceof AbortSignal)))
			throw new TypeError('Invalid SQL service input');
		const timeoutMs = callOptions.context?.timeoutMs;
		if (
			timeoutMs !== undefined &&
			(!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000)
		)
			throw new TypeError('Invalid SQL timeout');
		const controller = new AbortController();
		const signal = controller.signal;
		const signals = new Set([options.signal, callOptions.signal].filter((source): source is AbortSignal => Boolean(source)));
		const abort = () => controller.abort();
		let timedOut = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancel: (() => void) | undefined;
		function cancelled(): never {
			if (closed) throw new Error('SQL service is closed');
			if (timedOut && !options.signal?.aborted && !callOptions.signal?.aborted)
				throw new DOMException('SQL operation timed out', 'TimeoutError');
			throw new DOMException('SQL operation aborted', 'AbortError');
		}
		active.add(controller);
		try {
			for (const source of signals) {
				source.addEventListener('abort', abort, { once: true });
				if (source.aborted) abort();
			}
			if (timeoutMs !== undefined) timer = setTimeout(() => {
				timedOut = true;
				abort();
			}, timeoutMs);
			if (signal.aborted) cancelled();
			const parsed = SqlServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
			if (!parsed.success) throw new TypeError('Invalid SQL service input');
			if (toolName === 'exec' && (options.readOnly ?? true)) throw new Error('SQL service is read-only');
			try {
				const cancellation = new Promise<never>((_resolve, reject) => {
					cancel = () => reject(new Error('SQL operation cancelled'));
					signal.addEventListener('abort', cancel, { once: true });
				});
				const operation = Promise.resolve().then(() => {
					if (signal.aborted) cancelled();
					return runtime.call({ params: { service }, body: { toolName, input: parsed.data } }, { signal });
				});
				const result = await Promise.race([operation, cancellation]);
				if (signal.aborted) cancelled();
				return result as SqlServiceOutputs[K];
			} catch {
				if (signal.aborted) cancelled();
				throw new Error('SQL operation failed');
			}
		} finally {
			clearTimeout(timer);
			for (const source of signals) source.removeEventListener('abort', abort);
			if (cancel) signal.removeEventListener('abort', cancel);
			active.delete(controller);
		}
	}
	const client: ISqlService = {
		type: 'sql',
		dialect: 'remote',
		readOnly: options.readOnly ?? true,
		ping: (input, callOptions) => call('ping', input, callOptions),
		query: (input, callOptions) => call('query', input, callOptions),
		exec: (input, callOptions) => call('exec', input, callOptions),
		listObject: (input = {}, callOptions) => call('listObject', input, callOptions),
		describeObject: (input, callOptions) => call('describeObject', input, callOptions),
		close() {
			closed = true;
			for (const controller of active) controller.abort();
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
