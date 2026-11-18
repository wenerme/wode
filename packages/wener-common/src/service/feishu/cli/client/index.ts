import type { ServiceCallOptions, ServiceRuntimeClient } from '../../../runtime/types';
import { feishuCall, feishuOutput, feishuTimeout } from '../../call';
import { FeishuServiceError, FeishuServiceErrorCodes } from '../../errors';
import type { IFeishuService } from '../../IFeishuService';
import {
	type FeishuOperationName,
	type FeishuServiceCallOptions,
	FeishuServiceContract,
	FeishuServiceWireContract,
	FeishuWriteOperations,
} from '../../FeishuServiceContract';
import { isDryRunBypass } from '../../../runtime/dryRun';
import { decodeFeishuResource, encodeFeishuUploadFile, encodeFeishuUploadImage } from '../../transport';

/** Native input → transport input; only binary uploads differ. Validation errors stay generic. */
function toWireInput(name: FeishuOperationName, input: unknown): unknown {
	try {
		if (name === 'uploadImage') return encodeFeishuUploadImage(input as never);
		if (name === 'uploadFile') return encodeFeishuUploadFile(input as never);
	} catch {
		throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Invalid Feishu service input');
	}
	const parsed = FeishuServiceContract[name]['~orpc'].inputSchema!.safeParse(input);
	if (!parsed.success) throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Invalid Feishu service input');
	return parsed.data;
}

/** Transport output → native output; the binary download is decoded and re-validated. */
function fromWireOutput(name: FeishuOperationName, output: unknown): unknown {
	const wire = feishuOutput(FeishuServiceWireContract[name]['~orpc'].outputSchema!, output);
	if (name !== 'downloadMessageResource') return wire;
	try {
		return decodeFeishuResource(wire);
	} catch {
		throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Invalid Feishu service response');
	}
}

export async function createFeishuServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions & { readOnly?: boolean } = {},
): Promise<IFeishuService> {
	options.signal?.throwIfAborted();
	const schema = await runtime.getSchema({ params: { service } }, options);
	options.signal?.throwIfAborted();
	const controller = new AbortController();
	let closed = false;
	let closePromise: Promise<void> | undefined;
	async function call(name: FeishuOperationName, input: unknown, callOptions?: FeishuServiceCallOptions): Promise<unknown> {
		if (closed) throw new FeishuServiceError(FeishuServiceErrorCodes.Closed, 'Feishu client is closed');
		const meta = FeishuServiceContract[name]['~orpc'].meta;
		if (FeishuWriteOperations.has(name) && options.readOnly !== false && !isDryRunBypass(meta.supportsDryRun, input))
			throw new FeishuServiceError(FeishuServiceErrorCodes.ReadOnly, 'Selected service is read-only');
		if (!Object.hasOwn(schema.tools, name)) throw new FeishuServiceError(
			FeishuServiceErrorCodes.OperationFailed, 'Feishu operation unavailable',
		);
		const timeout = feishuTimeout(callOptions);
		if (name === 'sendWebhook' && timeout !== undefined) throw new FeishuServiceError(
			FeishuServiceErrorCodes.InvalidConfig, 'Feishu webhook does not support timeoutMs',
		);
		const signals = [controller.signal, options.signal, callOptions?.signal].filter((value): value is AbortSignal => Boolean(value));
		// A remote deadline bounds the transport wait and propagates cancellation. The shared
		// runtime has no service-specific context transport; do not claim to forward SDK timeout.
		const deadline = new AbortController();
		if (timeout !== undefined) signals.push(deadline.signal);
		const signal = AbortSignal.any(signals);
		const timer = timeout === undefined ? undefined : setTimeout(() => deadline.abort(
			new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Feishu request timed out'),
		), timeout);
		try {
			return await feishuCall(signal, async () => {
				const wireInput = toWireInput(name, input);
				return fromWireOutput(name, await runtime.call({ params: { service }, body: { toolName: name, input: wireInput } }, { signal }));
			});
		} finally {
			if (timer !== undefined) clearTimeout(timer);
		}
	}
	const methods = Object.fromEntries(
		(Object.keys(FeishuServiceContract) as FeishuOperationName[]).map((name) => [
			name,
			(input: unknown, callOptions?: FeishuServiceCallOptions) => call(name, input, callOptions),
		]),
	) as unknown as Omit<IFeishuService, 'type' | 'readOnly' | 'close' | typeof Symbol.asyncDispose>;
	const client: IFeishuService = {
		...methods,
		type: 'feishu',
		readOnly: options.readOnly ?? true,
		close() {
			if (!closePromise) {
				closed = true;
				controller.abort(new FeishuServiceError(FeishuServiceErrorCodes.Closed, 'Feishu client is closed'));
				closePromise = Promise.resolve();
			}
			return closePromise;
		},
		[Symbol.asyncDispose]() { return client.close(); },
	};
	return client;
}
