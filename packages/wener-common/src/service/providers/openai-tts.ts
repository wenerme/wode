import { createOpenAiTtsClient } from '@wener/client/tts';
import type { ServiceProviderDefinition } from '../registry';
import { OpenAiTtsServiceOptionsSchema, resolveOpenAiTtsConnectionOptions } from '../tts/config';
import { TtsServiceContract } from '../tts/TtsServiceContract';
import { createTtsService } from '../tts/server';
import { TtsOperations } from '../tts/operations';
import { TtsServiceCapability, type ITtsService } from '../tts/ITtsService';

export const OpenAiTtsServiceProvider: ServiceProviderDefinition<ITtsService> = {
	name: 'openai-tts',
	aliases: ['openai-speech'],
	provides: [TtsServiceCapability],
	title: 'OpenAI speech',
	description: 'Synthesize speech using an explicitly selected OpenAI-compatible audio model.',
	optionsSchema: OpenAiTtsServiceOptionsSchema,
	contract: TtsServiceContract,
	operations: TtsOperations,
	create(context) {
		const connection = resolveOpenAiTtsConnectionOptions(context.config, context.getEnv);
		return {
			tts: createTtsService(
				createOpenAiTtsClient({ ...connection, headers: context.config.headers, fetch: context.fetch }),
				'openai-tts',
			),
		};
	},
};
