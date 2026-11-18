import { defineContractOperation } from '../runtime/contract';
import { DnsServiceContract } from './DnsServiceContract';
import { DnsServiceCapability } from './IDnsService';

/** Shared by every DNS provider; register with `operations: { ...DnsOperations, ...SupplierOperations }`. */
export const DnsOperations = {
	listZone: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.listZone,
		invoke: (service, input, options) => service.listZone(input, options),
	}),
	getZone: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.getZone,
		invoke: (service, input, options) => service.getZone(input, options),
	}),
	createZone: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.createZone,
		invoke: (service, input, options) => service.createZone(input, options),
	}),
	deleteZone: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.deleteZone,
		invoke: (service, input, options) => service.deleteZone(input, options),
	}),
	listRecord: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.listRecord,
		invoke: (service, input, options) => service.listRecord(input, options),
	}),
	setRecord: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.setRecord,
		invoke: (service, input, options) => service.setRecord(input, options),
	}),
	deleteRecord: defineContractOperation({
		capability: DnsServiceCapability,
		contract: DnsServiceContract.deleteRecord,
		invoke: (service, input, options) => service.deleteRecord(input, options),
	}),
};
