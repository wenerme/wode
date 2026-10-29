import { type CliCommand, CliUsageError, resolveCliOutputSelection } from '@wener/common/cli';
import { changeCommandConfig, loadCommandContext, setConfigEntry, writeCommandOutput } from '../command-utils';
import { APP_NAME } from '../const';
import type { WocliExecution } from '../createWocliCli';

function quoteArgument(value: string): string {
	return `'${value.replace(/'/g, "'\\''")}'`;
}

function requiredInput(schema: Record<string, unknown>): Record<string, unknown> {
	const properties =
		schema.properties && typeof schema.properties === 'object'
			? (schema.properties as Record<string, { type?: string }>)
			: {};
	return Object.fromEntries(
		(Array.isArray(schema.required) ? schema.required : [])
			.filter((name): name is string => typeof name === 'string')
			.map((name) => {
				const type = properties[name]?.type;
				return [
					name,
					type === 'number' || type === 'integer'
						? 0
						: type === 'boolean'
							? false
							: type === 'array'
								? []
								: type === 'object'
									? {}
									: `<${name}>`,
				];
			}),
	);
}

export function createServiceExtraCommands(): CliCommand<WocliExecution>[] {
	return [
		{
			name: 'default',
			description: 'Manage default services for the current context',
			commands: [
				{
					name: 'show',
					description: 'Show merged default services by provider',
					async run({ options }, context) {
						writeCommandOutput((await loadCommandContext(context, options)).defaults, options, context);
					},
				},
				{
					name: 'set',
					arguments: '<provider> <service>',
					description: 'Select the default service for a provider',
					async run({ args, options }, context) {
						const selected = await loadCommandContext(context, options);
						if (!Object.hasOwn(selected.services, args[1])) throw new CliUsageError('Unknown service');
						const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
						if (canonical(selected.services[args[1]].provider) !== canonical(args[0]))
							throw new CliUsageError('Service provider does not match');
						await changeCommandConfig(context, options, (config, name) =>
							setConfigEntry(config.contexts[name].defaults, args[0], args[1]),
						);
					},
				},
				{
					name: 'unset',
					arguments: '<provider>',
					description: 'Remove a default service setting defined in the current context',
					run: ({ args, options }, context) =>
						changeCommandConfig(context, options, (config, name) => {
							if (!Object.hasOwn(config.contexts[name].defaults, args[0]))
								throw new CliUsageError(
									'Default service is not configured in this context; inherited defaults cannot be deleted',
								);
							delete config.contexts[name].defaults[args[0]];
						}),
				},
			],
		},
		{
			name: 'inspect',
			arguments: '<service>',
			description: 'Discover tools, required inputs and copyable call examples',
			options: [
				{ name: 'writable', type: 'boolean', description: 'Also show tools that can write; execution requires service permissions' },
				{ name: 'options', type: 'boolean', description: 'Show the configured service options schema' },
			],
			async run({ args, options }, context) {
				const selection = resolveCliOutputSelection(options);
				await context.withServices(options, async (runtime, selected) => {
					const schema = await runtime.getSchema({ params: { service: args[0] } }, { signal: context.signal });
					const service = selected.configuredServices?.[args[0]] ?? selected.services[args[0]];
					const optionsSchema = context.getServiceOptionsSchema?.(service?.provider ?? args[0]);
					if (options.options === true) {
						writeCommandOutput({
							service: {
								name: args[0],
								type: service?.type ?? service?.provider,
								readOnly: service?.readOnly,
								configuredOptionKeys: Object.keys(service?.options ?? {}),
								...(optionsSchema ? { optionsSchema } : {}),
							},
							tools: schema.tools,
						}, options, context);
						return;
					}
					if (!selection.fields && ['json', 'jsonl', 'yaml', 'yml'].includes(selection.format)) {
						writeCommandOutput(schema, options, context);
						return;
					}
					const tools = Object.entries(schema.tools)
						.filter(([, tool]) => options.writable || tool.annotations?.readOnlyHint === true)
						.map(([name, tool]) => ({
							name,
							description: tool.description,
							readOnly: tool.annotations?.readOnlyHint === true,
							required: Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required.join(', ') : '',
							example: `${APP_NAME} service call ${quoteArgument(args[0])} ${quoteArgument(name)} --context ${quoteArgument(selected.name)} --input ${quoteArgument(JSON.stringify(requiredInput(tool.inputSchema)))} --json`,
						}));
					if (!selection.fields && ['table', 'wide'].includes(selection.format)) {
						writeCommandOutput(
							tools.map(({ example: _example, ...tool }) => tool),
							options,
							context,
						);
						if (tools.length) context.stdout(`\nCall examples:\n${tools.map((tool) => tool.example).join('\n')}\n`);
					} else writeCommandOutput(tools, options, context);
				});
			},
		},
	];
}
