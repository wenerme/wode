import { CliUsageError } from '../../cli/CliCommand';
import { isCliServiceEnabled } from '../config';
import type { ResolvedServiceContext } from './types';

export interface SelectProviderServiceOptions {
	/** 已配置且启用服务可用的 canonical provider 名称。 */
	readonly provider: string;
	/** 用户显式传入的 `--service`；优先于任何默认推断。 */
	readonly explicit?: string;
	/** 将配置里的 type/alias 字符串解析为已注册 provider 的规范名；未知时返回 undefined。 */
	resolveProviderName(name: string): string | undefined;
	/** defaults 映射：key 可以是能力名或 provider 名/别名，value 是 service 名称。 */
	readonly defaults?: Readonly<Record<string, string>>;
}

/**
 * 为单一 provider 选择一个已配置的服务实例，不涉及任何 CLI 参数解析或 I/O。
 *
 * 选择顺序：
 * 1. 显式 `--service`（必须命中该 provider 的候选，否则报错）。
 * 2. context defaults 里为该 provider 配置的默认实例（存在歧义——多个不同候选都被设为默认——时报错）。
 * 3. 与 provider 同名的服务实例（`services.<provider>`），如果它恰好属于该 provider 并已启用。
 * 4. 唯一候选时直接选择。
 * 5. 多个候选且前面都没有消歧时，取第一个（稳定于 context.services 的声明顺序），不报歧义错误。
 *
 * 纯函数：只读取 context.configuredServices（缺省回退 context.services）与传入的 resolver，不发起任何 I/O。
 */
export function selectProviderService(context: ResolvedServiceContext, options: SelectProviderServiceOptions): string {
	const { provider, explicit, resolveProviderName, defaults = {} } = options;
	const services = context.configuredServices ?? context.services;
	const candidates = Object.entries(services).filter(
		([, config]) => isCliServiceEnabled(config) && resolveProviderName(config.provider) === provider,
	);
	if (explicit !== undefined) {
		if (!candidates.some(([name]) => name === explicit))
			throw new CliUsageError('Selected service does not match the provider or is disabled');
		return explicit;
	}
	const defaultCandidates = new Set(
		Object.entries(defaults)
			.filter(([key]) => (resolveProviderName(key) ?? key) === provider)
			.map(([, value]) => value)
			.filter((value) => candidates.some(([name]) => name === value)),
	);
	if (defaultCandidates.size === 1) return [...defaultCandidates][0];
	if (defaultCandidates.size > 1) throw new CliUsageError('Conflicting default services');
	if (candidates.length === 0) throw new CliUsageError('No matching service is configured and enabled');
	const sameName = candidates.find(([name]) => name === provider);
	if (sameName) return sameName[0];
	return candidates[0][0];
}
