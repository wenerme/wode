import { defineContractOperation } from '../runtime/contract';
import { ApolloContract } from './ApolloContract';
import { redactApolloValue } from './core/redactor';
import { ApolloServiceCapability } from './core/interface';

export const ApolloOperations = {
	readConfig: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.readConfig,
		invoke: async (service, input, _options) => redactApolloValue(await service.readConfig(input)),
	}),
	request: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.request,
		invoke: async (service, input, _options) => redactApolloValue(await service.request(input)),
	}),
	getStatus: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getStatus,
		invoke: async (service, _input, _options) => redactApolloValue(await service.getStatus()),
	}),
	listPortalApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalApp,
		invoke: async (service, _input, _options) => redactApolloValue(await service.listPortalApp()),
	}),
	listPortalOrganization: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalOrganization,
		invoke: async (service, _input, _options) => redactApolloValue(await service.listPortalOrganization()),
	}),
	listPortalEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalEnv,
		invoke: async (service, _input, _options) => redactApolloValue(await service.listPortalEnv()),
	}),
	getPortalNavTree: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getPortalNavTree,
		invoke: async (service, input, _options) => redactApolloValue(await service.getPortalNavTree(input)),
	}),
	listPortalNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.listPortalNamespace(input)),
	}),
	getPortalNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getPortalNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.getPortalNamespace(input)),
	}),
	listPortalItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.listPortalItem(input)),
	}),
	listPortalRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listPortalRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.listPortalRelease(input)),
	}),
	getPortalConfig: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getPortalConfig,
		invoke: async (service, input, _options) => redactApolloValue(await service.getPortalConfig(input)),
	}),
	listRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.listRelease(input)),
	}),
	getRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.getRelease(input)),
	}),
	diffRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.diffRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.diffRelease(input)),
	}),
	listApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.listApp(input)),
	}),
	getApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.getApp(input)),
	}),
	listSelfApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listSelfApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.listSelfApp(input)),
	}),
	createApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.createApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.createApp(input)),
	}),
	createAppEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.createAppEnv,
		invoke: async (service, input, _options) => redactApolloValue(await service.createAppEnv(input)),
	}),
	updateApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.updateApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.updateApp(input)),
	}),
	deleteApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.deleteApp,
		invoke: async (service, input, _options) => redactApolloValue(await service.deleteApp(input)),
	}),
	listMissingAppEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listMissingAppEnv,
		invoke: async (service, input, _options) => redactApolloValue(await service.listMissingAppEnv(input)),
	}),
	getEnvCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getEnvCluster,
		invoke: async (service, input, _options) => redactApolloValue(await service.getEnvCluster(input)),
	}),
	getCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getCluster,
		invoke: async (service, input, _options) => redactApolloValue(await service.getCluster(input)),
	}),
	createCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.createCluster,
		invoke: async (service, input, _options) => redactApolloValue(await service.createCluster(input)),
	}),
	deleteCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.deleteCluster,
		invoke: async (service, input, _options) => redactApolloValue(await service.deleteCluster(input)),
	}),
	listNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.listNamespace(input)),
	}),
	getNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.getNamespace(input)),
	}),
	getNamespaceLock: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getNamespaceLock,
		invoke: async (service, input, _options) => redactApolloValue(await service.getNamespaceLock(input)),
	}),
	createNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.createNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.createNamespace(input)),
	}),
	deleteNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.deleteNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.deleteNamespace(input)),
	}),
	listNamespaceUsage: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listNamespaceUsage,
		invoke: async (service, input, _options) => redactApolloValue(await service.listNamespaceUsage(input)),
	}),
	listMissingNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listMissingNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.listMissingNamespace(input)),
	}),
	createMissingNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.createMissingNamespace,
		invoke: async (service, input, _options) => redactApolloValue(await service.createMissingNamespace(input)),
	}),
	listItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.listItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.listItem(input)),
	}),
	getItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.getItem(input)),
	}),
	upsertItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.upsertItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.upsertItem(input)),
	}),
	deleteItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.deleteItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.deleteItem(input)),
	}),
	getLatestRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.getLatestRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.getLatestRelease(input)),
	}),
	publishRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.publishRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.publishRelease(input)),
	}),
	rollbackRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.rollbackRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.rollbackRelease(input)),
	}),
	patchNamespaceItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.patchNamespaceItem,
		invoke: async (service, input, _options) => redactApolloValue(await service.patchNamespaceItem(input)),
	}),
	writeNamespaceText: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.writeNamespaceText,
		invoke: async (service, input, _options) => redactApolloValue(await service.writeNamespaceText(input)),
	}),
	patchNamespaceDocument: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.patchNamespaceDocument,
		invoke: async (service, input, _options) => redactApolloValue(await service.patchNamespaceDocument(input)),
	}),
	diffNamespaceRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.diffNamespaceRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.diffNamespaceRelease(input)),
	}),
	publishNamespaceRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloContract.publishNamespaceRelease,
		invoke: async (service, input, _options) => redactApolloValue(await service.publishNamespaceRelease(input)),
	}),
};
