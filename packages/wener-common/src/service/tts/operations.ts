import { defineContractOperation } from '../runtime/contract';
import { TtsServiceContract, TtsServiceWireContract } from './TtsServiceContract';
import { encodeTtsAudio } from './transport';
import { TtsServiceCapability } from './ITtsService';

export const TtsOperations = {
	synthesize: defineContractOperation({
		capability: TtsServiceCapability,
		contract: TtsServiceWireContract.synthesize,
		invoke: async (service, input, options) => encodeTtsAudio(await service.synthesize(input, options)),
	}),
	listVoices: defineContractOperation({
		capability: TtsServiceCapability,
		contract: TtsServiceContract.listVoices,
		invoke: (service, input, options) => service.listVoices(input, options),
	}),
};
