import type { CliOutputMode } from './format/types';

export type CliOptions = Readonly<Record<string, string | string[] | boolean | undefined>>;

export interface CliOption {
	name: string;
	aliases?: readonly string[];
	description: string;
	/** 仅控制帮助可见范围，不改变参数解析及配置生效范围。 */
	helpScope?: 'root' | 'all';
	type?: 'string' | 'boolean';
	repeatable?: boolean;
	/** 单次选项可以连续接收多个值，解析结果为数组；仅在已匹配命令路径中生效。 */
	variadic?: boolean;
	default?: string | boolean;
	/** 布尔选项允许通过 --no-NAME 关闭。 */
	negatable?: boolean;
}

export interface CliInput {
	args: string[];
	options: CliOptions;
	help: string;
}

export interface CliCommandDefinition {
	name: string;
	/** custom 允许 render/prompt 自行解释并校验 --output/--format。 */
	output?: 'standard' | 'custom';
	hidden?: boolean;
	/** 命令使用独立选项语义，宿主只消费命令名之前的选项；false表示兼容宿主全局选项。 */
	raw?: boolean;
	aliases?: readonly string[];
	description: string;
	summary?: readonly string[];
	arguments?: string;
	usage?: string;
	options?: readonly CliOption[];
	commands?: readonly CliCommandDefinition[];
}

export interface CliCommandResult {
	exitCode: number;
}

export type CliCommandHandler<C> = (
	input: CliInput,
	context: C,
) => void | CliCommandResult | Promise<void | CliCommandResult>;

export interface CliCommand<C> extends Omit<CliCommandDefinition, 'commands'> {
	commands?: readonly CliCommand<C>[];
	run?: CliCommandHandler<C>;
	/** 顶层argv适配器；raw:false时同时接收命令名前的全局选项，并允许宿主提取自身参数。 */
	runRaw?(argv: readonly string[], context: C): void | CliCommandResult | Promise<void | CliCommandResult>;
}

export function defineCommand<C>(command: CliCommand<C>): CliCommand<C> {
	return command;
}

export class CliUsageError extends Error {}

export const CliOutputOptions: readonly CliOption[] = [
	{
		name: 'output',
		aliases: ['o'],
		description: 'Output: table, wide, describe, json, jsonl, yaml, csv, md, name, value',
	},
	{ name: 'format', aliases: ['f'], description: 'Select columns in order (e.g. id,title) or csv(id,title)' },
	{ name: 'json', type: 'boolean', description: 'Output the complete JSON response' },
	{
		name: 'truncate',
		type: 'boolean',
		negatable: true,
		description: 'Truncate long cells; --no-truncate keeps complete values',
	},
	{ name: 'headers', type: 'boolean', negatable: true, description: 'Show column headers; disable with --no-headers' },
	{
		name: 'footer',
		type: 'boolean',
		negatable: true,
		description: 'Show row counts and pagination; disable with --no-footer',
	},
];

const outputModes = new Set<string>([
	'table',
	'wide',
	'describe',
	'desc',
	'json',
	'jsonl',
	'yaml',
	'yml',
	'csv',
	'md',
	'markdown',
	'name',
	'value',
]);

export function resolveCliOutputSelection(options: CliOptions): { format: CliOutputMode; fields?: string[] } {
	let output = options.output ?? 'table';
	let projection = options.format;
	if (projection !== undefined && typeof projection !== 'string')
		throw new CliUsageError('--format requires one field projection');
	const dsl = projection?.match(/^([a-z]+)\((.*)\)$/i);
	if (dsl) {
		if (options.output && options.output !== dsl[1])
			throw new CliUsageError('--output conflicts with --format renderer');
		output = dsl[1];
		projection = dsl[2];
	}
	if (typeof output !== 'string' || !outputModes.has(output))
		throw new CliUsageError(`Supported output formats: ${[...outputModes].join(', ')}`);
	if (options.json && output !== 'table' && output !== 'json')
		throw new CliUsageError('--json conflicts with --output');
	if (options.json && (options.output || dsl) && output !== 'json')
		throw new CliUsageError('--json conflicts with --output');
	const fields = projection?.split(',').map((field) => field.trim());
	if (
		fields?.some((field) => !/^[\p{L}\p{N}_][\p{L}\p{N}_.:-]*$/u.test(field)) ||
		(fields && new Set(fields).size !== fields.length)
	)
		throw new CliUsageError('--format expects unique comma-separated field names');
	return { format: (options.json ? 'json' : output) as CliOutputMode, fields };
}

export function resolveCliOutput(options: CliOptions): CliOutputMode {
	return resolveCliOutputSelection(options).format;
}
