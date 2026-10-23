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
			description: '管理当前 context 的默认 service',
			commands: [
				{
					name: 'show',
					description: '显示合并后的 provider 默认服务',
					async run({ options }, context) {
						writeCommandOutput((await loadCommandContext(context, options)).defaults, options, context);
					},
				},
				{
					name: 'set',
					arguments: '<provider> <service>',
					description: '为 provider 选择默认服务',
					async run({ args, options }, context) {
						const selected = await loadCommandContext(context, options);
						if (!Object.hasOwn(selected.services, args[1])) throw new CliUsageError('Unknown service');
						if (selected.services[args[1]].provider !== args[0])
							throw new CliUsageError('Service provider does not match');
						await changeCommandConfig(context, options, (config, name) =>
							setConfigEntry(config.contexts[name].defaults, args[0], args[1]),
						);
					},
				},
				{
					name: 'unset',
					arguments: '<provider>',
					description: '移除当前 context 自有的默认服务设置',
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
			description: '发现工具、必填输入和可复制的调用示例',
			options: [{ name: 'writable', type: 'boolean', description: '同时展示非只读工具；执行仍受服务权限控制' }],
			async run({ args, options }, context) {
				const selection = resolveCliOutputSelection(options);
				await context.withServices(options, async (runtime, selected) => {
					const schema = await runtime.getSchema({ params: { service: args[0] } }, { signal: context.signal });
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
						if (tools.length) context.stdout(`\n调用示例：\n${tools.map((tool) => tool.example).join('\n')}\n`);
					} else writeCommandOutput(tools, options, context);
				});
			},
		},
	];
}
