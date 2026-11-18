import { defineContractOperation } from '../runtime/contract';
import { SearchServiceContract } from './SearchServiceContract';
import { SearchServiceCapability } from './ISearchService';

export const SearchOperations = {
	search: defineContractOperation({
		capability: SearchServiceCapability,
		contract: SearchServiceContract.search,
		invoke: (service, input, options) => service.search(input, options),
	}),
};
