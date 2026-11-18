import { type CliCommand, CliUsageError } from '@wener/common/cli';
import {
	AiModelSchema,
	type AiProvider,
	AiProviderSchema,
	describeAiProvider,
	listAiModels,
	resolveAiModel,
} from 'common/ai';
import { resolveCliContext } from 'common/context';
import {
	changeCommandConfig,
	loadCommandContext,
	optionNumber,
	optionString,
	readCommandText,
	setConfigEntry,
	writeCommandOutput,
} from '../command-utils';
import type { CliExecution } from '../createCli';

/** 写操作将选中 context 的 provider 副本落盘，根目录配置仍由根文件维护。 */
function providerCopy(
	config: Awaited<ReturnType<CliExecution['host']['config']['load']>>,
	name: string,
	contextName: string,
): AiProvider {
	const selected = config.contexts[contextName];
	const provider = selected.providers?.[name] ?? config.providers?.[name];
	if (!provider) throw new CliUsageError('Unknown AI provider');
	const copy = structuredClone(provider);
	selected.providers ??= {};
	selected.providers[name] = copy;
	return copy;
}
export function createAiCatalogCommands(serviceProviders: () => string[]): CliCommand<CliExecution>[] {
	const provider: CliCommand<CliExecution> = {
		name: 'provider',
		description: 'Manage AI provider connections',
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: 'List AI providers in the current context with credentials hidden',
				options: [{ name: 'search', description: 'Filter by name' }],
				async run({ options }, context) {
					const resolved = await loadCommandContext(context, options);
					const search = optionString(options, 'search')?.toLowerCase();
					writeCommandOutput(
						Object.entries(resolved.providers ?? {})
							.filter(([name]) => !search || name.toLowerCase().includes(search))
							.map(([name, value]) => ({ name, ...describeAiProvider(value) })),
						options,
						context,
					);
				},
			},
			{
				name: 'show',
				arguments: '<name>',
				description: 'Show public AI provider configuration',
				async run({ args, options }, context) {
					const resolved = await loadCommandContext(context, options);
					if (!Object.hasOwn(resolved.providers ?? {}, args[0])) throw new CliUsageError('Unknown AI provider');
					writeCommandOutput(
						{ name: args[0], ...describeAiProvider(resolved.providers?.[args[0]] as AiProvider) },
						options,
						context,
					);
				},
			},
			{
				name: 'add',
				arguments: '<name>',
				description: 'Add an AI provider; prefer environment variable references for credentials',
				options: [
					{ name: 'api', description: 'openai | openai-response | anthropic | gemini' },
					{ name: 'url', description: 'Provider base URL' },
					{ name: 'title', description: 'Display title' },
					{ name: 'api-key-env', description: 'Environment variable name read by the Node host' },
					{ name: 'input', description: 'Complete provider JSON or @file' },
				],
				async run({ args, options }, context) {
					const raw = optionString(options, 'input');
					let input: unknown;
					try {
						input = raw
							? JSON.parse(await readCommandText(raw, context))
							: {
									api: optionString(options, 'api') ?? 'openai',
									baseUrl: optionString(options, 'url'),
									title: optionString(options, 'title'),
									apiKeyEnv: optionString(options, 'api-key-env'),
								};
					} catch (error) {
						if (error instanceof SyntaxError) throw new CliUsageError('Provider input must be valid JSON');
						throw error;
					}
					const value = AiProviderSchema.parse(input);
					if (!value.baseUrl && !Object.keys(value.endpoints ?? {}).length)
						throw new CliUsageError('Provider requires --url or endpoint configuration');
					await changeCommandConfig(context, options, (config, name) => {
						if (Object.hasOwn({ ...config.providers, ...config.contexts[name].providers }, args[0]))
							throw new CliUsageError('AI provider already exists');
						config.contexts[name].providers ??= {};
						setConfigEntry(config.contexts[name].providers, args[0], value);
					});
				},
			},
			{
				name: 'remove',
				arguments: '<name>',
				description: 'Remove an AI provider defined in the current context',
				run: ({ args, options }, context) =>
					changeCommandConfig(context, options, (config, name) => {
						const selected = config.contexts[name];
						if (!Object.hasOwn(selected.providers ?? {}, args[0]))
							throw new CliUsageError('AI provider is not configured in this context');
						const resolvedContext = resolveCliContext(config, name);
						const defaultModel = resolvedContext.defaultModel
							? resolveAiModel(resolvedContext, { requireKey: false })
							: undefined;
						if (defaultModel?.providerName === args[0])
							throw new CliUsageError('Select a different default model before removing its provider');
						delete selected.providers?.[args[0]];
					}),
			},
			{
				name: 'types',
				description: 'List service provider plugins (system/http, etc.)',
				run: ({ options }, context) => {
					writeCommandOutput(
						serviceProviders().map((name) => ({ name })),
						options,
						context,
					);
				},
			},
		],
	};
	const model: CliCommand<CliExecution> = {
		name: 'model',
		description: 'Manage the AI model catalog and default model',
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: 'List configured models',
				options: [
					{ name: 'provider', description: 'Filter by provider' },
					{ name: 'search', description: 'Filter by model name' },
				],
				async run({ options }, context) {
					const rows = listAiModels(await loadCommandContext(context, options));
					const provider = optionString(options, 'provider');
					const search = optionString(options, 'search')?.toLowerCase();
					writeCommandOutput(
						rows.filter(
							(row) => (!provider || row.provider === provider) && (!search || row.name.toLowerCase().includes(search)),
						),
						options,
						context,
					);
				},
			},
			{
				name: 'add',
				arguments: '<name>',
				description: 'Add a model alias to a provider',
				options: [
					{ name: 'provider', description: 'Provider name (required)' },
					{ name: 'id', description: 'Upstream model ID; defaults to the alias' },
					{ name: 'title', description: 'Display title' },
					{ name: 'max-output-tokens', description: 'Default model output token limit' },
					{ name: 'context-size', description: 'Context size' },
					{ name: 'temperature', description: 'Default temperature' },
				],
				async run({ args, options }, context) {
					const providerName = optionString(options, 'provider');
					if (!providerName) throw new CliUsageError('--provider is required');
					const value = AiModelSchema.parse({
						name: optionString(options, 'id') ?? args[0],
						title: optionString(options, 'title'),
						maxOutputTokens: optionNumber(options, 'max-output-tokens', { min: 1, integer: true }),
						contextSize: optionNumber(options, 'context-size', { min: 1, integer: true }),
						temperature: optionNumber(options, 'temperature', { min: 0, max: 2 }),
					});
					await changeCommandConfig(context, options, (config, name) => {
						const provider = providerCopy(config, providerName, name);
						provider.models ??= {};
						if (Object.hasOwn(provider.models, args[0])) throw new CliUsageError('Model alias already exists');
						setConfigEntry(provider.models, args[0], value);
					});
				},
			},
			{
				name: 'show',
				arguments: '<model>',
				description: 'Show the model and resolved provider with credentials hidden',
				async run({ args, options }, context) {
					const selected = await loadCommandContext(context, options);
					const resolved = resolveAiModel(selected, { model: args[0], requireKey: false });
					writeCommandOutput(
						{
							...resolved.config,
							name: resolved.name,
							model: resolved.model,
							provider: resolved.providerName,
							api: resolved.target.api,
							defaultModel: selected.defaultModel,
						},
						options,
						context,
					);
				},
			},
			{
				name: 'use',
				arguments: '<model>',
				description: 'Select the default model for the current context',
				async run({ args, options }, context) {
					const resolved = resolveAiModel(await loadCommandContext(context, options), {
						model: args[0],
						requireKey: false,
					});
					await changeCommandConfig(context, options, (config, name) => {
						config.contexts[name].defaultModel = resolved.name;
					});
				},
			},
			{
				name: 'remove',
				arguments: '<model>',
				description: 'Remove a model alias',
				async run({ args, options }, context) {
					await changeCommandConfig(context, options, (config, name) => {
						const selected = resolveCliContext(config, name);
						const resolved = resolveAiModel(selected, { model: args[0], requireKey: false });
						const defaultModel = selected.defaultModel ? resolveAiModel(selected, { requireKey: false }) : undefined;
						if (defaultModel?.name === resolved.name)
							throw new CliUsageError('Select a different default model before removing this model');
						const provider = providerCopy(config, resolved.providerName, name);
						const alias = resolved.name.slice(resolved.providerName.length + 1);
						if (!Object.hasOwn(provider.models ?? {}, alias)) throw new CliUsageError('Unknown model alias');
						delete provider.models?.[alias];
					});
				},
			},
		],
	};
	return [provider, model];
}
