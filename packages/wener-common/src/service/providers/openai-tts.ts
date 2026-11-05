import { createOpenAiTtsClient } from '@wener/client/tts';
import type { ServiceProviderDefinition } from '../registry';
import { OpenAiTtsServiceOptionsSchema, resolveOpenAiTtsConnectionOptions } from '../tts/config';
import { TtsServiceContract } from '../tts/contract';
import { createTtsService } from '../tts/createTtsService';
import { TtsOperations } from '../tts/operations';

export const OpenAiTtsServiceProvider: ServiceProviderDefinition<'tts'> = {
	name: 'openai-tts',
	aliases: ['openai-speech'],
	provides: ['tts'],
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
