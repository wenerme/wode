import { defineContractOperation } from '../runtime/contract';
import { FetchContract } from './FetchContract';
import { FetchServiceCapability } from './IFetchService';

export const FetchOperations = {
	fetch: defineContractOperation({
		capability: FetchServiceCapability,
		contract: FetchContract.fetch,
		invoke: (service, input, options) => service.fetch(input, options),
	}),
};
