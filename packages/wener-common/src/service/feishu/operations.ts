import { defineContractOperation } from '../runtime/contract';
import { FeishuServiceCapability } from './IFeishuService';
import { FeishuServiceWireContract as wire } from './FeishuServiceContract';
import { decodeFeishuUploadFile, decodeFeishuUploadImage, encodeFeishuResource } from './transport';

const capability = FeishuServiceCapability;

/** Tools are projected from the wire contract; binary procedures decode/encode at this boundary. */
export const FeishuOperations = {
	sendMessage: defineContractOperation({ capability, contract: wire.sendMessage,
		invoke: (service, input, options) => service.sendMessage(input, options) }),
	sendWebhook: defineContractOperation({ capability, contract: wire.sendWebhook,
		invoke: (service, input, options) => service.sendWebhook(input, options) }),
	request: defineContractOperation({ capability, contract: wire.request,
		invoke: (service, input, options) => service.request(input, options) }),
	listChat: defineContractOperation({ capability, contract: wire.listChat,
		invoke: (service, input, options) => service.listChat(input, options) }),
	getChat: defineContractOperation({ capability, contract: wire.getChat,
		invoke: (service, input, options) => service.getChat(input, options) }),
	listChatMember: defineContractOperation({ capability, contract: wire.listChatMember,
		invoke: (service, input, options) => service.listChatMember(input, options) }),
	getUser: defineContractOperation({ capability, contract: wire.getUser,
		invoke: (service, input, options) => service.getUser(input, options) }),
	listMessage: defineContractOperation({ capability, contract: wire.listMessage,
		invoke: (service, input, options) => service.listMessage(input, options) }),
	getMessage: defineContractOperation({ capability, contract: wire.getMessage,
		invoke: (service, input, options) => service.getMessage(input, options) }),
	replyMessage: defineContractOperation({ capability, contract: wire.replyMessage,
		invoke: (service, input, options) => service.replyMessage(input, options) }),
	deleteMessage: defineContractOperation({ capability, contract: wire.deleteMessage,
		invoke: (service, input, options) => service.deleteMessage(input, options) }),
	addMessageReaction: defineContractOperation({ capability, contract: wire.addMessageReaction,
		invoke: (service, input, options) => service.addMessageReaction(input, options) }),
	deleteMessageReaction: defineContractOperation({ capability, contract: wire.deleteMessageReaction,
		invoke: (service, input, options) => service.deleteMessageReaction(input, options) }),
	uploadImage: defineContractOperation({ capability, contract: wire.uploadImage,
		invoke: (service, input, options) => service.uploadImage(decodeFeishuUploadImage(input), options) }),
	uploadFile: defineContractOperation({ capability, contract: wire.uploadFile,
		invoke: (service, input, options) => service.uploadFile(decodeFeishuUploadFile(input), options) }),
	downloadMessageResource: defineContractOperation({ capability, contract: wire.downloadMessageResource,
		invoke: async (service, input, options) => encodeFeishuResource(await service.downloadMessageResource(input, options)) }),
	listApi: defineContractOperation({ capability, contract: wire.listApi,
		invoke: (service, input, options) => service.listApi(input, options) }),
	describeApi: defineContractOperation({ capability, contract: wire.describeApi,
		invoke: (service, input, options) => service.describeApi(input, options) }),
	callReadApi: defineContractOperation({ capability, contract: wire.callReadApi,
		invoke: (service, input, options) => service.callReadApi(input, options) }),
	callWriteApi: defineContractOperation({ capability, contract: wire.callWriteApi,
		invoke: (service, input, options) => service.callWriteApi(input, options) }),
};
