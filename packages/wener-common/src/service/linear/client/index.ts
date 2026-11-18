import { createRemoteServiceToolClient } from '../../runtime/createServiceToolClient';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { ILinearServiceContract } from '../LinearServiceContract';

/** Transport operations share the canonical contract; lifecycle belongs to the runtime owner. */
export type LinearServiceClient = ILinearServiceContract;

/** The runtime owner retains responsibility for registry and transport lifecycle. */
export function createLinearServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<LinearServiceClient> {
	return createRemoteServiceToolClient<LinearServiceClient>(runtime, service, options);
}
