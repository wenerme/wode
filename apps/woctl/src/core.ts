import type { ServiceProvider, ServiceSchema } from '@wener/common/service';
import { createBuiltinServiceProviders } from '@wener/common/service/builtin';
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
const systemTools: ServiceSchema['tools'] = {
	info: {
		description: 'Runtime environment information', inputSchema: { type: 'object' },
		annotations: { readOnlyHint: true },
	},
	echo: {
		description: 'Return the input text',
		inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
		annotations: { readOnlyHint: true },
	},
};
export function createDefaultConfig(): CliConfig {
	return parseCliConfig({});
}

export function createBuiltinProviders(info: Record<string, unknown> = {}): ServiceProvider[] {
	return [
		...createBuiltinServiceProviders(),
		{
			name: 'system',
			title: 'System',
			description: 'Offline runtime information and echo operations',
			capabilities: ['system'],
			optionsSchema: noServiceOptions,
			tools: systemTools,
			create() {
				return {
					async getSchema() {
						return structuredClone({ tools: systemTools });
					},
					async call(tool, input) {
						if (tool === 'info') return { application: APP_NAME, version: VERSION, ...info };
						if (
							tool === 'echo' &&
							typeof input === 'object' &&
							input !== null &&
							'text' in input &&
							typeof input.text === 'string'
						)
							return { text: input.text };
						throw new Error('system echo requires a text string');
					},
				};
			},
		},
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

interface SystemClient {
	info(input: object, options?: { signal?: AbortSignal }): Promise<unknown>;
	echo(input: { text: string }, options?: { signal?: AbortSignal }): Promise<unknown>;
}
export const SystemCliDefinition: ServiceCliDefinition<SystemClient> = {
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
