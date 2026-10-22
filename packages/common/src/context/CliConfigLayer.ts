import { z } from 'zod';
import { AiConfigShape } from './AiConfig';
import { type CliConfig } from './CliConfig';
import { CliConfigError, configErrorMessage, configObject, isConfigRecord } from './configObject';
import { CliMcpServersSchema } from './McpConfig';
import { CliConfigNameSchema, normalizeCliServices } from './ServiceConfig';

export type CliConfigLayerKind = 'base' | 'context';
/** Native 文件的规范化层；services/defaults 索引仅供内部命令和 runtime 使用。 */
export type CliConfigLayer = CliConfig['contexts'][string] & { version?: 1; currentContext?: string };
export interface CliConfigLayerDocument extends Record<string, unknown> {
	services: Array<Record<string, unknown>>;
	defaults: { services: Record<string, string> };
}

const nativeLayer = configObject(
	z.looseObject({
		...AiConfigShape,
		title: z.string().optional(),
		version: z.literal(1).optional(),
		currentContext: CliConfigNameSchema.optional(),
		services: z.array(z.unknown()).default([]),
		mcpServers: CliMcpServersSchema.optional(),
		defaults: z
			.strictObject({ services: z.record(CliConfigNameSchema, CliConfigNameSchema).default({}) })
			.default({ services: {} }),
	}),
);

/** 仅接受 native 文档：数组 services、嵌套 defaults.services，不接受内联 contexts。 */
export function parseCliConfigLayer(value: unknown, { kind }: { kind: CliConfigLayerKind }): CliConfigLayer {
	const input = value === undefined ? {} : value;
	if (isConfigRecord(input)) {
		if (Object.hasOwn(input, 'contexts')) throw new CliConfigError('Inline contexts are not supported');
		if (Object.hasOwn(input, 'removeServices')) throw new CliConfigError('Inherited service deletion is not supported');
		if (kind === 'context' && ['version', 'currentContext'].some((key) => Object.hasOwn(input, key)))
			throw new CliConfigError('Context layers cannot contain root control fields');
	}
	const result = nativeLayer.safeParse(input);
	if (!result.success) throw new CliConfigError(configErrorMessage(result.error));
	const { services, defaults, ...rest } = result.data;
	try {
		return structuredClone({
			...rest,
			services: normalizeCliServices(services),
			defaults: defaults.services,
			...(kind === 'base' ? { version: rest.version ?? 1, currentContext: rest.currentContext ?? 'local' } : {}),
		});
	} catch (error) {
		if (error instanceof CliConfigError) throw error;
		throw new CliConfigError();
	}
}

function layerDocument(layer: CliConfigLayer): CliConfigLayerDocument {
	return {
		...layer,
		services: Object.entries(normalizeCliServices(layer.services)).map(([name, { provider, ...service }]) => ({
			...service,
			name,
			...(!service.type && !service.api ? { type: provider } : {}),
		})),
		defaults: { services: layer.defaults },
	};
}

/** 输出总是 canonical 数组；不保留 YAML 注释、排版或旧格式。 */
export function serializeCliConfigLayer(layer: CliConfigLayer, kind: CliConfigLayerKind): CliConfigLayerDocument {
	return layerDocument(parseCliConfigLayer(layerDocument(layer), { kind }));
}
