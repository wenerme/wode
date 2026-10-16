/** A single Pi provider with four distinct client protocol aliases. */
export function createPiRouterModels(baseURL: string) {
	const root = baseURL.replace(/\/$/, '');
	return {
		$schema: 'https://pi.dev/schemas/models.schema.json',
		providers: {
			'local-ai-router': {
				apiKey: 'local-router-test',
				baseUrl: `${root}/v1`,
				models: [
					{ id: 'router-chat', api: 'openai-completions', contextWindow: 8192, maxTokens: 128 },
					{ id: 'router-responses', api: 'openai-responses', contextWindow: 8192, maxTokens: 128 },
					{ id: 'router-messages', api: 'anthropic-messages', baseUrl: root, contextWindow: 8192, maxTokens: 128 },
					{
						id: 'router-gemini',
						api: 'google-generative-ai',
						baseUrl: `${root}/v1beta`,
						contextWindow: 8192,
						maxTokens: 128,
					},
				],
			},
		},
	};
}
