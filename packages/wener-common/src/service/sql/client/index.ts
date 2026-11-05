import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { ISqlService, SqlCallOptions } from '../types';

/** ping 没有领域输入；在 tool transport 边界显式补充空输入。 */
export async function createSqlServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<ISqlService> {
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	async function call<T>(toolName: string, input: unknown, callOptions: SqlCallOptions = {}): Promise<T> {
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('SQL operation unavailable');
		if (
			callOptions.timeoutMs !== undefined &&
			(!Number.isSafeInteger(callOptions.timeoutMs) || callOptions.timeoutMs < 1 || callOptions.timeoutMs > 3_600_000)
		)
			throw new TypeError('Invalid SQL timeout');
		const signals = [
			options.signal,
			callOptions.signal,
			callOptions.timeoutMs === undefined ? undefined : AbortSignal.timeout(callOptions.timeoutMs),
		].filter((signal): signal is AbortSignal => Boolean(signal));
		const signal = signals.length ? AbortSignal.any(signals) : undefined;
		signal?.throwIfAborted();
		const result = await runtime.call(
			{ params: { service }, body: { toolName, input } },
			{ signal, ...(callOptions.timeoutMs === undefined ? {} : { timeoutMs: callOptions.timeoutMs }) },
		);
		signal?.throwIfAborted();
		return result as T;
	}
	const client: ISqlService = {
		type: 'sql',
		dialect: 'remote',
		readOnly: options.readOnly ?? true,
		ping: (callOptions) => call('ping', {}, callOptions),
		query: (input, callOptions) => call('query', input, callOptions),
		exec: (input, callOptions) => call('exec', input, callOptions),
		listObject: (input = {}, callOptions) => call('listObject', input, callOptions),
		describeObject: (input, callOptions) => call('describeObject', input, callOptions),
		close() {},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
