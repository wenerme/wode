import { defineContractOperation } from '../runtime/contract';
import { LarkContract } from './LarkContract';
import { LarkServiceCapability } from './ILarkService';

export const LarkOperations = {
	sendMessage: defineContractOperation({
		capability: LarkServiceCapability,
		contract: LarkContract.sendMessage,
		invoke: (service, input) => service.sendMessage(input),
	}),
	sendWebhook: defineContractOperation({
		capability: LarkServiceCapability,
		contract: LarkContract.sendWebhook,
		invoke: (service, input) => service.sendWebhook(input),
	}),
	request: defineContractOperation({
		capability: LarkServiceCapability,
		contract: LarkContract.request,
		invoke: (service, input) => service.request(input),
	}),
};
