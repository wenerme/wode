import type { CliCommand, CliOptions } from '../../cli/CliCommand';
import { CliUsageError } from '../../cli/CliCommand';
import { redact } from '../../redact';
import type { ServiceCliDefinition, ServiceCliOperation } from './ServiceCliDefinition';

export const ServiceCliRedactOption = Object.freeze({
	name: 'redact',
	type: 'boolean' as const,
	description: 'Redact sensitive values in displayed output; defaults to original data',
});

/** 共享命令宿主的显式能力；不读进程环境、不创建本地服务。 */
export interface ServiceCliExecutionHost<S, C> {
	options?: CliCommand<C>['options'];
	readText(value: string, context: C, options?: { label?: string; maxBytes?: number }): Promise<string>;
	/** Optional binary ports, forwarded to operation preparation only when provided. */
	readBytes?(value: string, context: C, options?: { label?: string; maxBytes?: number }): Promise<Uint8Array>;
	writeBytes?(path: string, content: Uint8Array, context: C, options?: { signal?: AbortSignal }): Promise<void>;
	run(
		operation: ServiceCliOperation<S>,
		options: CliOptions,
		context: C,
		prepare: () => Promise<(client: S, options: { signal?: AbortSignal }) => Promise<unknown>>,
	): Promise<void>;
	root?(options: CliOptions, context: C, help: string): Promise<void>;
}

/** 与 Node builder 共用 definition，只有解析器、服务选择、I/O 与 lifecycle 由宿主适配。 */
export function createServiceCliCommand<S, C>(
	definition: ServiceCliDefinition<S>,
	host: ServiceCliExecutionHost<S, C>,
): CliCommand<C> {
	const commands: CliCommand<C>[] = [];
	for (const operation of definition.commands) {
		const command: CliCommand<C> = {
			name: operation.name,
			aliases: operation.aliases,
			description: operation.description,
			examples: operation.examples,
			arguments:
				operation.arguments ??
				(operation.argument ? `<${operation.argument}${operation.variadic ? '...' : ''}>` : undefined),
			options: operation.options,
			run: async ({ args, options }, context) => {
				if (options['list-services'])
					throw new CliUsageError('--list-services cannot be combined with a resource command');
				await host.run(operation, options, context, async () => {
					const invoke = await operation.prepare({
						args: operation.variadic && !operation.arguments ? [args.join(' ')] : args,
						options,
						readText: (value, limits) => host.readText(value, context, limits),
						...(host.readBytes
							? {
									readBytes: (value: string, limits?: { label?: string; maxBytes?: number }) =>
										host.readBytes!(value, context, limits),
								}
							: {}),
						...(host.writeBytes
							? {
									writeBytes: (path: string, content: Uint8Array, writeOptions?: { signal?: AbortSignal }) =>
										host.writeBytes!(path, content, context, writeOptions),
								}
							: {}),
					});
					return async (client, callOptions) => {
						const result = await invoke(client, callOptions);
						return options.redact === true ? redact(result) : result;
					};
				});
			},
		};
		if (!operation.group) commands.push(command);
		else {
			let parent = commands.find((entry) => entry.name === operation.group);
			if (!parent) {
				parent = { name: operation.group, description: `${operation.group} operations`, commands: [] };
				commands.push(parent);
			}
			parent.commands = [...(parent.commands ?? []), command];
		}
	}
	const root = host.root?.bind(host);
	const rootOptions = [...(host.options ?? []), ...(definition.options ?? [])];
	if (!rootOptions.some((option) => option.name === ServiceCliRedactOption.name))
		rootOptions.push(ServiceCliRedactOption);
	return {
		name: definition.name,
		aliases: definition.aliases,
		description: definition.description,
		examples: definition.examples,
		options: rootOptions,
		commands,
		run: root ? ({ options, help }, context) => root(options, context, help) : undefined,
	};
}
