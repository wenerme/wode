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
	listDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.listDashboard,
		invoke: (service, input, options) => service.listDashboard(input, options),
	}),
	getDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.getDashboard,
		invoke: (service, input, options) => service.getDashboard(input, options),
	}),
	updateDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.updateDashboard,
		invoke: (service, input, options) => service.updateDashboard(input, options),
	}),
	getPanel: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.getPanel,
		invoke: (service, input, options) => service.getPanel(input, options),
	}),
	patchPanel: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaContract.patchPanel,
		invoke: (service, input, options) => service.patchPanel(input, options),
	}),
};
