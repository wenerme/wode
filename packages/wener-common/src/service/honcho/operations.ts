import { defineContractOperation } from '../runtime/contract';
import { HonchoServiceContract } from './HonchoServiceContract';
import { HonchoServiceCapability } from './IHonchoService';

export const HonchoOperations = {
	remember: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.remember,
		invoke: (service, input, options) => service.remember(input, options),
	}),
	query: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.query,
		invoke: (service, input, options) => service.query(input, options),
	}),
	chat: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.chat,
		invoke: (service, input, options) => service.chat(input, options),
	}),
	listWorkspace: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.listWorkspace,
		invoke: (service, input, options) => service.listWorkspace(input, options),
	}),
	createWorkspace: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.createWorkspace,
		invoke: (service, input, options) => service.createWorkspace(input, options),
	}),
	listPeer: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.listPeer,
		invoke: (service, input, options) => service.listPeer(input, options),
	}),
	createPeer: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.createPeer,
		invoke: (service, input, options) => service.createPeer(input, options),
	}),
	listSession: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.listSession,
		invoke: (service, input, options) => service.listSession(input, options),
	}),
	createSession: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.createSession,
		invoke: (service, input, options) => service.createSession(input, options),
	}),
	listMessage: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.listMessage,
		invoke: (service, input, options) => service.listMessage(input, options),
	}),
	getSessionSummary: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.getSessionSummary,
		invoke: (service, input, options) => service.getSessionSummary(input, options),
	}),
	getSessionContext: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.getSessionContext,
		invoke: (service, input, options) => service.getSessionContext(input, options),
	}),
	systemStatus: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.systemStatus,
		invoke: (service, input, options) => service.systemStatus(input, options),
	}),
	request: defineContractOperation({
		capability: HonchoServiceCapability,
		contract: HonchoServiceContract.request,
		invoke: (service, input, options) => service.request(input, options),
	}),
};
