import { defineContractOperation } from '../runtime/contract';
import { GrafanaServiceContract } from './GrafanaServiceContract';
import { GrafanaServiceCapability } from './IGrafanaService';

export const GrafanaOperations = {
	health: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.health,
		invoke: (service, input, options) => service.health(input, options),
	}),
	whoami: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.whoami,
		invoke: (service, input, options) => service.whoami(input, options),
	}),
	request: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.request,
		invoke: (service, input, options) => service.request(input, options),
	}),
	listDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.listDashboard,
		invoke: (service, input, options) => service.listDashboard(input, options),
	}),
	getDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.getDashboard,
		invoke: (service, input, options) => service.getDashboard(input, options),
	}),
	updateDashboard: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.updateDashboard,
		invoke: (service, input, options) => service.updateDashboard(input, options),
	}),
	listPanel: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.listPanel,
		invoke: (service, input, options) => service.listPanel(input, options),
	}),
	getPanel: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.getPanel,
		invoke: (service, input, options) => service.getPanel(input, options),
	}),
	patchPanel: defineContractOperation({
		capability: GrafanaServiceCapability,
		contract: GrafanaServiceContract.patchPanel,
		invoke: (service, input, options) => service.patchPanel(input, options),
	}),
};
