import type { CliCommand, CliOptions } from '@wener/common/cli/CliCommand';
import { CliUsageError } from '@wener/common/cli/CliCommand';
import type { ServiceCliDefinition, ServiceCliOperation } from './ServiceCliDefinition';

/** 共享命令宿主的显式能力；不读进程环境、不创建本地服务。 */
export interface ServiceCliExecutionHost<S, C> {
	options?: CliCommand<C>['options'];
	readText(value: string, context: C, options?: { label?: string; maxBytes?: number }): Promise<string>;
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
			arguments:
				operation.arguments ??
				(operation.argument ? `<${operation.argument}${operation.variadic ? '...' : ''}>` : undefined),
			options: operation.options,
			run: async ({ args, options }, context) => {
				if (options['list-services'])
					throw new CliUsageError('--list-services cannot be combined with a resource command');
				await host.run(operation, options, context, async () =>
					operation.prepare({
						args: operation.variadic && !operation.arguments ? [args.join(' ')] : args,
						options,
						readText: (value, limits) => host.readText(value, context, limits),
					}),
				);
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
	return {
		name: definition.name,
		aliases: definition.aliases,
		description: definition.description,
		options: [...(host.options ?? []), ...(definition.options ?? [])],
		commands,
		run: root ? ({ options, help }, context) => root(options, context, help) : undefined,
	};
}
