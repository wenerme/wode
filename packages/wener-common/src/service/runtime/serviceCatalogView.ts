import type { CliServiceConfig } from '../config';
import { isCliServiceEnabled } from '../config';
import type { ResolvedServiceContext } from './types';

/**
 * 单个已配置 service 实例在当前 context 下的有效状态。
 * 不发网络、不读密钥、不实例化 provider factory；只基于配置和已注册 provider 名单做静态判断。
 */
export interface ServiceCatalogEntry {
	/** 配置中的 service 名称（context key）。 */
	readonly name: string;
	/** 配置写入的原始 type/provider 字符串，未经过 canonical 解析。 */
	readonly configuredProvider: string;
	/** 解析到的已注册 provider 规范名；未知类型时为 undefined。 */
	readonly canonicalProvider?: string;
	/** 该 provider 声明支持的能力；未知 provider 时为空数组。 */
	readonly capabilities: readonly string[];
	/** 'known'：provider 已注册；'unknown'：配置了但没有匹配的已注册 provider。 */
	readonly status: 'known' | 'unknown';
	/** 服务是否处于启用状态（enabled !== false && disabled !== true）。 */
	readonly enabled: boolean;
	readonly readOnly: boolean;
	/** 该实例是否被 context defaults 显式选为对应 provider 的默认实例。 */
	readonly isDefault: boolean;
	/**
	 * 同一 canonical provider 下有多个启用实例，且没有唯一的默认实例可以消歧时为 true。
	 * 未知 provider 或禁用实例不参与歧义判断。
	 */
	readonly ambiguous: boolean;
}

export interface ServiceCatalogViewOptions {
	/** defaults 映射：key 可以是 provider 名/别名，也可以是能力名；value 是 service 名称。 */
	readonly defaults?: Readonly<Record<string, string>>;
	/** 将任意名称（provider 名、别名，或 defaults 的 key）解析为已注册 provider 的规范名；未知时返回 undefined。 */
	resolveProviderName(name: string): string | undefined;
	/** 返回某个 canonical provider 声明的能力列表；未提供时能力始终为空数组。 */
	getProviderCapabilities?(canonicalProvider: string): readonly string[];
}

/**
 * 基于当前已选 context 的配置快照，构建一份跨 provider 的有效能力视图。
 *
 * 纯函数：只读取 context.configuredServices（缺省回退 context.services）与传入的 resolver，
 * 不发起任何 I/O，可被 catalog 命令、WOC-010 doctor、WOC-011 fixture provider 复用同一判断逻辑。
 */
export function buildServiceCatalogView(
	context: Pick<ResolvedServiceContext, 'services' | 'configuredServices'>,
	options: ServiceCatalogViewOptions,
): ServiceCatalogEntry[] {
	const { resolveProviderName, getProviderCapabilities, defaults = {} } = options;
	const services: Readonly<Record<string, CliServiceConfig>> = context.configuredServices ?? context.services;

	const entries = Object.entries(services).map(([name, config]): Omit<ServiceCatalogEntry, 'isDefault' | 'ambiguous'> => {
		const canonicalProvider = resolveProviderName(config.provider);
		return {
			name,
			configuredProvider: config.provider,
			canonicalProvider,
			capabilities: canonicalProvider ? (getProviderCapabilities?.(canonicalProvider) ?? []) : [],
			status: canonicalProvider ? 'known' : 'unknown',
			enabled: isCliServiceEnabled(config),
			readOnly: config.readOnly !== false,
		};
	});

	// defaults 的 key 可能是 provider 名/别名，也可能是能力名；统一解析为 canonical provider 名（解析失败时保留原 key 以兼容能力名场景）。
	const defaultsByCanonicalProvider = new Map<string, Set<string>>();
	for (const [key, value] of Object.entries(defaults)) {
		const canonicalKey = resolveProviderName(key) ?? key;
		if (!defaultsByCanonicalProvider.has(canonicalKey)) defaultsByCanonicalProvider.set(canonicalKey, new Set());
		defaultsByCanonicalProvider.get(canonicalKey)!.add(value);
	}

	// 按 canonical provider 分组，仅在启用且已知的实例间判断默认/歧义。
	const groups = new Map<string, typeof entries>();
	for (const entry of entries) {
		if (entry.status !== 'known' || !entry.enabled) continue;
		const key = entry.canonicalProvider!;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(entry);
	}

	const defaultNames = new Set<string>();
	const ambiguousNames = new Set<string>();
	for (const [provider, group] of groups) {
		if (group.length <= 1) continue;
		const defaultCandidates = new Set<string>();
		for (const [key, names] of defaultsByCanonicalProvider) {
			if (key !== provider) continue;
			for (const name of names) if (group.some((entry) => entry.name === name)) defaultCandidates.add(name);
		}
		if (defaultCandidates.size === 1) {
			defaultNames.add([...defaultCandidates][0]);
		} else {
			for (const entry of group) ambiguousNames.add(entry.name);
		}
	}
	// 单实例也可能被显式标记为默认（即使不需要消歧）。
	for (const entry of entries) {
		if (entry.status !== 'known' || !entry.enabled) continue;
		for (const [key, names] of defaultsByCanonicalProvider) {
			if (key === entry.canonicalProvider && names.has(entry.name)) defaultNames.add(entry.name);
		}
	}

	return entries.map((entry) => ({
		...entry,
		isDefault: defaultNames.has(entry.name),
		ambiguous: ambiguousNames.has(entry.name),
	}));
}
