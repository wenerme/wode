import { defineContractOperation } from '../runtime/contract';
import { FetchServiceContract } from './FetchServiceContract';
import { FetchServiceCapability } from './IFetchService';

export const FetchOperations = {
	fetch: defineContractOperation({
		capability: FetchServiceCapability,
		contract: FetchServiceContract.fetch,
		invoke: (service, input, options) => service.fetch(input, options),
	}),
};
