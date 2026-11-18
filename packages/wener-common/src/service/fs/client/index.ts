import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import {
	FsServiceContract, FsWriteOperations,
	type FsServiceCallOptions, type FsServiceInputs, type FsServiceOutputs,
} from '../FsServiceContract';
import type { IFsService } from '../IFsService';
import { createFsRequestScope } from '../request';

/** Remote IFsService over the service tool runtime; inputs/outputs are validated by the contract. */
export async function createFsServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IFsService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const scope = createFsRequestScope(options.signal);
	async function call<K extends keyof FsServiceInputs>(
		toolName: K, input: FsServiceInputs[K], callOptions?: FsServiceCallOptions,
	): Promise<FsServiceOutputs[K]> {
		scope.assertOpen();
		callOptions?.signal?.throwIfAborted();
		if (!Object.hasOwn(schema.tools, toolName)) throw new Error('Filesystem operation unavailable');
		if (FsWriteOperations.has(toolName) && options.readOnly !== false) throw new Error('Selected service is read-only');
		const parsedInput = FsServiceContract[toolName]['~orpc'].inputSchema!.safeParse(input);
		if (!parsedInput.success) throw new TypeError('Invalid filesystem input');
		return scope.run(async (signal) => {
			let result: unknown;
			try {
				result = await runtime.call({ params: { service }, body: { toolName, input: parsedInput.data } }, { signal });
			} catch {
				signal.throwIfAborted();
				throw new Error('Filesystem operation failed');
			}
			const parsedOutput = FsServiceContract[toolName]['~orpc'].outputSchema!.safeParse(result);
			if (!parsedOutput.success) throw new TypeError('Invalid filesystem response');
			return parsedOutput.data as FsServiceOutputs[K];
		}, callOptions);
	}
	const client: IFsService = {
		type: 'fs',
		kind: 'unknown',
		readOnly: options.readOnly ?? true,
		list: (input = { path: '/', maxEntries: 1000 }, o) => call('list', input, o),
		stat: (input, o) => call('stat', input, o),
		read: (input, o) => call('read', input, o),
		write: (input, o) => call('write', input, o),
		mkdir: (input, o) => call('mkdir', input, o),
		rm: (input, o) => call('rm', input, o),
		mv: (input, o) => call('mv', input, o),
		cp: (input, o) => call('cp', input, o),
		close: scope.close,
		async [Symbol.asyncDispose]() {
			await client.close();
		},
	};
	return client;
}
