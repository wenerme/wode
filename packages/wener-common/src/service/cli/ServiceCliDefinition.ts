import type { MaybePromise } from '@wener/utils';
import type { CliExample, CliOption, CliOptions } from '../../cli/CliCommand';
import type { CliTable } from '../../cli/render/CliTable';
import type { CliServiceConfig } from '../config';
import { ServiceCliInputError } from './ServiceCliInputError';

export type ServiceCliOptions = CliOptions;
export type ServiceCliOption = CliOption;

/** Invocation-local connection settings; credentials stay behind a scoped resolver. */
export interface ServiceCliAdHocConnection {
	name?: string;
	readOnly?: boolean;
	options?: CliServiceConfig['options'];
	getEnv?(name: string): string | undefined;
}

export interface ServiceCliAdHocDefinition {
	/** Presence of any trigger requests a temporary connection; help never calls create(). */
	options: readonly string[];
	/** Pure validation and construction: no files, environment lookup or network access. */
	create(options: ServiceCliOptions): ServiceCliAdHocConnection;
}

export interface ServiceCliInputContext {
	args: readonly string[];
	options: ServiceCliOptions;
	readText(value: string, options?: { label?: string; maxBytes?: number }): Promise<string>;
	/** Optional binary input (`@file` or `-`); hosts without file access leave it undefined. */
	readBytes?(value: string, options?: { label?: string; maxBytes?: number }): Promise<Uint8Array>;
	/** Optional binary file output; hosts without file access leave it undefined. */
	writeBytes?(path: string, content: Uint8Array, options?: { signal?: AbortSignal }): Promise<void>;
}

export interface ServiceCliOperation<S> {
	/** 供宿主在读取输入文件前完成选中服务的只读准入。 */
	mutating?: boolean;
	/** 标记该操作支持 dry-run；宿主可在 `--dry-run` 时放行只读配置的服务继续执行。 */
	supportsDryRun?: boolean;
	/** 仅用于对人展示；JSON 输出保留完整原始合同结果。 */
	table?(value: unknown): CliTable;
	name: string;
	group?: string;
	variadic?: boolean;
	aliases?: readonly string[];
	description: string;
	examples?: readonly CliExample[];
	argument?: string;
	/** 多个或可选位置参数；不包含宿主提供的 Service 选择参数。 */
	arguments?: string;
	options?: readonly ServiceCliOption[];
	/**
	 * Prepare arguments/files before the host resolves the authenticated client.
	 * Preserve service results by default; explicit presentation policy belongs to the CLI layer.
	 */
	prepare(
		context: ServiceCliInputContext,
	): MaybePromise<(client: S, options: { signal?: AbortSignal }) => Promise<unknown>>;
}

/** 业务命令由 Provider 所属 cli 维护，宿主只适配解析器、认证、FS 与输出。 */
export interface ServiceCliDefinition<S> {
	name: string;
	aliases?: readonly string[];
	description: string;
	examples?: readonly CliExample[];
	/** 领域级选项由两种宿主共同挂载，配置/认证/transport 选项仍属于宿主。 */
	options?: readonly ServiceCliOption[];
	helpText?: string;
	adHoc?: ServiceCliAdHocDefinition;
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
