import type { ServiceCallOptions, ServiceRuntimeClient } from '../runtime/types';
import { S3WriteOperations } from './S3Contract';
import type { IS3Service } from './IS3Service';

export async function createS3ServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IS3Service> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	const controller = new AbortController();
	const active = new Set<{ abort: () => void; done: Promise<void> }>();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call<T>(toolName: string, input: unknown, callOptions?: ServiceCallOptions): Promise<T> {
		if (closed) throw new Error('S3 client is closed');
		controller.signal.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('S3 operation unavailable');
		if (S3WriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const local = new AbortController();
		const signals = [controller.signal, local.signal, options.signal, callOptions?.signal].filter(
			(value): value is AbortSignal => Boolean(value),
		);
		const merged = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);
		let rejectAbort!: (reason: Error) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const abortError = () => (merged.reason instanceof Error ? merged.reason : new Error('S3 request was aborted'));
		const onAbort = () => rejectAbort(abortError());
		merged.addEventListener('abort', onAbort, { once: true });
		const activeCall = {
			abort: () => local.abort(new Error('S3 client is closed')),
			done: Promise.resolve(),
		};
		let finish!: () => void;
		activeCall.done = new Promise<void>((resolve) => {
			finish = resolve;
		});
		active.add(activeCall);
		const request = runtime.call({ params: { service }, body: { toolName, input } }, { signal: merged });
		void request.catch(() => undefined);
		if (merged.aborted) onAbort();
		try {
			return (await Promise.race([request, aborted])) as T;
		} finally {
			merged.removeEventListener('abort', onAbort);
			active.delete(activeCall);
			finish();
		}
	}
	const client: IS3Service = {
		type: 's3',
		readOnly: options.readOnly ?? true,
		endpoint: new URL('s3://unknown'),
		region: 'unknown',
		bucketName: 'unknown',
		listObject: (input = {}, callOptions) => call('listObject', input, callOptions),
		getObject: (input, callOptions) => call('getObject', input, callOptions),
		putObject: (input, callOptions) => call('putObject', input, callOptions),
		deleteObject: (input, callOptions) => call('deleteObject', input, callOptions),
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			controller.abort(new Error('S3 client is closed'));
			closePromise = Promise.allSettled([...active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
			return closePromise;
		},
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
