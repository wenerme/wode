import type { CliOption, CliOptions } from '@wener/common/cli/CliCommand';
import type { CliTable } from '@wener/common/cli/render/CliTable';
import type { MaybePromise } from '@wener/utils';
import { ServiceCliInputError } from './ServiceCliInputError';

export type ServiceCliOptions = CliOptions;
export type ServiceCliOption = CliOption;

export interface ServiceCliInputContext {
	args: readonly string[];
	options: ServiceCliOptions;
	readText(value: string, options?: { label?: string; maxBytes?: number }): Promise<string>;
}

export interface ServiceCliOperation<S> {
	/** 供宿主在读取输入文件前完成选中服务的只读准入。 */
	mutating?: boolean;
	/** 仅用于对人展示；JSON 输出保留完整原始合同结果。 */
	table?(value: unknown): CliTable;
	name: string;
	group?: string;
	variadic?: boolean;
	aliases?: readonly string[];
	description: string;
	argument?: string;
	/** 多个或可选位置参数；不包含宿主提供的 Service 选择参数。 */
	arguments?: string;
	options?: readonly ServiceCliOption[];
	/** 参数与文件先准备，成功后宿主才解析认证 client。 */
	prepare(
		context: ServiceCliInputContext,
	): MaybePromise<(client: S, options: { signal?: AbortSignal }) => Promise<unknown>>;
}

/** 业务命令由 Provider 所属 cli 维护，宿主只适配解析器、认证、FS 与输出。 */
export interface ServiceCliDefinition<S> {
	name: string;
	aliases?: readonly string[];
	description: string;
	/** 领域级选项由两种宿主共同挂载，配置/认证/transport 选项仍属于宿主。 */
	options?: readonly ServiceCliOption[];
	helpText?: string;
	commands: readonly ServiceCliOperation<S>[];
}

export function serviceCliString(options: ServiceCliOptions, name: string): string | undefined {
	const value = options[name];
	if (value === undefined) return undefined;
	if (typeof value !== 'string') throw new ServiceCliInputError(`--${name} requires one value`);
	return value;
}

export function serviceCliStrings(options: ServiceCliOptions, name: string): string[] | undefined {
	const value = options[name];
	if (value === undefined) return undefined;
	if (typeof value === 'string') return [value];
	if (Array.isArray(value)) return value;
	throw new ServiceCliInputError(`--${name} requires a value`);
}
