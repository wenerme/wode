import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import { S3ServiceContract, S3WriteOperations, type S3ServiceInputs, type S3ServiceOutputs, type S3ServiceCallOptions } from '../S3ServiceContract';
import type { IS3Service } from '../IS3Service';
import { createS3RequestScope } from '../request';

export async function createS3ServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IS3Service> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const scope = createS3RequestScope(options.signal);
	async function call<K extends keyof S3ServiceInputs>(
		toolName: K, input: S3ServiceInputs[K], callOptions?: S3ServiceCallOptions,
	): Promise<S3ServiceOutputs[K]> {
		scope.assertOpen();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('S3 operation unavailable');
		if (S3WriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const parsedInput = S3ServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid S3 input');
		return scope.run(async (signal) => {
			let result: unknown;
			try {
				result = await runtime.call({ params: { service }, body: { toolName, input: parsedInput.data } }, { signal });
			} catch {
				signal.throwIfAborted();
				throw new Error('S3 operation failed');
			}
			const parsedOutput = S3ServiceContract[toolName]['~orpc'].outputSchema!.safeParse(result);
			if (!parsedOutput.success) throw new TypeError('Invalid S3 response');
			return parsedOutput.data as S3ServiceOutputs[K];
		}, callOptions);
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
		close: scope.close,
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
