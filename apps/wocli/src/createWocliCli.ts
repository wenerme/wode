import {
	Cli,
	type CliCommand,
	type CliContext,
	type CliOption,
	type CliOptions,
	type CliTerminalInfo,
	CliUsageError,
	splitCliCommandLine,
} from '@wener/common/cli';
import type { PromptExecutionOptions, PromptRequest, PromptResult } from 'common/ai/prompt';
import {
	type CliConfig,
	CliConfigError,
	type CliConfigStore,
	describeCliContext,
	type ResolvedCliContext,
	resolveCliContext,
} from 'common/context';
import {
	createServiceRuntime,
	type ServiceProvider,
	ServiceProviderRegistry,
	type ServiceRuntimeClient,
} from 'common/service';
import { createServiceCliCommand, type ServiceCliDefinition } from 'common/service/cli';
import { createRemoteServiceToolClient } from 'common/service/runtime/client';
import {
	writeCommandOutput as output,
	readCommandText as readText,
	setConfigEntry,
	optionString as text,
} from './command-utils';
import { createAiCatalogCommands } from './commands/ai-catalog';
import { createPromptCommand } from './commands/prompt';
import { createRenderCommands } from './commands/render';
import { createServiceExtraCommands } from './commands/service-extra';
import { createBuiltinProviders, SystemCliDefinition, VERSION } from './core';

/** Application metadata; provider names need not match command names or aliases. */
export interface WocliCommand extends Omit<CliCommand<WocliExecution>, 'commands'> {
	serviceProvider?: string;
	commands?: readonly WocliCommand[];
}

export interface WocliDescribeOptions {
	context?: string;
	argv?: readonly string[];
}

export interface WocliHost {
	config: CliConfigStore;
	runtime?: ServiceRuntimeClient;
	providers?: readonly ServiceProvider[];
	commands?: readonly WocliCommand[];
	info?: Record<string, unknown>;
	fetch?: typeof globalThis.fetch;
	env?: Readonly<Record<string, string | undefined>>;
	getEnv?(name: string): string | undefined;
	term?: CliTerminalInfo;
	generate?(request: PromptRequest, options: PromptExecutionOptions): Promise<PromptResult>;
	readText?(value: string, options: { signal: AbortSignal; maxBytes: number }): Promise<string>;
	writeText?(path: string, content: string, options: { signal: AbortSignal }): Promise<void>;
}
export interface WocliExecution extends CliContext {
	host: WocliHost;
	getConfigContext(options?: CliOptions): ResolvedCliContext;
	withServices<T>(
		options: CliOptions,
		run: (runtime: ServiceRuntimeClient, context: ResolvedCliContext) => Promise<T>,
	): Promise<T>;
}

export function createWocliServiceCommand<S>(
	definition: ServiceCliDefinition<S>,
	provider = definition.name,
): WocliCommand {
	return {
		serviceProvider: provider,
		...createServiceCliCommand(definition, {
			options: [{ name: 'service', description: '选择服务名称' }],
			readText,
			async run(operation, options, context, prepare) {
				// 参数准备先于获取 client；帮助和无效输入不会创建服务连接。
				const invoke = await prepare();
				await context.withServices(options, async (runtime, resolved) => {
					const candidates = Object.entries(resolved.services).filter(([, service]) => service.provider === provider);
					const selector = text(options, 'service') ?? resolved.defaults[provider];
					const matches = selector ? candidates.filter(([key]) => key === selector) : candidates;
					if (matches.length !== 1) throw new CliUsageError('Select one matching service with --service');
					const [service, config] = matches[0];
					if (operation.mutating && config.readOnly !== false) throw new CliUsageError('Selected service is read-only');
					const client = await createRemoteServiceToolClient<S>(runtime, service, { signal: context.signal });
					output(await invoke(client, { signal: context.signal }), options, context);
				});
			},
		}),
	};
}

export function createWocliCli(host: WocliHost) {
	const providers = new ServiceProviderRegistry([...createBuiltinProviders(host.info), ...(host.providers ?? [])]);
	const globalOptions: readonly CliOption[] = [
		{
			name: 'context',
			aliases: ['c'],
			description: '为本次命令选择 context',
		},
		{ name: 'json', type: 'boolean', description: '完整 JSON 输出' },
		{ name: 'output', aliases: ['o'], description: '输出格式：table、json、yaml、csv、md 等' },
		{ name: 'format', aliases: ['f'], description: '输出字段，例如 name,provider' },
	];
	const cli = new Cli<WocliExecution>('wocli', { options: globalOptions });
	const registrations: Array<{ method: 'add' | 'merge'; command: WocliCommand }> = [];
	function add(command: WocliCommand) {
		const snapshot = snapshotCommand(command);
		cli.add(snapshot);
		registrations.push({ method: 'add', command: snapshot });
	}
	function merge(command: WocliCommand) {
		const snapshot = snapshotCommand(command);
		cli.merge(snapshot);
		registrations.push({ method: 'merge', command: snapshot });
	}
	add({
		name: 'version',
		description: '显示版本',
		run: (_input, context) => {
			context.stdout(VERSION);
		},
	});
	const aiCatalog = createAiCatalogCommands(() => providers.list());
	for (const command of aiCatalog) add(command);
	async function change(
		context: WocliExecution,
		options: CliOptions,
		edit: (config: CliConfig) => void,
		selected = text(options, 'context'),
	) {
		context.signal.throwIfAborted();
		const config = await context.host.config.load({ context: selected });
		edit(config);
		context.signal.throwIfAborted();
		await context.host.config.save(config);
		output({ saved: true }, options, context);
	}
	add({
		name: 'context',
		description: '管理执行环境',
		commands: [
			{
				name: 'list',
				description: '列出 context',
				async run({ options }, context) {
					const config = await context.host.config.load({ context: text(options, 'context') });
					output(
						Object.entries(config.contexts).map(([name, entry]) => ({
							name,
							title: entry.title,
							current: name === config.currentContext,
						})),
						options,
						context,
					);
				},
			},
			{
				name: 'show',
				arguments: '[name]',
				description: '显示合并后的 context（隐藏凭据）',
				async run({ args, options }, context) {
					const selected = args[0] ?? text(options, 'context');
					output(describeCliContext(context.getConfigContext({ context: selected })), options, context);
				},
			},
			{
				name: 'create',
				arguments: '<name>',
				description: '创建 context',
				async run({ args, options }, context) {
					context.signal.throwIfAborted();
					if (context.host.config.createContext) {
						await context.host.config.createContext(args[0], { context: text(options, 'context') });
						output({ saved: true }, options, context);
						return;
					}
					await change(context, options, (config) => {
						if (Object.hasOwn(config.contexts, args[0])) throw new CliUsageError('Context already exists');
						setConfigEntry(config.contexts, args[0], { services: {}, defaults: {} });
					});
				},
			},
			{
				name: 'use',
				arguments: '<name>',
				description: '切换默认 context',
				run: ({ args, options }, context) =>
					change(
						context,
						options,
						(config) => {
							resolveCliContext(config, args[0]);
							config.currentContext = args[0];
						},
						args[0],
					),
			},
			{
				name: 'remove',
				arguments: '<name>',
				description: '删除非当前 context',
				run: ({ args, options }, context) =>
					change(
						context,
						options,
						(config) => {
							resolveCliContext(config, args[0]);
							if (config.currentContext === args[0]) throw new CliUsageError('Cannot remove the current context');
							delete config.contexts[args[0]];
						},
						args[0],
					),
			},
		],
	});
	add({
		name: 'service',
		description: '配置、发现和调用 service',
		commands: [
			{
				name: 'providers',
				description: '列出 service provider 插件',
				run: ({ options }, context) => {
					output(
						providers.list().map((name) => ({ name })),
						options,
						context,
					);
				},
			},
			{
				name: 'list',
				description: '列出当前 context 的服务',
				async run({ options }, context) {
					await context.withServices(options, async (_runtime, resolved) => {
						output(
							Object.entries(resolved.configuredServices ?? resolved.services).map(([name, service]) => ({
								name,
								provider: service.provider,
								...(service.type ? { type: service.type } : {}),
								disabled: service.disabled === true || service.enabled === false,
								readOnly: service.readOnly,
								title: service.title,
							})),
							options,
							context,
						);
					});
				},
			},
			{
				name: 'add',
				arguments: '<name>',
				description: '在当前 context 中添加服务',
				options: [
					{ name: 'provider', description: 'provider 名称：system、http 等' },
					{ name: 'url', description: 'HTTP runtime 的 base URL' },
					{ name: 'id', description: '远端 service ID，默认使用服务名称' },
					{ name: 'writable', type: 'boolean', description: '允许此服务调用写操作' },
				],
				run: ({ args, options }, context) =>
					change(context, options, (config) => {
						const provider = text(options, 'provider');
						if (!provider) throw new CliUsageError('--provider is required');
						if (!host.runtime) providers.get(provider);
						const selected = resolveCliContext(config, text(options, 'context'));
						if (Object.hasOwn(selected.configuredServices ?? selected.services, args[0]))
							throw new CliUsageError('Service already exists');
						if (provider === 'http' && !text(options, 'url')) throw new CliUsageError('HTTP service requires --url');
						setConfigEntry(config.contexts[selected.name].services, args[0], {
							provider,
							baseUrl: text(options, 'url'),
							id: text(options, 'id'),
							readOnly: !options.writable,
						});
					}),
			},
			{
				name: 'remove',
				arguments: '<name>',
				description: '删除当前 context 自身配置的服务',
				run: ({ args, options }, context) =>
					change(context, options, (config) => {
						const selected = resolveCliContext(config, text(options, 'context'));
						if (!Object.hasOwn(config.contexts[selected.name].services, args[0]))
							throw new CliUsageError('Service is not configured in this context');
						delete config.contexts[selected.name].services[args[0]];
					}),
			},
			{
				name: 'schema',
				arguments: '<service>',
				description: '显示 service 工具定义',
				async run({ args, options }, context) {
					await context.withServices(options, async (runtime) => {
						output(
							await runtime.getSchema({ params: { service: args[0] } }, { signal: context.signal }),
							options,
							context,
						);
					});
				},
			},
			{
				name: 'call',
				arguments: '<service> <tool>',
				description: '调用 service 工具',
				options: [{ name: 'input', aliases: ['i'], description: 'JSON、@文件，或 - 读取 stdin；默认 {}' }],
				async run({ args, options }, context) {
					let input: unknown;
					try {
						input = JSON.parse(await readText(text(options, 'input') ?? '{}', context));
					} catch (error) {
						if (error instanceof SyntaxError) throw new CliUsageError('--input must be valid JSON');
						throw error;
					}
					await context.withServices(options, async (runtime) => {
						output(
							await runtime.call(
								{ params: { service: args[0] }, body: { toolName: args[1], input } },
								{ signal: context.signal },
							),
							options,
							context,
						);
					});
				},
			},
		],
	});
	add(createWocliServiceCommand(SystemCliDefinition));
	merge({ name: 'service', description: '服务配置与调用', commands: createServiceExtraCommands() });
	merge({ name: 'context', aliases: ['ctx'], description: '管理执行环境与 AI 目录', commands: aiCatalog });
	add(createPromptCommand());
	for (const command of createRenderCommands()) add(command);
	for (const command of host.commands ?? []) add(command);
	cli.seal();

	async function prepare(input: WocliDescribeOptions, signal?: AbortSignal) {
		signal?.throwIfAborted();
		const argv = normalizeArgv(input.argv ?? []);
		const parsed = cli.parse(argv);
		const argumentContext = text(parsed.options, 'context');
		const targetContext =
			parsed.path[0] === 'context' && ['show', 'use', 'remove'].includes(parsed.path[1]) ? parsed.args[0] : undefined;
		if (
			input.context !== undefined &&
			[argumentContext, targetContext].some((value) => value !== undefined && value !== input.context)
		)
			throw new CliUsageError('Explicit context conflicts with argv context');
		const selected = targetContext ?? input.context ?? argumentContext ?? (host.env?.WOCLI_CONTEXT || undefined);
		let config: CliConfig | undefined;
		let resolved: ResolvedCliContext | undefined;
		let error: CliConfigError | undefined;
		try {
			config = await host.config.load({ context: selected });
			signal?.throwIfAborted();
			resolved = resolveCliContext(config, selected);
		} catch (cause) {
			signal?.throwIfAborted();
			if (!(cause instanceof CliConfigError)) throw cause;
			error = cause;
		}
		signal?.throwIfAborted();
		const supported = new Set(providers.list());
		const available = new Set(
			Object.values(resolved?.services ?? {})
				.filter((service) => host.runtime || supported.has(service.provider))
				.map((service) => service.provider),
		);
		const hasAi = Object.keys(resolved?.providers ?? {}).length > 0;
		const tree = new Cli<WocliExecution>('wocli', {
			options: globalOptions.map((option) => (option.name === 'context' ? { ...option, default: selected } : option)),
		});
		for (const { method, command } of registrations) {
			const filtered = filterCommand(command, available, hasAi, true);
			if (filtered) tree[method](filtered);
		}
		tree.seal();
		function getConfigContext(options: CliOptions = {}): ResolvedCliContext {
			signal?.throwIfAborted();
			if (error) throw error;
			if (!resolved) throw new CliConfigError('Configuration snapshot is unavailable');
			const requested = text(options, 'context');
			if (requested !== undefined && requested !== resolved.name)
				throw new CliUsageError('Cannot change context within one command snapshot');
			return resolved;
		}
		const snapshotStore: CliConfigStore = {
			async load(options) {
				getConfigContext(options);
				if (!config) throw new CliConfigError('Configuration snapshot is unavailable');
				return config;
			},
			async save(next) {
				getConfigContext();
				if (next !== config) throw new CliConfigError('Save requires the original command edit snapshot');
				await host.config.save(next);
				signal?.throwIfAborted();
			},
			...(host.config.createContext
				? {
						async createContext(name: string, options?: { context?: string }) {
							const current = getConfigContext(options);
							await host.config.createContext?.(name, { context: current.name });
							signal?.throwIfAborted();
						},
					}
				: {}),
		};
		return { argv, parsed, tree, error, getConfigContext, host: { ...host, config: snapshotStore } };
	}

	return {
		async describe(options: WocliDescribeOptions = {}) {
			return (await prepare(options)).tree.describe();
		},
		async execute(argv: readonly string[], io: CliContext) {
			const snapshot = await prepare({ argv }, io.signal);
			const recoveryHelp = snapshot.error && (snapshot.parsed.options.help || !snapshot.parsed.path.length);
			if (snapshot.error && !recoveryHelp && !['version', 'render', 'markdown'].includes(snapshot.parsed.path[0]))
				throw snapshot.error;
			if (recoveryHelp) {
				const diagnostic = 'Configuration unavailable; showing core commands only. Check the selected configuration.';
				(io.stderr ?? io.stdout)(diagnostic);
			}
			const context: WocliExecution = {
				...io,
				host: snapshot.host,
				getConfigContext: snapshot.getConfigContext,
				async withServices(options, run) {
					io.signal.throwIfAborted();
					const resolved = snapshot.getConfigContext(options);
					const local = host.runtime
						? undefined
						: createServiceRuntime({ context: resolved, providers, fetch: host.fetch });
					const runtime = host.runtime ?? local;
					if (!runtime) throw new Error('Service runtime unavailable');
					// 对注入的远程 runtime 同样执行目录和只读检查；服务端仍负责最终授权。
					const selected = (name: string) => {
						if (!Object.hasOwn(resolved.services, name)) {
							if (Object.hasOwn(resolved.configuredServices ?? {}, name))
								throw new CliUsageError('Selected service is disabled');
							throw new CliUsageError('Unknown service');
						}
						const service = resolved.services[name];
						if (!host.runtime) providers.get(service.provider);
						return service;
					};
					const guarded: ServiceRuntimeClient = {
						async getSchema(input, callOptions) {
							selected(input.params.service);
							return runtime.getSchema(input, callOptions);
						},
						async call(input, callOptions) {
							const config = selected(input.params.service);
							const schema = await runtime.getSchema({ params: input.params }, callOptions);
							if (!Object.hasOwn(schema.tools, input.body.toolName))
								throw new CliUsageError('Unknown service operation');
							if (config.readOnly !== false && schema.tools[input.body.toolName].annotations?.readOnlyHint !== true)
								throw new CliUsageError('Selected service is read-only');
							io.signal.throwIfAborted();
							return runtime.call(input, callOptions);
						},
					};
					try {
						return await run(guarded, resolved);
					} finally {
						await local?.close();
					}
				},
			};
			return (await snapshot.tree.execute(recoveryHelp ? ['--help'] : snapshot.argv, context)) ?? { exitCode: 0 };
		},
		async executeLine(line: string, io: CliContext) {
			return this.execute(splitCliCommandLine(line), io);
		},
	};
}
export type WocliCli = ReturnType<typeof createWocliCli>;

function normalizeArgv(argv: readonly string[]): readonly string[] {
	return argv.length === 1 && ['--version', '-v'].includes(argv[0]) ? ['version'] : argv;
}

function snapshotCommand(command: WocliCommand): WocliCommand {
	return Object.freeze({
		...command,
		aliases: Object.freeze([...(command.aliases ?? [])]),
		summary: command.summary ? Object.freeze([...command.summary]) : undefined,
		options: Object.freeze(
			(command.options ?? []).map((option) =>
				Object.freeze({
					...option,
					aliases: Object.freeze([...(option.aliases ?? [])]),
				}),
			),
		),
		commands: Object.freeze((command.commands ?? []).map(snapshotCommand)),
	});
}

function filterCommand(
	command: WocliCommand,
	available: ReadonlySet<string>,
	hasAi: boolean,
	root = false,
): WocliCommand | undefined {
	if (command.serviceProvider && !available.has(command.serviceProvider)) return undefined;
	const commands = (command.commands ?? []).flatMap((child) => {
		const filtered = filterCommand(child, available, hasAi);
		return filtered ? [filtered] : [];
	});
	if (command.commands?.length && !commands.length && !command.run && !command.runRaw) return undefined;
	if (root && command.name === 'prompt' && !hasAi)
		return {
			...command,
			commands,
			run: undefined,
			runRaw: undefined,
			arguments: undefined,
			usage: undefined,
			description: '管理和渲染本地 prompt presets',
			options: command.options?.filter((option) => ['output', 'json', 'var', 'input'].includes(option.name)),
		};
	return { ...command, commands };
}
