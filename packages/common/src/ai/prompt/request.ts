export type { PreparedMessageGenerationExchange as PreparedPromptExchange } from '@wener/client/ai/message-generation/request';
export {
	MessageGenerationProtocolApi as PromptProtocolApi,
	prepareMessageGenerationExchange as preparePromptExchange,
	prepareMessageGenerationRequest as preparePromptRequest,
	redactMessageGenerationRequest as redactPromptRequest,
} from '@wener/client/ai/message-generation/request';
