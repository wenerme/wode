import type { PromptProtocol, PromptTarget } from '../ai/prompt';
import type { AiModel, AiProtocol, AiProvider } from './AiConfig';
import type { ResolvedCliContext } from './CliConfig';

/** 与 wcli provider registry 使用同一组规范协议名和别名。 */
export function normalizeAiProtocol(api: AiProtocol): PromptProtocol {
	if (api === 'anthropic' || api === 'anthropic-messages') return 'anthropic';
	if (api === 'gemini' || api === 'google-generative-ai') return 'gemini';
	if (api === 'openai-response' || api === 'openai-responses') return 'openai-response';
	return 'openai';
}
export function listAiModels(context: ResolvedCliContext) {
	return Object.entries(context.providers ?? {}).flatMap(([providerName, provider]) =>
		Object.entries(provider.models ?? {}).map(([alias, model]) => ({
			name: `${providerName}/${alias}`,
			provider: providerName,
			alias,
			model: model.name ?? alias,
			title: model.title,
			api: model.api ?? provider.api,
			contextSize: model.contextSize,
			maxOutputTokens: model.maxOutputTokens,
			enabled: !provider.disabled && !model.disabled,
			default: context.defaultModel === `${providerName}/${alias}`,
		})),
	);
}
export interface ResolvedAiModel {
	name: string;
	providerName: string;
	model: string;
	config: AiModel;
	provider: AiProvider;
	target: PromptTarget;
}

export function resolveAiModel(
	context: ResolvedCliContext,
	options: {
		model?: string;
		provider?: string;
		protocol?: AiProtocol;
		env?: Readonly<Record<string, string | undefined>>;
		getEnv?(name: string): string | undefined;
		requireKey?: boolean;
	} = {},
): ResolvedAiModel {
	const providers = context.providers ?? {};
	const spec = options.model ?? (options.provider ? undefined : context.defaultModel);
	let providerName = options.provider;
	let alias: string | undefined;
	const slash = spec?.indexOf('/') ?? -1;
	if (spec && slash > 0 && Object.hasOwn(providers, spec.slice(0, slash))) {
		if (providerName && providerName !== spec.slice(0, slash))
			throw new Error('Model and provider selections conflict');
		providerName = spec.slice(0, slash);
		alias = spec.slice(slash + 1);
	} else alias = spec;
	if (providerName && !Object.hasOwn(providers, providerName)) throw new Error('Unknown AI provider');
	if (!providerName) {
		const matches = Object.entries(providers).filter(
			([, provider]) =>
				!provider.disabled &&
				(!alias ||
					Object.hasOwn(provider.models ?? {}, alias) ||
					Object.values(provider.models ?? {}).some((model) => model.name === alias)),
		);
		if (matches.length !== 1) throw new Error('Select one AI model with --model provider/model or configure model use');
		providerName = matches[0][0];
	}
	const provider = providers[providerName];
	if (provider.disabled) throw new Error('Selected AI provider is disabled');
	if (!alias) {
		alias = provider.defaultModel;
		if (!alias) {
			const enabled = Object.entries(provider.models ?? {}).filter(([, model]) => !model.disabled);
			if (enabled.length === 1) alias = enabled[0][0];
		}
	}
	if (!alias) throw new Error('Select an AI model with --model or configure model use');
	let modelConfig = Object.hasOwn(provider.models ?? {}, alias) ? provider.models?.[alias] : undefined;
	if (!modelConfig) {
		const matches = Object.entries(provider.models ?? {}).filter(([, model]) => model.name === alias);
		if (matches.length > 1) throw new Error('Multiple model aliases match; select one explicitly');
		if (matches.length === 1) {
			alias = matches[0][0];
			modelConfig = matches[0][1];
		}
	}
	const config = modelConfig ?? {};
	if (config.disabled) throw new Error('Selected AI model is disabled');
	const candidateApi = normalizeAiProtocol(options.protocol ?? config.api ?? provider.api);
	const endpoint = config.endpointKey
		? provider.endpoints?.[config.endpointKey]
		: Object.entries(provider.endpoints ?? {}).find(([key, endpoint]) => {
				const candidate = endpoint.api ?? key;
				return (
					[
						'openai',
						'openai-compatible',
						'openai-chat-completions',
						'openai-response',
						'openai-responses',
						'anthropic',
						'anthropic-messages',
						'gemini',
						'google-generative-ai',
					].includes(candidate) && normalizeAiProtocol(candidate as AiProtocol) === candidateApi
				);
			})?.[1];
	if (config.endpointKey && !endpoint) throw new Error('Model endpoint is not configured');
	const api = normalizeAiProtocol(options.protocol ?? config.api ?? endpoint?.api ?? provider.api);
	const baseUrl = endpoint?.baseUrl ?? provider.baseUrl;
	if (!baseUrl) throw new Error('AI provider requires a base URL');
	const keyEnv = endpoint?.apiKeyEnv ?? provider.apiKeyEnv;
	const apiKey =
		endpoint?.apiKey ?? provider.apiKey ?? (keyEnv ? (options.env?.[keyEnv] ?? options.getEnv?.(keyEnv)) : undefined);
	if (keyEnv && !apiKey && options.requireKey !== false)
		throw new Error('Provider API key environment variable is not set');
	return {
		name: `${providerName}/${alias}`,
		providerName,
		model: config.name ?? alias,
		config,
		provider,
		target: { api, baseUrl, apiKey, headers: { ...provider.headers, ...endpoint?.headers } },
	};
}
