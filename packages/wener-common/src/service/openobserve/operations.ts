import { defineContractOperation } from '../runtime/contract';
import { OpenObserveServiceContract } from './OpenObserveServiceContract';
import { OpenObserveServiceCapability } from './IOpenObserveService';

export const OpenObserveOperations = {
	health: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.health,
		invoke: (service, _input, options) => service.health({}, options),
	}),
	status: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.status,
		invoke: (service, input, options) => service.status(input, options),
	}),
	listStreams: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.listStreams,
		invoke: (service, input, options) => service.listStreams(input, options),
	}),
	getStreamSchema: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.getStreamSchema,
		invoke: (service, input, options) => service.getStreamSchema(input, options),
	}),
	search: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.search,
		invoke: (service, input, options) => service.search(input, options),
	}),
	listTraces: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.listTraces,
		invoke: (service, input, options) => service.listTraces(input, options),
	}),
	getStreamSettings: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.getStreamSettings,
		invoke: (service, input, options) => service.getStreamSettings(input, options),
	}),
	updateStreamSettings: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.updateStreamSettings,
		invoke: (service, input, options) => service.updateStreamSettings(input, options),
	}),
	deleteStream: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.deleteStream,
		invoke: (service, input, options) => service.deleteStream(input, options),
	}),
	ingestJson: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.ingestJson,
		invoke: (service, input, options) => service.ingestJson(input, options),
	}),
	ingestMulti: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.ingestMulti,
		invoke: (service, input, options) => service.ingestMulti(input, options),
	}),
	getValues: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.getValues,
		invoke: (service, input, options) => service.getValues(input, options),
	}),
	searchAround: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveServiceContract.searchAround,
		invoke: (service, input, options) => service.searchAround(input, options),
	}),
};
