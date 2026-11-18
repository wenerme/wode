import { defineContractOperation } from '../runtime/contract';
import { PowerDnsServiceContract } from './PowerDnsServiceContract';
import { PowerDnsServiceCapability } from './IPowerDnsService';

export const PowerDnsOperations = {
	listServer: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.listServer,
		invoke: (service, input, options) => service.listServer(input, options),
	}),
	getServer: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.getServer,
		invoke: (service, input, options) => service.getServer(input, options),
	}),
	listServerStatistic: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.listServerStatistic,
		invoke: (service, input, options) => service.listServerStatistic(input, options),
	}),
	searchData: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.searchData,
		invoke: (service, input, options) => service.searchData(input, options),
	}),
	createPowerDnsZone: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.createPowerDnsZone,
		invoke: (service, input, options) => service.createPowerDnsZone(input, options),
	}),
	notifyZone: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.notifyZone,
		invoke: (service, input, options) => service.notifyZone(input, options),
	}),
	retrieveZoneAxfr: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.retrieveZoneAxfr,
		invoke: (service, input, options) => service.retrieveZoneAxfr(input, options),
	}),
	listMetadata: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.listMetadata,
		invoke: (service, input, options) => service.listMetadata(input, options),
	}),
	getMetadata: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.getMetadata,
		invoke: (service, input, options) => service.getMetadata(input, options),
	}),
	setMetadata: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.setMetadata,
		invoke: (service, input, options) => service.setMetadata(input, options),
	}),
	deleteMetadata: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.deleteMetadata,
		invoke: (service, input, options) => service.deleteMetadata(input, options),
	}),
	listCryptokey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.listCryptokey,
		invoke: (service, input, options) => service.listCryptokey(input, options),
	}),
	getCryptokey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.getCryptokey,
		invoke: (service, input, options) => service.getCryptokey(input, options),
	}),
	createCryptokey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.createCryptokey,
		invoke: (service, input, options) => service.createCryptokey(input, options),
	}),
	updateCryptokey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.updateCryptokey,
		invoke: (service, input, options) => service.updateCryptokey(input, options),
	}),
	deleteCryptokey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.deleteCryptokey,
		invoke: (service, input, options) => service.deleteCryptokey(input, options),
	}),
	listTsigKey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.listTsigKey,
		invoke: (service, input, options) => service.listTsigKey(input, options),
	}),
	getTsigKey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.getTsigKey,
		invoke: (service, input, options) => service.getTsigKey(input, options),
	}),
	createTsigKey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.createTsigKey,
		invoke: (service, input, options) => service.createTsigKey(input, options),
	}),
	updateTsigKey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.updateTsigKey,
		invoke: (service, input, options) => service.updateTsigKey(input, options),
	}),
	deleteTsigKey: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.deleteTsigKey,
		invoke: (service, input, options) => service.deleteTsigKey(input, options),
	}),
	request: defineContractOperation({
		capability: PowerDnsServiceCapability,
		contract: PowerDnsServiceContract.request,
		invoke: (service, input, options) => service.request(input, options),
	}),
};
