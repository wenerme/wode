import { defineContractOperation } from '../runtime/contract';
import { SearchContract } from './SearchContract';
import { SearchServiceCapability } from './ISearchService';

export const SearchOperations = {
	search: defineContractOperation({
		capability: SearchServiceCapability,
		contract: SearchContract.search,
		invoke: (service, input, options) => service.search(input, options),
	}),
};
