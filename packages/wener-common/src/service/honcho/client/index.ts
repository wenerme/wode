import { createRemoteServiceToolClient } from '../../runtime/createServiceToolClient';
import type { ServiceCallOptions, ServiceRuntimeClient } from '../../runtime/types';
import type { IHonchoServiceContract } from '../HonchoServiceContract';

/** Transport operations share the canonical contract; lifecycle belongs to the runtime owner. */
export type HonchoServiceClient = IHonchoServiceContract;

/** Read-only and write guards are enforced by the provider that owns the selected service. */
export function createHonchoServiceToolClient(
	runtime: ServiceRuntimeClient,
	service: string,
	options: ServiceCallOptions = {},
): Promise<HonchoServiceClient> {
	return createRemoteServiceToolClient<HonchoServiceClient>(runtime, service, options);
}
