import type {
	MessageGenerationOptions,
	MessageGenerationRequest,
	MessageGenerationResult,
} from '@wener/client/ai/message-generation';
import type { EdgeTtsSocketFactory } from '@wener/client/tts';
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
	ApolloCliDefinition,
	buildServiceCatalogView,
	type ServiceProvider,
	ServiceProviderRegistry,
	type ServiceRuntimeClient,
	type SqlAdapterFactory,
} from '@wener/common/service';
import { createServiceCliCommand, type ServiceCliBinding, type ServiceCliClientFactory, type ServiceCliDefinition } from '@wener/common/service/cli';
import { BuiltinServiceCliBindings } from './builtin/cli';
import { getServiceOptionsJsonSchema, selectProviderService } from '@wener/common/service/runtime';
import { sanitizeOpenObserveOutput } from '@wener/common/service/openobserve';
import { createRemoteServiceToolClient } from '@wener/common/service/runtime/client';
import type { RedisAdapterFactory } from '@wener/common/service/redis';
import {
	type CliConfig,
	type CliServiceConfig,
	CliConfigError,
	type CliConfigStore,
	type CliMcpServerConfig,
	describeCliContext,
	type ResolvedCliContext,
	resolveCliContext,
} from 'common/context';
import { createCliCatalog, describeServiceProvider, formatServiceProviderTypeScript } from './catalog';
import {
	writeCommandOutput as output,
	readCommandText as readText,
	setConfigEntry,
	optionString as text,
	optionStrings,
	validateCommandOutputTarget,
	writeCommandOutputToFile,
} from './command-utils';
import { createAiCatalogCommands } from './commands/ai-catalog';
import { createDiagnosticsCommands, type LogLevel, parseLogLevel, shouldLog } from './commands/diagnostics';
import { createMcpCommand } from './commands/mcp';
import { createPromptCommand } from './commands/prompt';
import { createRenderCommands } from './commands/render';
import { createServiceExtraCommands } from './commands/service-extra';
import { createCatalogCommand } from './commands/catalog';
import { APP_NAME, ENV, LEGACY_ENV } from './const';
import { createBuiltinProviders, SystemCliDefinition, VERSION } from './core';
import { createFetchCommand } from './services/fetch';
import { createSearchCommand } from './services/search';
import { createTtsCommand } from './services/tts';

/** Application metadata; provider names need not match command names or aliases. */
export interface WoctlCommand extends Omit<CliCommand<CliExecution>, 'commands'> {
	serviceProvider?: string;
	serviceCapability?: string;
	hostCapability?: string;
	commands?: readonly WoctlCommand[];
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

export interface CliMcpHost {
	connect(config: CliMcpServerConfig, signal: AbortSignal): Promise<WocliMcpConnection>;
}

export interface CliHost {
	config: CliConfigStore;
	runtime?: ServiceRuntimeClient;
	providers?: readonly ServiceProvider[];
	serviceCliBindings?: readonly ServiceCliBinding[];
	capabilities?: readonly string[];
	commands?: readonly WoctlCommand[];
	info?: Record<string, unknown>;
	fetch?: typeof globalThis.fetch;
	sqlDriver?: SqlAdapterFactory;
	redisDriver?: RedisAdapterFactory;
	edgeTtsSocketFactory?: EdgeTtsSocketFactory;
	env?: Readonly<Record<string, string | undefined>>;
	getEnv?(name: string): string | undefined;
	term?: CliTerminalInfo;
	generate?(request: MessageGenerationRequest, options: MessageGenerationOptions): Promise<MessageGenerationResult>;
	readText?(value: string, options: { signal: AbortSignal; maxBytes: number }): Promise<string>;
	renderDocument?(source: string, options: import('./commands/render').DocumentRenderOptions): Promise<string>;
	mcp?: CliMcpHost;
	writeText?(path: string, content: string, options: { signal: AbortSignal }): Promise<void>;
	writeBytes?(path: string, content: Uint8Array, options: { signal: AbortSignal }): Promise<void>;
}
export interface CliExecution extends CliContext {
	host: CliHost;
	selectedContext: string;
	configError?: CliConfigError;
	log(level: LogLevel, message: string): void;
	getConfigContext(options?: CliOptions): ResolvedCliContext;
	resolveServiceProvider?(name: string): string | undefined;
	getServiceOptionsSchema?(name: string): Record<string, unknown> | undefined;
	getServiceCapabilities?(provider: string): readonly string[];
	withServices<T>(
		options: CliOptions,
		run: (runtime: ServiceRuntimeClient, context: ResolvedCliContext) => Promise<T>,
	): Promise<T>;
}

export function createWoctlServiceCommand<S>(
	definition: ServiceCliDefinition<S>,
	provider = definition.name,
	createClient?: ServiceCliClientFactory<S>,
): WoctlCommand {
	return {
		serviceProvider: provider,
		...createServiceCliCommand(definition, {
			options: [
				{ name: 'service', description: 'Select a service by name' },
				{ name: 'list-services', type: 'boolean', description: 'List available services of the same type in the current context' },
				{ name: 'output-file', description: 'Write the formatted result to a file; - writes to stdout' },
			],
			readText,
			async root(options, context: CliExecution, help) {
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
				await writeCommandOutputToFile(
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
				validateCommandOutputTarget(options, context);
				// 参数准备先于获取 client；帮助和无效输入不会创建服务连接。
				await context.withServices(options, async (runtime, resolved) => {
					const resolveProviderName = (name: string) => context.resolveServiceProvider?.(name) ?? name;
					const canonicalProvider = resolveProviderName(provider);
					const service = selectProviderService(resolved, {
						provider: canonicalProvider,
						explicit: text(options, 'service'),
						resolveProviderName,
						defaults: resolved.defaults,
					});
					const config = resolved.services[service];
					if (operation.mutating && config.readOnly !== false) throw new CliUsageError('Selected service is read-only');
					const invoke = await prepare();
					const client = createClient
						? await createClient(runtime, service, { readOnly: config.readOnly !== false, signal: context.signal })
						: await createRemoteServiceToolClient<S>(runtime, service, { signal: context.signal });
					const result = await invoke(client, { signal: context.signal });
					const tabular = ['table', 'wide'].includes(resolveCliOutputSelection(options).format);
					await writeCommandOutputToFile(result, options, context, tabular && operation.table ? operation.table(result) : undefined);
				});
			},
		}),
	};
}

function parseKeyValueOptions(values: readonly string[], label: string, parseJson: boolean, dotNotation = false): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const value of values) {
		const separator = value.indexOf('=');
		if (separator <= 0) throw new CliUsageError(`--${label} requires key=value`);
		const key = value.slice(0, separator).trim();
		const raw = value.slice(separator + 1);
		const parts = dotNotation ? key.split('.') : [key];
		if (!key || parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_-]*$/u.test(part) || ['__proto__', 'constructor', 'prototype'].includes(part)))
			throw new CliUsageError(`--${label} requires a valid key`);
		if (!parseJson) {
			setNestedOption(result, parts, raw);
			continue;
		}
		let parsed: unknown;
		try {
			parsed = raw.startsWith('json:') ? JSON.parse(raw.slice('json:'.length)) : JSON.parse(raw);
		} catch {
			parsed = raw;
		}
		setNestedOption(result, parts, parsed);
	}
	return result;
}

function setNestedOption(target: Record<string, unknown>, parts: readonly string[], value: unknown): void {
	let current = target;
	for (const part of parts.slice(0, -1)) {
			const existing = current[part];
			if (existing === undefined) current[part] = {};
			else if (!existing || typeof existing !== 'object' || Array.isArray(existing)) throw new CliUsageError('Conflicting service option paths');
			current = current[part] as Record<string, unknown>;
	}
	const leaf = parts.at(-1)!;
	if (Object.hasOwn(current, leaf)) throw new CliUsageError(`Duplicate service option key: ${parts.join('.')}`);
	current[leaf] = value;
}

export function createCli(host: CliHost) {
	const providers = new ServiceProviderRegistry([...createBuiltinProviders(host.info), ...(host.providers ?? [])]);
	const resolveServiceProvider = (name: string) => providers.resolveName(name) ?? (host.runtime ? name : undefined);
	const getServiceCapabilities = (name: string): readonly string[] => {
		const canonical = providers.resolveName(name);
		return canonical ? providers.get(canonical).capabilities ?? [] : [];
	};
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
	const cli = new Cli<CliExecution>(APP_NAME, { options: globalOptions });
	function serviceTypeInfo(type: string, options: CliOptions, context: CliExecution): void {
		const provider = providers.get(type);
		const metadata = describeServiceProvider(provider);
		if (options.typescript === true) {
			context.stdout(formatServiceProviderTypeScript(metadata));
			return;
		}
		output({ aliases: [], capabilities: [], ...metadata }, options, context);
	}
	const registrations: Array<{ method: 'add' | 'merge'; command: WoctlCommand }> = [];
	function add(command: WoctlCommand) {
		const snapshot = snapshotCommand(command);
		cli.add(snapshot);
		registrations.push({ method: 'add', command: snapshot });
	}
	function merge(command: WoctlCommand) {
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
		context: CliExecution,
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
		aliases: ['svc'],
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
				name: 'type',
				arguments: '[type]',
				description: 'Show service type metadata and options schema',
				options: [{ name: 'typescript', type: 'boolean', description: 'Render the options schema as a TypeScript interface' }],
				commands: [
					{
						name: 'list',
						description: 'List registered service types',
						run({ options }, context) {
							const providersList = providers.listProviders();
							const value = providersList.map((provider) => ({
								name: provider.name,
								aliases: provider.aliases ?? [],
								capabilities: provider.capabilities ?? [],
								options: provider.optionsSchema?.jsonSchema ? 'yes' : 'no',
								methods: provider.contract ? Object.keys(provider.contract.methods).length : 0,
							}));
							const format = options.json === true ? 'json' : typeof options.output === 'string' ? options.output : 'table';
							const table = ['table', 'wide', 'describe'].includes(format)
								? {
										kind: 'list' as const,
										headers: ['TYPE', 'ALIASES', 'CAPABILITIES', 'OPTIONS', 'METHODS'],
										columnOptions: [{ key: 'name' }, { key: 'aliases' }, { key: 'capabilities' }, { key: 'options' }, { key: 'methods' }],
										rows: value.map((item) => [item.name, item.aliases.join(', '), item.capabilities.join(', '), item.options, item.methods]),
								  }
								: undefined;
							output(value, options, context, table);
						},
					},
					{
						name: 'info',
						arguments: '<type>',
						description: 'Show registered service type information',
						run({ args, options }, context) { serviceTypeInfo(args[0], options, context); },
					},
				],
				async run({ args, options }, context) {
					if (!args[0]) throw new CliUsageError('Service type name is required');
					serviceTypeInfo(args[0], options, context);
				},
			},
			{
				name: 'list',
				description: 'List configured services with their resolved provider, capabilities, default and ambiguity status',
				async run({ options }, context) {
					await context.withServices(options, async (_runtime, resolved) => {
						const view = buildServiceCatalogView(resolved, {
							defaults: resolved.defaults,
							resolveProviderName: (name) => resolveServiceProvider(name),
							getProviderCapabilities: (name) => getServiceCapabilities(name),
						});
						output(
							view.map((entry) => ({
								name: entry.name,
								provider: entry.configuredProvider,
								...(entry.canonicalProvider && entry.canonicalProvider !== entry.configuredProvider
									? { type: entry.canonicalProvider }
									: {}),
								status: entry.status,
								capabilities: entry.capabilities,
								disabled: !entry.enabled,
								readOnly: entry.readOnly,
								default: entry.isDefault,
								ambiguous: entry.ambiguous,
								title: resolved.configuredServices?.[entry.name]?.title ?? resolved.services[entry.name]?.title,
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
					{ name: 'type', description: 'Service type, such as system, http or openobserve' },
					{ name: 'base-url', description: 'Service base URL' },
					{ name: 'id', description: 'Remote service ID; defaults to the service name' },
					{ name: 'title', description: 'Human-readable service title' },
					{ name: 'description', description: 'Human-readable service description' },
					{ name: 'header', repeatable: true, description: 'HTTP header as key=value; repeatable' },
					{ name: 'option', repeatable: true, description: 'Provider option as key=value; dot paths create nested objects; JSON values may use json:' },
					{ name: 'writable', type: 'boolean', description: 'Allow write operations for this service' },
					{ name: 'disabled', type: 'boolean', description: 'Disable the service after adding it' },
				],
				run: ({ args, options }, context) =>
					change(context, options, (config) => {
						const type = text(options, 'type');
						if (!type) throw new CliUsageError('--type is required');
						const provider = providers.get(type);
						const selected = resolveCliContext(config, text(options, 'context'));
						if (Object.hasOwn(selected.configuredServices ?? selected.services, args[0]))
							throw new CliUsageError('Service already exists');
						const baseUrl = text(options, 'base-url');
						if (type === 'http' && !baseUrl) throw new CliUsageError('HTTP service requires --base-url');
						const serviceOptions = parseKeyValueOptions(optionStrings(options, 'option'), 'option', true, true) as NonNullable<CliServiceConfig['options']>;
						const optionResult = provider.optionsSchema?.safeParse(serviceOptions);
						if (optionResult && !optionResult.success) throw new CliUsageError(`Invalid options for service type: ${type}`);
						setConfigEntry(config.contexts[selected.name].services, args[0], {
							type,
							provider: type,
							...(baseUrl === undefined ? {} : { baseUrl }),
							...(text(options, 'id') === undefined ? {} : { id: text(options, 'id') }),
							...(text(options, 'title') === undefined ? {} : { title: text(options, 'title') }),
							...(text(options, 'description') === undefined ? {} : { description: text(options, 'description') }),
							...(Object.keys(parseKeyValueOptions(optionStrings(options, 'header'), 'header', false)).length
								? { headers: parseKeyValueOptions(optionStrings(options, 'header'), 'header', false) as Record<string, string> }
								: {}),
							...(Object.keys(serviceOptions).length ? { options: serviceOptions } : {}),
							readOnly: options.writable !== true,
							...(options.disabled === true ? { disabled: true } : {}),
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
	add(createWoctlServiceCommand(SystemCliDefinition));
	for (const binding of [...BuiltinServiceCliBindings, ...(host.serviceCliBindings ?? [])])
		add(binding.register(createWoctlServiceCommand));
	add(createSearchCommand());
	add(createFetchCommand());
	add(createTtsCommand());
	add(
		createWoctlServiceCommand(OpenObserveCliDefinition, 'openobserve', (runtime, service, { readOnly, signal }) =>
			createOpenObserveServiceToolClient(runtime, service, { signal, readOnly }),
		),
	);
	add(createWoctlServiceCommand(ApolloCliDefinition, 'apollo'));
	merge({ name: 'service', description: 'Service configuration and calls', commands: createServiceExtraCommands() });
	merge({ name: 'context', aliases: ['ctx'], description: 'Manage execution contexts and the AI catalog', commands: aiCatalog });
	merge({ name: 'context', description: 'Manage execution contexts', commands: [diagnostics.contextCheck] });
	merge({ name: 'service', description: 'Configure, discover and call services', commands: [diagnostics.serviceVerify] });
	add(createMcpCommand());
	add(createPromptCommand());
	for (const command of createRenderCommands()) add(command);
	for (const command of host.commands ?? []) add(command);
	add(createCatalogCommand({ catalog }));
	cli.seal();

	function catalog() {
		return createCliCatalog({
			name: APP_NAME, version: VERSION, globalOptions: cli.describeOptions(),
			commands: cli.describe(), providers: providers.listProviders(), registrations,
		});
	}

	async function prepare(input: WocliDescribeOptions, signal?: AbortSignal, stderr?: (text: string) => void) {
		signal?.throwIfAborted();
		const argv = normalizeArgv(input.argv ?? []);
		const parsed = cli.parse(argv);
		const staticCatalog = parsed.path[0] === 'catalog';
		const explicitLogLevel = text(parsed.options, 'log-level');
		const configuredLogLevel = parseLogLevel(
			explicitLogLevel ??
				(parsed.options.verbose === true ? 'verbose' : (staticCatalog ? undefined : (host.env?.[ENV.logLevel] ?? host.env?.[LEGACY_ENV.logLevel]))),
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
			(staticCatalog ? undefined : (host.env?.[ENV.context] || host.env?.[LEGACY_ENV.context] || undefined));
		let config: CliConfig | undefined;
		let resolved: ResolvedCliContext | undefined;
		let error: CliConfigError | undefined;
		if (!staticCatalog) {
			try {
				config = await host.config.load({ context: selected });
				signal?.throwIfAborted();
				resolved = resolveCliContext(config, selected);
			} catch (cause) {
				signal?.throwIfAborted();
				if (!(cause instanceof CliConfigError)) throw cause;
				error = cause;
			}
		}
		signal?.throwIfAborted();
		const available = new Set(
			Object.values(resolved?.services ?? {}).flatMap((service) => {
				const provider = resolveServiceProvider(service.provider);
				return provider === undefined ? [] : [provider];
			}),
		);
		const hostCapabilities = new Set(host.capabilities ?? []);
		if (host.mcp) hostCapabilities.add('mcp');
		const capabilities = new Set(
			Object.values(resolved?.services ?? {}).flatMap((service) => getServiceCapabilities(service.provider)),
		);
		const hasAi = Object.keys(resolved?.providers ?? {}).length > 0;
		const tree = new Cli<CliExecution>(APP_NAME, {
			options: globalOptions.map((option) => (option.name === 'context' ? { ...option, default: selected } : option)),
		});
		for (const { method, command } of registrations) {
			const filtered = filterCommand(command, available, hasAi, true, capabilities, hostCapabilities);
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
			getServiceOptionsSchema(name: string) {
				const provider = providers.get(resolveServiceProvider(name) ?? name);
				return getServiceOptionsJsonSchema(provider.optionsSchema);
			},
			host: { ...host, config: snapshotStore },
		};
	}

	return {
		catalog,
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
			const context: CliExecution = {
				...io,
				host: snapshot.host,
				selectedContext: snapshot.selectedContext,
				configError: snapshot.error,
				log: snapshot.log,
				getConfigContext: snapshot.getConfigContext,
				getServiceOptionsSchema: snapshot.getServiceOptionsSchema,
				resolveServiceProvider,
				getServiceCapabilities,
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
								redisDriver: host.redisDriver,
								edgeTtsSocketFactory: host.edgeTtsSocketFactory,
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
export type WocliCli = ReturnType<typeof createCli>;

function normalizeArgv(argv: readonly string[]): readonly string[] {
	return argv.length === 1 && ['--version', '-v'].includes(argv[0]) ? ['version'] : argv;
}

function snapshotCommand(command: WoctlCommand): WoctlCommand {
	return Object.freeze({
		...command,
		aliases: Object.freeze([...(command.aliases ?? [])]),
		summary: command.summary ? Object.freeze([...command.summary]) : undefined,
		examples: command.examples ? Object.freeze(command.examples.map((example) => Object.freeze({ ...example }))) : undefined,
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
	command: WoctlCommand,
	available: ReadonlySet<string>,
	hasAi: boolean,
	root = false,
	capabilities: ReadonlySet<string> = new Set(),
	hostCapabilities: ReadonlySet<string> = new Set(),
): WoctlCommand | undefined {
	if (command.serviceProvider && !available.has(command.serviceProvider)) return undefined;
	if (command.serviceCapability && !capabilities.has(command.serviceCapability)) return undefined;
	if (command.hostCapability && !hostCapabilities.has(command.hostCapability)) return undefined;
	const commands = (command.commands ?? []).flatMap((child) => {
		const filtered = filterCommand(child, available, hasAi, false, capabilities, hostCapabilities);
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
