import { z } from 'zod';

/** 沿用 wcli 的协议名和 provider.models 目录结构，独立于 service 插件。 */
export const AiProtocolSchema = z.enum([
	'openai',
	'openai-compatible',
	'openai-response',
	'openai-responses',
	'openai-chat-completions',
	'anthropic',
	'anthropic-messages',
	'gemini',
	'google-generative-ai',
]);
export type AiProtocol = z.infer<typeof AiProtocolSchema>;
const key = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/);
const modelName = z.string().min(1).max(256);
export const AiModelSchema = z.object({
	name: modelName.optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	api: AiProtocolSchema.optional(),
	endpointKey: z.string().optional(),
	contextSize: z.number().int().positive().optional(),
	maxOutputTokens: z.number().int().positive().optional(),
	temperature: z.number().min(0).max(2).optional(),
	disabled: z.boolean().optional(),
});
export type AiModel = z.infer<typeof AiModelSchema>;
export const AiEndpointSchema = z.object({
	api: AiProtocolSchema.optional(),
	baseUrl: z.url(),
	apiKey: z.string().optional(),
	apiKeyEnv: key.optional(),
	headers: z.record(z.string(), z.string()).optional(),
});
export const AiProviderSchema = z.object({
	api: AiProtocolSchema.default('openai'),
	title: z.string().optional(),
	baseUrl: z.url().optional(),
	apiKey: z.string().optional(),
	apiKeyEnv: key.optional(),
	headers: z.record(z.string(), z.string()).optional(),
	endpoints: z.record(z.string(), AiEndpointSchema).optional(),
	models: z.record(modelName, AiModelSchema).optional(),
	defaultModel: modelName.optional(),
	disabled: z.boolean().optional(),
});
export type AiProvider = z.infer<typeof AiProviderSchema>;
export const PromptPresetSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	template: z.string(),
	system: z.string().optional(),
	model: z.string().optional(),
	input: z.record(z.string(), z.json()).optional(),
	temperature: z.number().min(0).max(2).optional(),
	maxOutputTokens: z.number().int().positive().optional(),
});
export type PromptPreset = z.infer<typeof PromptPresetSchema>;
export const AiConfigShape = {
	providers: z.record(key, AiProviderSchema).optional(),
	defaultModel: z.string().min(1).optional(),
	prompts: z.record(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_./-]*$/), PromptPresetSchema).optional(),
};

/** 显示层只导出明确允许的字段，避免 headers/options/URL 参数进入目录输出。 */
export function describeAiProvider(provider: AiProvider) {
	return {
		api: provider.api,
		title: provider.title,
		baseUrl: provider.baseUrl ? publicConfigUrl(provider.baseUrl) : undefined,
		disabled: provider.disabled,
		apiKeyConfigured: Boolean(
			provider.apiKey || provider.apiKeyEnv || (provider.headers && Object.keys(provider.headers).length),
		),
		defaultModel: provider.defaultModel,
		models: provider.models,
		...(provider.endpoints
			? {
					endpoints: Object.fromEntries(
						Object.entries(provider.endpoints).map(([name, endpoint]) => [
							name,
							{
								api: endpoint.api,
								baseUrl: publicConfigUrl(endpoint.baseUrl),
								apiKeyConfigured: Boolean(endpoint.apiKey || endpoint.apiKeyEnv || endpoint.headers),
							},
						]),
					),
				}
			: {}),
	};
}
export function publicConfigUrl(value: string): string {
	const url = new URL(value);
	url.username = '';
	url.password = '';
	url.search = '';
	url.hash = '';
	return url.toString();
}
