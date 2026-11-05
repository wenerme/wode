import { defineContractOperation } from '../runtime/contract';
import { GrafanaContract } from './GrafanaContract';
import { GrafanaServiceCapability } from './IGrafanaService';

export const GrafanaOperations = {
	health: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.health,
		invoke: (service, _input, options) => service.health(options),
	}),
	whoAmI: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.whoAmI,
		invoke: (service, _input, options) => service.whoAmI(options),
	}),
	request: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.request,
		invoke: (service, input, options) => service.request(input, options),
	}),
};
