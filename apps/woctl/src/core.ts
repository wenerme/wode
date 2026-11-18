import type { ServiceProvider } from '@wener/common/service';
import { createServiceProviderAdapter } from '@wener/common/service/runtime';
import { createSystemServiceProvider, type ISystemServiceContract } from '@wener/common/service/system';
import { createBuiltinServiceProviders } from './builtin';
import type { ServiceCliDefinition } from '@wener/common/service/cli';
import { createHttpServiceRuntimeClient } from '@wener/common/service/runtime/client';
import type { CliConfig } from 'common/context';
import { parseCliConfig } from 'common/context';
import { APP_NAME, APP_VERSION } from './const';

export const VERSION = APP_VERSION;
const noServiceOptions = {
	jsonSchema: { type: 'object', properties: {}, additionalProperties: false },
	safeParse(value: unknown) {
		return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
			? { success: true as const, data: value }
			: { success: false as const };
	},
};
export function createDefaultConfig(): CliConfig {
	return parseCliConfig({});
}

export function createBuiltinProviders(info: Record<string, unknown> = {}): ServiceProvider[] {
	return [
		...createBuiltinServiceProviders(),
		createServiceProviderAdapter(
			createSystemServiceProvider({ application: APP_NAME, version: VERSION, ...info }),
		),
		{
			name: 'http',
			title: 'HTTP service runtime',
			description: 'Connect to a remote schema/call service; tools are discovered at runtime',
			capabilities: ['http'],
			optionsSchema: noServiceOptions,
			create({ config, name, fetch }) {
				if (!config.baseUrl) throw new Error('HTTP service requires baseUrl');
				const runtime = createHttpServiceRuntimeClient({ baseUrl: config.baseUrl, headers: config.headers, fetch });
				const params = { service: config.id ?? name };
				return {
					getSchema: (options) => runtime.getSchema({ params }, options),
					call: (toolName, input, options) => runtime.call({ params, body: { toolName, input } }, options),
				};
			},
		},
	];
}

export const SystemCliDefinition: ServiceCliDefinition<ISystemServiceContract> = {
	name: 'system',
	description: 'Offline system service',
	commands: [
		{
			name: 'info',
			description: 'Show runtime information',
			prepare: () => (client, options) => client.info({}, options),
		},
		{
			name: 'echo',
			description: 'Echo text to verify service calls',
			arguments: '<text>',
			prepare:
				({ args }) =>
				(client, options) =>
					client.echo({ text: args[0] }, options),
		},
	],
};
