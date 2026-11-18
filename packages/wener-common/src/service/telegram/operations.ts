import { defineContractOperation } from '../runtime/contract';
import { TelegramServiceCapability } from './ITelegramService';
import { TelegramServiceWireContract as wire } from './TelegramServiceContract';
import {
	decodeTelegramSendDocument, decodeTelegramSendPhoto, encodeTelegramDownloadFile,
} from './transport';

const capability = TelegramServiceCapability;

/** Tools are projected from the wire contract; only binary media crosses a Base64 boundary. */
export const TelegramOperations = {
	getMe: defineContractOperation({ capability, contract: wire.getMe, invoke: (service, input, options) => service.getMe(input, options) }),
	whoami: defineContractOperation({ capability, contract: wire.whoami, invoke: (service, input, options) => service.whoami(input, options) }),
	sendMessage: defineContractOperation({ capability, contract: wire.sendMessage, invoke: (service, input, options) => service.sendMessage(input, options) }),
	getChat: defineContractOperation({ capability, contract: wire.getChat, invoke: (service, input, options) => service.getChat(input, options) }),
	getChatMember: defineContractOperation({ capability, contract: wire.getChatMember, invoke: (service, input, options) => service.getChatMember(input, options) }),
	getChatAdministrators: defineContractOperation({ capability, contract: wire.getChatAdministrators, invoke: (service, input, options) => service.getChatAdministrators(input, options) }),
	getChatMemberCount: defineContractOperation({ capability, contract: wire.getChatMemberCount, invoke: (service, input, options) => service.getChatMemberCount(input, options) }),
	getUpdates: defineContractOperation({ capability, contract: wire.getUpdates, invoke: (service, input, options) => service.getUpdates(input, options) }),
	getWebhookInfo: defineContractOperation({ capability, contract: wire.getWebhookInfo, invoke: (service, input, options) => service.getWebhookInfo(input, options) }),
	setWebhook: defineContractOperation({ capability, contract: wire.setWebhook, invoke: (service, input, options) => service.setWebhook(input, options) }),
	deleteWebhook: defineContractOperation({ capability, contract: wire.deleteWebhook, invoke: (service, input, options) => service.deleteWebhook(input, options) }),
	editMessageText: defineContractOperation({ capability, contract: wire.editMessageText, invoke: (service, input, options) => service.editMessageText(input, options) }),
	deleteMessage: defineContractOperation({ capability, contract: wire.deleteMessage, invoke: (service, input, options) => service.deleteMessage(input, options) }),
	forwardMessage: defineContractOperation({ capability, contract: wire.forwardMessage, invoke: (service, input, options) => service.forwardMessage(input, options) }),
	copyMessage: defineContractOperation({ capability, contract: wire.copyMessage, invoke: (service, input, options) => service.copyMessage(input, options) }),
	pinChatMessage: defineContractOperation({ capability, contract: wire.pinChatMessage, invoke: (service, input, options) => service.pinChatMessage(input, options) }),
	unpinChatMessage: defineContractOperation({ capability, contract: wire.unpinChatMessage, invoke: (service, input, options) => service.unpinChatMessage(input, options) }),
	answerCallbackQuery: defineContractOperation({ capability, contract: wire.answerCallbackQuery, invoke: (service, input, options) => service.answerCallbackQuery(input, options) }),
	getMyCommands: defineContractOperation({ capability, contract: wire.getMyCommands, invoke: (service, input, options) => service.getMyCommands(input, options) }),
	setMyCommands: defineContractOperation({ capability, contract: wire.setMyCommands, invoke: (service, input, options) => service.setMyCommands(input, options) }),
	deleteMyCommands: defineContractOperation({ capability, contract: wire.deleteMyCommands, invoke: (service, input, options) => service.deleteMyCommands(input, options) }),
	getFile: defineContractOperation({ capability, contract: wire.getFile, invoke: (service, input, options) => service.getFile(input, options) }),
	sendPhoto: defineContractOperation({ capability, contract: wire.sendPhoto, invoke: (service, input, options) => service.sendPhoto(decodeTelegramSendPhoto(input), options) }),
	sendDocument: defineContractOperation({ capability, contract: wire.sendDocument, invoke: (service, input, options) => service.sendDocument(decodeTelegramSendDocument(input), options) }),
	downloadFile: defineContractOperation({ capability, contract: wire.downloadFile, invoke: async (service, input, options) => encodeTelegramDownloadFile(await service.downloadFile(input, options)) }),
	request: defineContractOperation({ capability, contract: wire.request, invoke: (service, input, options) => service.request(input, options) }),
	requestRead: defineContractOperation({ capability, contract: wire.requestRead, invoke: (service, input, options) => service.requestRead(input, options) }),
};
