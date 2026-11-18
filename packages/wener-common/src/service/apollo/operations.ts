import { defineContractOperation } from '../runtime/contract';
import { ApolloServiceContract } from './ApolloServiceContract';
import { ApolloServiceCapability } from './core/interface';

export const ApolloOperations = {
	readConfig: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.readConfig,
		invoke: (service, input, options) => service.readConfig(input, options),
	}),
	request: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.request,
		invoke: (service, input, options) => service.request(input, options),
	}),
	getStatus: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getStatus,
		invoke: (service, input, options) => service.getStatus(input, options),
	}),
	listPortalApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalApp,
		invoke: (service, input, options) => service.listPortalApp(input, options),
	}),
	listPortalOrganization: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalOrganization,
		invoke: (service, input, options) => service.listPortalOrganization(input, options),
	}),
	listPortalEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalEnv,
		invoke: (service, input, options) => service.listPortalEnv(input, options),
	}),
	getPortalNavTree: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getPortalNavTree,
		invoke: (service, input, options) => service.getPortalNavTree(input, options),
	}),
	listPortalNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalNamespace,
		invoke: (service, input, options) => service.listPortalNamespace(input, options),
	}),
	getPortalNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getPortalNamespace,
		invoke: (service, input, options) => service.getPortalNamespace(input, options),
	}),
	listPortalItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalItem,
		invoke: (service, input, options) => service.listPortalItem(input, options),
	}),
	listPortalRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listPortalRelease,
		invoke: (service, input, options) => service.listPortalRelease(input, options),
	}),
	getPortalConfig: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getPortalConfig,
		invoke: (service, input, options) => service.getPortalConfig(input, options),
	}),
	listRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listRelease,
		invoke: (service, input, options) => service.listRelease(input, options),
	}),
	getRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getRelease,
		invoke: (service, input, options) => service.getRelease(input, options),
	}),
	diffRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.diffRelease,
		invoke: (service, input, options) => service.diffRelease(input, options),
	}),
	listApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listApp,
		invoke: (service, input, options) => service.listApp(input, options),
	}),
	getApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getApp,
		invoke: (service, input, options) => service.getApp(input, options),
	}),
	listSelfApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listSelfApp,
		invoke: (service, input, options) => service.listSelfApp(input, options),
	}),
	createApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.createApp,
		invoke: (service, input, options) => service.createApp(input, options),
	}),
	createAppEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.createAppEnv,
		invoke: (service, input, options) => service.createAppEnv(input, options),
	}),
	updateApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.updateApp,
		invoke: (service, input, options) => service.updateApp(input, options),
	}),
	deleteApp: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.deleteApp,
		invoke: (service, input, options) => service.deleteApp(input, options),
	}),
	listMissingAppEnv: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listMissingAppEnv,
		invoke: (service, input, options) => service.listMissingAppEnv(input, options),
	}),
	getEnvCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getEnvCluster,
		invoke: (service, input, options) => service.getEnvCluster(input, options),
	}),
	getCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getCluster,
		invoke: (service, input, options) => service.getCluster(input, options),
	}),
	createCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.createCluster,
		invoke: (service, input, options) => service.createCluster(input, options),
	}),
	deleteCluster: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.deleteCluster,
		invoke: (service, input, options) => service.deleteCluster(input, options),
	}),
	listNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listNamespace,
		invoke: (service, input, options) => service.listNamespace(input, options),
	}),
	getNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getNamespace,
		invoke: (service, input, options) => service.getNamespace(input, options),
	}),
	getNamespaceLock: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getNamespaceLock,
		invoke: (service, input, options) => service.getNamespaceLock(input, options),
	}),
	createNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.createNamespace,
		invoke: (service, input, options) => service.createNamespace(input, options),
	}),
	deleteNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.deleteNamespace,
		invoke: (service, input, options) => service.deleteNamespace(input, options),
	}),
	listNamespaceUsage: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listNamespaceUsage,
		invoke: (service, input, options) => service.listNamespaceUsage(input, options),
	}),
	listMissingNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listMissingNamespace,
		invoke: (service, input, options) => service.listMissingNamespace(input, options),
	}),
	createMissingNamespace: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.createMissingNamespace,
		invoke: (service, input, options) => service.createMissingNamespace(input, options),
	}),
	listItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.listItem,
		invoke: (service, input, options) => service.listItem(input, options),
	}),
	getItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getItem,
		invoke: (service, input, options) => service.getItem(input, options),
	}),
	upsertItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.upsertItem,
		invoke: (service, input, options) => service.upsertItem(input, options),
	}),
	deleteItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.deleteItem,
		invoke: (service, input, options) => service.deleteItem(input, options),
	}),
	getLatestRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.getLatestRelease,
		invoke: (service, input, options) => service.getLatestRelease(input, options),
	}),
	publishRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.publishRelease,
		invoke: (service, input, options) => service.publishRelease(input, options),
	}),
	rollbackRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.rollbackRelease,
		invoke: (service, input, options) => service.rollbackRelease(input, options),
	}),
	patchNamespaceItem: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.patchNamespaceItem,
		invoke: (service, input, options) => service.patchNamespaceItem(input, options),
	}),
	writeNamespaceText: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.writeNamespaceText,
		invoke: (service, input, options) => service.writeNamespaceText(input, options),
	}),
	patchNamespaceDocument: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.patchNamespaceDocument,
		invoke: (service, input, options) => service.patchNamespaceDocument(input, options),
	}),
	diffNamespaceRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.diffNamespaceRelease,
		invoke: (service, input, options) => service.diffNamespaceRelease(input, options),
	}),
	publishNamespaceRelease: defineContractOperation({
		capability: ApolloServiceCapability,
		contract: ApolloServiceContract.publishNamespaceRelease,
		invoke: (service, input, options) => service.publishNamespaceRelease(input, options),
	}),
};
