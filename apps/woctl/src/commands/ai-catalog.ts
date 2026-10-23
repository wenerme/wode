import { type CliCommand, CliUsageError } from '@wener/common/cli';
import {
	AiModelSchema,
	type AiProvider,
	AiProviderSchema,
	describeAiProvider,
	listAiModels,
	resolveAiModel,
	resolveCliContext,
} from 'common/context';
import {
	changeCommandConfig,
	loadCommandContext,
	optionNumber,
	optionString,
	readCommandText,
	setConfigEntry,
	writeCommandOutput,
} from '../command-utils';
import type { WocliExecution } from '../createWocliCli';

/** 写操作将选中 context 的 provider 副本落盘，根目录配置仍由根文件维护。 */
function providerCopy(
	config: Awaited<ReturnType<WocliExecution['host']['config']['load']>>,
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
export function createAiCatalogCommands(serviceProviders: () => string[]): CliCommand<WocliExecution>[] {
	const provider: CliCommand<WocliExecution> = {
		name: 'provider',
		description: '管理 AI provider 连接配置',
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: '列出当前 context 的 AI provider（隐藏凭据）',
				options: [{ name: 'search', description: '按名称过滤' }],
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
				description: '显示 AI provider 的公开配置',
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
				description: '添加 AI provider；凭据优先使用环境变量引用',
				options: [
					{ name: 'api', description: 'openai | openai-response | anthropic | gemini' },
					{ name: 'url', description: 'Provider base URL' },
					{ name: 'title', description: '显示标题' },
					{ name: 'api-key-env', description: 'Node 宿主读取的环境变量名' },
					{ name: 'input', description: '完整 provider JSON 或 @文件' },
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
				description: '删除当前 context 自有的 AI provider',
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
				description: '列出 service provider 插件（system/http 等）',
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
	const model: CliCommand<WocliExecution> = {
		name: 'model',
		description: '管理 AI 模型目录与默认模型',
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: '列出配置的模型',
				options: [
					{ name: 'provider', description: '按 provider 过滤' },
					{ name: 'search', description: '按模型名过滤' },
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
				description: '向 provider 添加模型别名',
				options: [
					{ name: 'provider', description: 'Provider 名称（必填）' },
					{ name: 'id', description: '上游模型 ID，默认使用别名' },
					{ name: 'title', description: '显示标题' },
					{ name: 'max-output-tokens', description: '模型默认输出 token 上限' },
					{ name: 'context-size', description: '上下文大小' },
					{ name: 'temperature', description: '默认温度' },
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
				description: '显示模型与解析后的 provider（隐藏凭据）',
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
				description: '为当前 context 选择默认模型',
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
				description: '删除模型别名',
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
