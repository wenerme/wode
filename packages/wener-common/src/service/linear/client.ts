import { createRemoteServiceToolClient } from '../runtime/createServiceToolClient';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../runtime/types';
import type { ILinearService } from './ILinearService';

/** CLI/tool calls carry an empty input for the service's input-free viewer operation. */
export type LinearServiceClient = Omit<ILinearService, 'type' | 'readOnly' | 'close' | 'getViewer'> & {
	getViewer(input: {}, options?: ServiceCallOptions): ReturnType<ILinearService['getViewer']>;
};

/** The runtime owner retains responsibility for registry and transport lifecycle. */
export function createLinearServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<LinearServiceClient> {
	return createRemoteServiceToolClient<LinearServiceClient>(runtime, service, options);
}
