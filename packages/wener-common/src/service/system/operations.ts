import { defineContractOperation } from '../runtime/contract';
import { SystemServiceCapability } from './ISystemService';
import { SystemServiceContract } from './SystemServiceContract';

export const SystemOperations = {
	info: defineContractOperation({
		capability: SystemServiceCapability,
		contract: SystemServiceContract.info,
		invoke: (service, input, options) => service.info(input, options),
	}),
	echo: defineContractOperation({
		capability: SystemServiceCapability,
		contract: SystemServiceContract.echo,
		invoke: (service, input, options) => service.echo(input, options),
	}),
};
