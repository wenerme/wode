import { defineContractOperation } from '../runtime/contract';
import { OpenObserveContract } from './OpenObserveContract';
import { OpenObserveServiceCapability } from './IOpenObserveService';

export const OpenObserveOperations = {
	health: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.health,
		invoke: (service, _input, options) => service.health(options),
	}),
	status: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.status,
		invoke: (service, input, options) => service.status(input, options),
	}),
	listStreams: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.listStreams,
		invoke: (service, input, options) => service.listStreams(input, options),
	}),
	getStreamSchema: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.getStreamSchema,
		invoke: (service, input, options) => service.getStreamSchema(input, options),
	}),
	search: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.search,
		invoke: (service, input, options) => service.search(input, options),
	}),
	listTraces: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.listTraces,
		invoke: (service, input, options) => service.listTraces(input, options),
	}),
	getStreamSettings: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.getStreamSettings,
		invoke: (service, input, options) => service.getStreamSettings(input, options),
	}),
	updateStreamSettings: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.updateStreamSettings,
		invoke: (service, input, options) => service.updateStreamSettings(input, options),
	}),
	deleteStream: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.deleteStream,
		invoke: (service, input, options) => service.deleteStream(input, options),
	}),
	ingestJson: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.ingestJson,
		invoke: (service, input, options) => service.ingestJson(input, options),
	}),
	ingestMulti: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.ingestMulti,
		invoke: (service, input, options) => service.ingestMulti(input, options),
	}),
	getValues: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.getValues,
		invoke: (service, input, options) => service.getValues(input, options),
	}),
	searchAround: defineContractOperation({
		capability: OpenObserveServiceCapability,
		contract: OpenObserveContract.searchAround,
		invoke: (service, input, options) => service.searchAround(input, options),
	}),
};
