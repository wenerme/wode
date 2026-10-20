import { z } from 'zod';
import { AiConfigShape, type AiProvider, describeAiProvider, type PromptPreset, publicConfigUrl } from './AiConfig';
import { CliConfigError, configErrorMessage, configObject } from './configObject';
import {
	type CliServiceConfig,
	CliServicesSchema,
	isCliServiceEnabled,
	CliConfigNameSchema as name,
} from './ServiceConfig';

export { type CliServiceConfig, CliServiceConfigSchema } from './ServiceConfig';

const context = configObject(
	z.looseObject({
		...AiConfigShape,
		title: z.string().optional(),
		services: CliServicesSchema,
		defaults: z.record(name, name).default({}),
	}),
);
export const CliConfigSchema = configObject(
	z.looseObject({
		...AiConfigShape,
		version: z.literal(1).default(1),
		currentContext: name.default('local'),
		services: CliServicesSchema,
		defaults: z.record(name, name).default({}),
		contexts: z.record(name, context).default({ local: { services: {}, defaults: {} } }),
	}),
);
export type CliConfig = z.infer<typeof CliConfigSchema>;

/** 配置持久化属于宿主，命令和 service 不依赖 Node 或浏览器存储。 */
export interface CliConfigStore {
	load(options?: { context?: string }): Promise<CliConfig>;
	save(config: CliConfig): Promise<void>;
	/** Native 宿主显式创建物理 overlay，区别于隐式 local 占位。 */
	createContext?(name: string, options?: { context?: string }): Promise<void>;
}

export function parseCliConfig(value: unknown): CliConfig {
	const result = CliConfigSchema.safeParse(value);
	if (!result.success) throw new CliConfigError(configErrorMessage(result.error));
	let config: CliConfig;
	try {
		config = structuredClone(result.data);
	} catch {
		throw new CliConfigError();
	}
	return config;
}

export function createMemoryCliConfigStore(initial: unknown = {}): CliConfigStore {
	let config = parseCliConfig(initial);
	return {
		async load() {
			return structuredClone(config);
		},
		async save(next) {
			config = parseCliConfig(next);
		},
	};
}

export type CliServiceOrigin = { scope: 'root' } | { scope: 'context'; context: string };

export interface ResolvedCliContext {
	name: string;
	title?: string;
	/** 仅启用项；未知 type 仍保留，由执行时的 registry 决定是否支持。 */
	services: Readonly<Record<string, CliServiceConfig>>;
	/** resolver 总会提供；可选性保留手工创建旧宿主 context 的兼容性。 */
	configuredServices?: Readonly<Record<string, CliServiceConfig>>;
	/** 全部配置项的逻辑层来源，不代表文件来源或 revision。 */
	serviceOrigins?: Readonly<Record<string, CliServiceOrigin>>;
	defaults: Readonly<Record<string, string>>;
	providers?: Readonly<Record<string, AiProvider>>;
	defaultModel?: string;
	prompts?: Readonly<Record<string, PromptPreset>>;
}

export function resolveCliContext(
	config: CliConfig,
	selected?: string,
): ResolvedCliContext & Required<Pick<ResolvedCliContext, 'configuredServices' | 'serviceOrigins'>> {
	const contextName = selected ?? config.currentContext;
	if (!Object.hasOwn(config.contexts, contextName)) throw new CliConfigError('Unknown context');
	const selectedContext = config.contexts[contextName];
	const configuredServices = structuredClone({ ...config.services, ...selectedContext.services });
	const services = Object.fromEntries(
		Object.entries(configuredServices).filter(([, service]) => isCliServiceEnabled(service)),
	);
	const serviceOrigins = Object.fromEntries(
		Object.keys(configuredServices).map((key): [string, CliServiceOrigin] => [
			key,
			Object.hasOwn(selectedContext.services, key) ? { scope: 'context', context: contextName } : { scope: 'root' },
		]),
	);
	return {
		name: contextName,
		title: selectedContext.title,
		services,
		configuredServices,
		serviceOrigins,
		defaults: { ...config.defaults, ...selectedContext.defaults },
		providers: structuredClone({ ...config.providers, ...selectedContext.providers }),
		defaultModel: selectedContext.defaultModel ?? config.defaultModel,
		prompts: structuredClone({ ...config.prompts, ...selectedContext.prompts }),
	};
}

/** 执行准入也检查手工提供的 context，不把目录过滤当成唯一权限边界。 */
export function getEnabledCliService(
	context: Pick<ResolvedCliContext, 'services' | 'configuredServices'>,
	name: string,
): CliServiceConfig {
	const configured = context.configuredServices;
	if (configured && Object.hasOwn(configured, name) && !isCliServiceEnabled(configured[name]))
		throw new Error('Selected service is disabled');
	if (!Object.hasOwn(context.services, name)) throw new Error('Unknown service');
	const service = context.services[name];
	if (!isCliServiceEnabled(service)) throw new Error('Selected service is disabled');
	return service;
}

/** 展示配置时隐藏 headers，URL 中的凭据和 query 不进入普通输出。 */
export function describeCliContext(context: ResolvedCliContext) {
	return {
		name: context.name,
		title: context.title,
		defaults: context.defaults,
		...(context.defaultModel ? { defaultModel: context.defaultModel } : {}),
		...(context.providers && Object.keys(context.providers).length
			? {
					providers: Object.fromEntries(
						Object.entries(context.providers).map(([name, provider]) => [name, describeAiProvider(provider)]),
					),
				}
			: {}),
		...(context.prompts && Object.keys(context.prompts).length
			? {
					prompts: Object.fromEntries(
						Object.entries(context.prompts).map(([name, preset]) => [
							name,
							{ title: preset.title, description: preset.description, model: preset.model },
						]),
					),
				}
			: {}),
		services: Object.fromEntries(
			Object.entries(context.configuredServices ?? context.services).map(([key, service]) => [
				key,
				{
					provider: service.provider,
					name: service.name,
					type: service.type,
					api: service.api,
					enabled: service.enabled,
					disabled: service.disabled,
					id: service.id,
					title: service.title,
					readOnly: service.readOnly,
					...(service.baseUrl ? { baseUrl: publicConfigUrl(service.baseUrl) } : {}),
				},
			]),
		),
	};
}
