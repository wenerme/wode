import { createEdgeTtsClient } from '@wener/client/tts';
import type { ServiceProviderDefinition } from '../registry';
import { EdgeTtsServiceConfigSchema, EdgeTtsServiceOptionsSchema } from '../tts/config';
import { TtsServiceContract } from '../tts/TtsServiceContract';
import { createTtsService } from '../tts/server';
import { TtsOperations } from '../tts/operations';
import { TtsServiceCapability, type ITtsService } from '../tts/ITtsService';

export const EdgeTtsServiceProvider: ServiceProviderDefinition<ITtsService> = {
	name: 'edge-tts',
	aliases: ['edge'],
	provides: [TtsServiceCapability],
	title: 'Edge speech',
	description: 'Synthesize MP3 speech without an API key, using a Chinese voice by default.',
	optionsSchema: EdgeTtsServiceOptionsSchema,
	contract: TtsServiceContract,
	operations: TtsOperations,
	create(context) {
		const parsed = EdgeTtsServiceConfigSchema.safeParse(context.config);
		if (!parsed.success || context.config.baseUrl !== undefined || Object.keys(context.config.headers ?? {}).length)
			throw new TypeError('Invalid Edge TTS configuration');
		return {
			tts: createTtsService(
				createEdgeTtsClient({
					...parsed.data.options,
					fetch: context.fetch,
					socketFactory: context.edgeTtsSocketFactory,
				}),
				'edge-tts',
			),
		};
	},
};
