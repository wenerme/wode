import { z } from 'zod';
import { CliConfigError, configErrorMessage, configObject, isConfigRecord } from './configObject';

export const CliConfigNameSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, 'Invalid configuration name');
const serviceType = z
	.string()
	.min(1)
	.refine((value) => value.trim().length > 0, 'Invalid service type');

/** 输出保持 provider 必填，兼容现有 runtime；公开输入的 type/api 不被替换或丢弃。 */
const serviceConfig = configObject(
	z
		.looseObject({
			provider: serviceType.optional(),
			name: CliConfigNameSchema.optional(),
			type: serviceType.optional(),
			api: serviceType.optional(),
			id: z.string().min(1).optional(),
			title: z.string().optional(),
			baseUrl: z.url().optional(),
			headers: z.record(z.string(), z.string()).optional(),
			readOnly: z.boolean().default(true),
			enabled: z.boolean().optional(),
			disabled: z.boolean().optional(),
			options: z.record(z.string(), z.json()).optional(),
		})
		.superRefine((service, context) => {
			const type = service.type ?? service.api;
			if (!type && !service.provider)
				context.addIssue({ code: 'custom', message: 'Service requires a type or provider' });
			if (type && service.provider !== undefined && service.provider !== type)
				context.addIssue({ code: 'custom', message: 'Service type and provider conflict' });
			if (service.enabled !== undefined && service.disabled !== undefined && service.enabled === service.disabled)
				context.addIssue({ code: 'custom', message: 'Service enabled and disabled flags conflict' });
		}),
);

export const CliServiceConfigSchema = serviceConfig.transform(
	(service): z.output<typeof serviceConfig> & { provider: string } => ({
		...service,
		provider: (service.type ?? service.api ?? service.provider) as string,
	}),
);

export type CliServiceConfig = z.infer<typeof CliServiceConfigSchema>;

/** 只处理显式数据；不查询 registry、文件、环境变量或认证信息。 */
export function normalizeCliServices(value: unknown): Record<string, CliServiceConfig> {
	if (value === undefined) return {};
	const array = Array.isArray(value);
	if (!array && !isConfigRecord(value)) throw new CliConfigError('Invalid service configuration');
	const entries: Array<[string, CliServiceConfig]> = [];
	const names = new Set<string>();
	for (const [key, raw] of array ? Array.from(value, (entry) => [undefined, entry] as const) : Object.entries(value)) {
		const result = CliServiceConfigSchema.safeParse(raw);
		if (!result.success) throw new CliConfigError(configErrorMessage(result.error));
		const service = result.data;
		const name = array ? service.name : key;
		if (!CliConfigNameSchema.safeParse(name).success || typeof name !== 'string')
			throw new CliConfigError('Invalid service name');
		if (array && !service.type && !service.api) throw new CliConfigError('Array service requires type or api');
		if (!array && service.name !== undefined && service.name !== name)
			throw new CliConfigError('Service name does not match map key');
		if (names.has(name)) throw new CliConfigError('Duplicate service name');
		names.add(name);
		entries.push([name, service]);
	}
	try {
		return structuredClone(Object.fromEntries(entries));
	} catch {
		throw new CliConfigError('Invalid service configuration');
	}
}

export const CliServicesSchema = z
	.unknown()
	.transform((value, context) => {
		try {
			return normalizeCliServices(value);
		} catch (error) {
			context.addIssue({
				code: 'custom',
				message: error instanceof CliConfigError ? error.message : 'Invalid service configuration',
			});
			return z.NEVER;
		}
	})
	.default({});

/** 手工构造的 runtime context 也必须遵守启用标记，不能绕过 parser。 */
export function isCliServiceEnabled(service: Pick<CliServiceConfig, 'enabled' | 'disabled'>): boolean {
	if (
		(service.enabled !== undefined && typeof service.enabled !== 'boolean') ||
		(service.disabled !== undefined && typeof service.disabled !== 'boolean') ||
		(service.enabled !== undefined && service.disabled !== undefined && service.enabled === service.disabled)
	)
		throw new Error('Invalid service availability flags');
	return service.disabled !== true && service.enabled !== false;
}
