import { type CliConfig, parseCliConfig } from './CliConfig';
import type { CliServiceConfig } from './ServiceConfig';

export interface CliContextDocument extends Record<string, unknown> {
	services: Array<Record<string, unknown>>;
}
export interface CliConfigDocument extends CliContextDocument {
	contexts: Record<string, CliContextDocument>;
}

function serializeServices(services: Record<string, CliServiceConfig>): Array<Record<string, unknown>> {
	return Object.entries(services).map(([name, { provider, ...service }]) => ({
		...service,
		name,
		...(!service.type && !service.api ? { type: provider } : {}),
	}));
}

/** Browser aggregate 存储；native 文件使用独立的 serializeCliConfigLayer。 */
export function serializeCliConfig(config: CliConfig): CliConfigDocument {
	const parsed = parseCliConfig(config);
	return {
		...parsed,
		services: serializeServices(parsed.services),
		contexts: Object.fromEntries(
			Object.entries(parsed.contexts).map(([name, context]) => [
				name,
				{
					...context,
					services: serializeServices(context.services),
				},
			]),
		),
	};
}
