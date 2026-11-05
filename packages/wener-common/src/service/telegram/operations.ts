import { defineContractOperation } from '../runtime/contract';
import { TelegramContract } from './TelegramContract';
import { TelegramServiceCapability } from './ITelegramService';

export const TelegramOperations = {
	getMe: defineContractOperation({
		capability: TelegramServiceCapability,
		contract: TelegramContract.getMe,
		invoke: (service, _input, options) => service.getMe(options),
	}),
	sendMessage: defineContractOperation({
		capability: TelegramServiceCapability,
		contract: TelegramContract.sendMessage,
		invoke: (service, input, options) => service.sendMessage(input, options),
	}),
	request: defineContractOperation({
		capability: TelegramServiceCapability,
		contract: TelegramContract.request,
		invoke: (service, input, options) => service.request(input.method, input.params, options),
	}),
};
