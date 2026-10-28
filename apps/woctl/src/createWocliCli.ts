import type {
	MessageGenerationOptions,
	MessageGenerationRequest,
	MessageGenerationResult,
} from '@wener/client/ai/message-generation';
import {
	Cli,
	type CliCommand,
	type CliContext,
	type CliOption,
	type CliOptions,
	type CliTerminalInfo,
	CliUsageError,
	resolveCliOutputSelection,
	splitCliCommandLine,
} from '@wener/common/cli';
import {
	createOpenObserveServiceToolClient,
	createServiceRuntime,
	OpenObserveCliDefinition,
	PrometheusCliDefinition,
	type ServiceProvider,
	ServiceProviderRegistry,
	type ServiceRuntimeClient,
	type SqlAdapterFactory,
} from '@wener/common/service';
import { createServiceCliCommand, type ServiceCliDefinition } from '@wener/common/service/cli';
import { sanitizeOpenObserveOutput } from '@wener/common/service/openobserve';
import { createRemoteServiceToolClient } from '@wener/common/service/runtime/client';
import { SQLCliDefinition } from '@wener/common/service/sql/cli';
import { createSqlServiceToolClient } from '@wener/common/service/sql/client';
import { createPrometheusServiceToolClient } from '@wener/common/service/prometheus/client';
import {
	type CliConfig,
	CliConfigError,
	type CliConfigStore,
	type CliMcpServerConfig,
	describeCliContext,
	type ResolvedCliContext,
	resolveCliContext,
} from 'common/context';
import {
	writeCommandOutput as output,
	readCommandText as readText,
	setConfigEntry,
	optionString as text,
} from './command-utils';
import { createAiCatalogCommands } from './commands/ai-catalog';
import { createDiagnosticsCommands, type LogLevel, parseLogLevel, shouldLog } from './commands/diagnostics';
import { createMcpCommand } from './commands/mcp';
import { createPromptCommand } from './commands/prompt';
import { createRenderCommands } from './commands/render';
import { createServiceExtraCommands } from './commands/service-extra';
import { APP_NAME, ENV, LEGACY_ENV } from './const';
import { createBuiltinProviders, SystemCliDefinition, VERSION } from './core';
import { DuckDuckGoCliDefinition } from './services/duckduckgo';

/** Application metadata; provider names need not match command names or aliases. */
export interface WocliCommand extends Omit<CliCommand<WocliExecution>, 'commands'> {
	serviceProvider?: string;
	commands?: readonly WocliCommand[];
}

export interface WocliDescribeOptions {
	context?: string;
	argv?: readonly string[];
}

export interface WocliMcpConnection {
	readonly serverInfo?: Record<string, unknown>;
	listTools(signal: AbortSignal): Promise<readonly Record<string, unknown>[]>;
	listResources(signal: AbortSignal): Promise<readonly Record<string, unknown>[]>;
	readResource(uri: string, signal: AbortSignal): Promise<unknown>;
	callTool(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
	close(): Promise<void>;
}

export interface WocliMcpHost {
	connect(config: CliMcpServerConfig, signal: AbortSignal): Promise<WocliMcpConnection>;
}

export interface WocliHost {
	config: CliConfigStore;
	runtime?: ServiceRuntimeClient;
	providers?: readonly ServiceProvider[];
	commands?: readonly WocliCommand[];
	info?: Record<string, unknown>;
	fetch?: typeof globalThis.fetch;
	sqlDriver?: SqlAdapterFactory;
	env?: Readonly<Record<string, string | undefined>>;
	getEnv?(name: string): string | undefined;
	term?: CliTerminalInfo;
	generate?(request: MessageGenerationRequest, options: MessageGenerationOptions): Promise<MessageGenerationResult>;
	readText?(value: string, options: { signal: AbortSignal; maxBytes: number }): Promise<string>;
	mcp?: WocliMcpHost;
	writeText?(path: string, content: string, options: { signal: AbortSignal }): Promise<void>;
}
export interface WocliExecution extends CliContext {
	host: WocliHost;
	selectedContext: string;
	configError?: CliConfigError;
	log(level: LogLevel, message: string): void;
	getConfigContext(options?: CliOptions): ResolvedCliContext;
	resolveServiceProvider?(name: string): string | undefined;
	withServices<T>(
		options: CliOptions,
		run: (runtime: ServiceRuntimeClient, context: ResolvedCliContext) => Promise<T>,
	): Promise<T>;
}

export function createWocliServiceCommand<S>(
	definition: ServiceCliDefinition<S>,
	provider = definition.name,
	createClient?: (runtime: ServiceRuntimeClient, service: string, readOnly: boolean, signal: AbortSignal) => Promise<S>,
): WocliCommand {
	return {
		serviceProvider: provider,
		...createServiceCliCommand(definition, {
			options: [
				{ name: 'service', description: 'Select a service by name' },
				{ name: 'list-services', type: 'boolean', description: 'List available services of the same type in the current context' },
			],
			readText,
			async root(options, context: WocliExecution, help) {
				if (!options['list-services']) {
					context.stdout(help);
					return;
				}
				const resolved = context.getConfigContext(options);
				const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
				const defaults = new Set(
					Object.entries(resolved.defaults)
						.filter(([name]) => canonical(name) === canonical(provider))
						.map(([, name]) => name),
				);
				output(
					Object.entries(resolved.services)
						.filter(([, config]) => canonical(config.provider) === canonical(provider))
						.map(([name, config]) => ({
							name,
							provider: canonical(config.provider),
							readOnly: config.readOnly,
							default: defaults.has(name),
						})),
					options,
					context,
				);
			},
			async run(operation, options, context, prepare) {
				// 参数准备先于获取 client；帮助和无效输入不会创建服务连接。
				await context.withServices(options, async (runtime, resolved) => {
					const resolveProvider = (name: string) => context.resolveServiceProvider?.(name) ?? name;
					const canonicalProvider = resolveProvider(provider);
					const candidates = Object.entries(resolved.services).filter(
						([, service]) => resolveProvider(service.provider) === canonicalProvider,
					);
					const explicit = text(options, 'service');
					const defaults = [
						...new Set(
							Object.entries(resolved.defaults)
								.filter(([key]) => resolveProvider(key) === canonicalProvider)
								.map(([, value]) => value),
						),
					];
					if (!explicit && defaults.length > 1) throw new CliUsageError('Conflicting default services');
					const selector = explicit ?? defaults[0];
					const matches = selector ? candidates.filter(([key]) => key === selector) : candidates;
					if (matches.length !== 1) throw new CliUsageError('Select one matching service with --service');
					const [service, config] = matches[0];
					if (operation.mutating && config.readOnly !== false) throw new CliUsageError('Selected service is read-only');
					const invoke = await prepare();
					const client = createClient
						? await createClient(runtime, service, config.readOnly !== false, context.signal)
						: await createRemoteServiceToolClient<S>(runtime, service, { signal: context.signal });
					const result = await invoke(client, { signal: context.signal });
					const tabular = ['table', 'wide'].includes(resolveCliOutputSelection(options).format);
					output(tabular && operation.table ? operation.table(result) : result, options, context);
				});
			},
		}),
	};
}

export function createWocliCli(host: WocliHost) {
	const providers = new ServiceProviderRegistry([...createBuiltinProviders(host.info), ...(host.providers ?? [])]);
	const resolveServiceProvider = (name: string) => providers.resolveName(name) ?? (host.runtime ? name : undefined);
	const globalOptions: readonly CliOption[] = [
		{
			name: 'context',
			aliases: ['c'],
			description: 'Select a context for this command',
		},
		{ name: 'json', type: 'boolean', description: 'Complete JSON output' },
		{ name: 'output', aliases: ['o'], description: 'Output format: table, json, yaml, csv, md, etc.' },
		{ name: 'format', aliases: ['f'], description: 'Output fields, e.g. name,provider' },
		{ name: 'log-level', description: 'Log level: trace, verbose, debug, info, warning, error' },
		{ name: 'verbose', type: 'boolean', description: 'Enable verbose logging' },
	];
	const cli = new Cli<WocliExecution>(APP_NAME, { options: globalOptions });
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
		description: 'Show version',
		run: (_input, context) => {
			context.stdout(VERSION);
		},
	});
	const diagnostics = createDiagnosticsCommands({
		supportsProvider: (provider) => resolveServiceProvider(provider) !== undefined,
	});
	add(diagnostics.info);
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
		description: 'Manage execution contexts',
		commands: [
			{
				name: 'list',
				description: 'List contexts',
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
				description: 'Show the merged context with credentials hidden',
				async run({ args, options }, context) {
					const selected = args[0] ?? text(options, 'context');
					output(describeCliContext(context.getConfigContext({ context: selected })), options, context);
				},
			},
			{
				name: 'create',
				arguments: '<name>',
				description: 'Create a context',
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
				description: 'Switch the default context',
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
				description: 'Remove a context other than the current one',
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
		description: 'Configure, discover and call services',
		commands: [
			{
				name: 'providers',
				description: 'List service provider plugins',
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
				description: 'List services in the current context',
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
				description: 'Add a service to the current context',
				options: [
					{ name: 'provider', description: 'Provider name: system, http, etc.' },
					{ name: 'url', description: 'Base URL of the HTTP runtime' },
					{ name: 'id', description: 'Remote service ID; defaults to the service name' },
					{ name: 'writable', type: 'boolean', description: 'Allow write operations for this service' },
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
				description: 'Remove a service defined in the current context',
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
				description: 'Show service tool definitions',
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
				description: 'Call a service tool',
				options: [{ name: 'input', aliases: ['i'], description: 'JSON, @file, or - to read stdin; defaults to {}' }, { name: 'yes', type: 'boolean', description: 'Confirm a write operation' }],
				async run({ args, options }, context) {
					const source = text(options, 'input') ?? '{}';
					const deferred = source.startsWith('@') || source === '-';
					const parse = async () => {
						try { return JSON.parse(await readText(source, context)); }
						catch (error) {
							if (error instanceof SyntaxError) throw new CliUsageError('--input must be valid JSON');
							throw error;
						}
					};
					let input: unknown = deferred ? undefined : await parse();
					await context.withServices(options, async (runtime, selected) => {
						const schema = await runtime.getSchema({ params: { service: args[0] } }, { signal: context.signal });
						const tool = Object.hasOwn(schema.tools, args[1]) ? schema.tools[args[1]] : undefined;
						if (!tool) throw new CliUsageError('Unknown service operation');
						if (tool.annotations?.readOnlyHint !== true) {
							if (selected.services[args[0]]?.readOnly !== false) throw new CliUsageError('Selected service is read-only');
							if (options.yes !== true) throw new CliUsageError('Service write operations require --yes');
						}
						if (deferred) input = await parse();
						const provider = selected.services[args[0]]?.provider;
						const openobserve = provider && (context.resolveServiceProvider?.(provider) ?? provider) === 'openobserve';
						const result = await runtime.call({ params: { service: args[0] }, body: { toolName: args[1], input } }, { signal: context.signal });
						output(openobserve ? sanitizeOpenObserveOutput(result) : result, options, context);
					});
				},
			},
		],
	});
	add(createWocliServiceCommand(SystemCliDefinition));
	add(createWocliServiceCommand(DuckDuckGoCliDefinition));
	add(
		createWocliServiceCommand(SQLCliDefinition, 'sql', (runtime, service, readOnly, signal) =>
			createSqlServiceToolClient(runtime, service, { readOnly, signal }),
		),
	);
	add(
		createWocliServiceCommand(OpenObserveCliDefinition, 'openobserve', (runtime, service, readOnly, signal) =>
			createOpenObserveServiceToolClient(runtime, service, { signal, readOnly }),
		),
	);
	add(
		createWocliServiceCommand(PrometheusCliDefinition, 'prometheus', (runtime, service, _readOnly, signal) =>
			createPrometheusServiceToolClient(runtime, service, { signal }),
		),
	);
	merge({ name: 'service', description: 'Service configuration and calls', commands: createServiceExtraCommands() });
	merge({ name: 'context', aliases: ['ctx'], description: 'Manage execution contexts and the AI catalog', commands: aiCatalog });
	merge({ name: 'context', description: 'Manage execution contexts', commands: [diagnostics.contextCheck] });
	merge({ name: 'service', description: 'Configure, discover and call services', commands: [diagnostics.serviceVerify] });
	add(createMcpCommand());
	add(createPromptCommand());
	for (const command of createRenderCommands()) add(command);
	for (const command of host.commands ?? []) add(command);
	cli.seal();

	async function prepare(input: WocliDescribeOptions, signal?: AbortSignal, stderr?: (text: string) => void) {
		signal?.throwIfAborted();
		const argv = normalizeArgv(input.argv ?? []);
		const parsed = cli.parse(argv);
		const explicitLogLevel = text(parsed.options, 'log-level');
		const configuredLogLevel = parseLogLevel(
			explicitLogLevel ??
				(parsed.options.verbose === true ? 'verbose' : (host.env?.[ENV.logLevel] ?? host.env?.[LEGACY_ENV.logLevel])),
		);
		const argumentContext = text(parsed.options, 'context');
		const targetContext =
			parsed.path[0] === 'context' && ['show', 'use', 'remove'].includes(parsed.path[1]) ? parsed.args[0] : undefined;
		if (
			input.context !== undefined &&
			[argumentContext, targetContext].some((value) => value !== undefined && value !== input.context)
		)
			throw new CliUsageError('Explicit context conflicts with argv context');
		const selected =
			targetContext ??
			input.context ??
			argumentContext ??
			(host.env?.[ENV.context] || host.env?.[LEGACY_ENV.context] || undefined);
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
		const available = new Set(
			Object.values(resolved?.services ?? {}).flatMap((service) => {
				const provider = resolveServiceProvider(service.provider);
				return provider === undefined ? [] : [provider];
			}),
		);
		if (host.mcp) available.add('mcp');
		const hasAi = Object.keys(resolved?.providers ?? {}).length > 0;
		const tree = new Cli<WocliExecution>(APP_NAME, {
			options: globalOptions.map((option) => (option.name === 'context' ? { ...option, default: selected } : option)),
		});
		for (const { method, command } of registrations) {
			const filtered = filterCommand(command, available, hasAi, true);
			if (filtered) tree[method](filtered);
		}
		tree.seal();
		const selectedContext = resolved?.name ?? '<unavailable>';
		const log = (level: LogLevel, message: string) => {
			if (stderr && shouldLog(configuredLogLevel, level)) stderr(`[${level}] ${sanitizeLogMessage(message)}`);
		};
		log('debug', `context=${selectedContext} services=${Object.keys(resolved?.configuredServices ?? {}).length}`);
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
		return {
			argv,
			parsed,
			tree,
			error,
			selectedContext,
			log,
			getConfigContext,
			host: { ...host, config: snapshotStore },
		};
	}

	return {
		async describe(options: WocliDescribeOptions = {}) {
			return (await prepare(options)).tree.describe();
		},
		async execute(argv: readonly string[], io: CliContext) {
			const snapshot = await prepare({ argv }, io.signal, io.stderr);
			const recoveryHelp = snapshot.error && (snapshot.parsed.options.help || !snapshot.parsed.path.length);
			if (
				snapshot.error &&
				!recoveryHelp &&
				!['info', 'version', 'render', 'markdown'].includes(snapshot.parsed.path[0])
			)
				throw snapshot.error;
			if (recoveryHelp) {
				const diagnostic = 'Configuration unavailable; showing core commands only. Check the selected configuration.';
				(io.stderr ?? io.stdout)(diagnostic);
			}
			const context: WocliExecution = {
				...io,
				host: snapshot.host,
				selectedContext: snapshot.selectedContext,
				configError: snapshot.error,
				log: snapshot.log,
				getConfigContext: snapshot.getConfigContext,
				resolveServiceProvider,
				async withServices(options, run) {
					io.signal.throwIfAborted();
					const resolved = snapshot.getConfigContext(options);
					const local = host.runtime
						? undefined
						: createServiceRuntime({
								context: resolved,
								providers,
								fetch: host.fetch,
								sqlDriver: host.sqlDriver,
								getEnv: host.getEnv ?? ((name) => host.env?.[name]),
							});
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
			context.log('info', `execute ${snapshot.parsed.path.join(' ') || 'help'}`);
			return (await snapshot.tree.execute(recoveryHelp ? ['--help'] : snapshot.argv, context)) ?? { exitCode: 0 };
		},
		async executeLine(line: string, io: CliContext) {
			return this.execute(splitCliCommandLine(line), io);
		},
	};
}

function sanitizeLogMessage(message: string): string {
	return message.replace(/[\u0000-\u001f\u007f]/gu, ' ').slice(0, 240);
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
			description: 'Manage and render local prompt presets',
			options: command.options?.filter((option) => ['output', 'json', 'var', 'input'].includes(option.name)),
		};
	return { ...command, commands };
}
