import type { CliConfig } from 'common/context';
import { parseCliConfig } from 'common/context';
import type { ServiceProvider } from 'common/service';
import type { ServiceCliDefinition } from 'common/service/cli';
import { createHttpServiceRuntimeClient } from 'common/service/runtime/client';
import { APP_NAME, APP_VERSION } from './const';
import { createDuckDuckGoProvider } from './services/duckduckgo';

export const VERSION = APP_VERSION;
export function createDefaultConfig(): CliConfig {
	return parseCliConfig({});
}

export function createBuiltinProviders(info: Record<string, unknown> = {}): ServiceProvider[] {
	return [
		createDuckDuckGoProvider(),
		{
			name: 'system',
			create() {
				return {
					async getSchema() {
						return {
							tools: {
								info: {
									description: '运行环境信息',
									inputSchema: { type: 'object' },
									annotations: { readOnlyHint: true },
								},
								echo: {
									description: '返回输入文本',
									inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
									annotations: { readOnlyHint: true },
								},
							},
						};
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
	description: '离线系统服务',
	commands: [
		{
			name: 'info',
			description: '显示运行环境',
			prepare: () => (client, options) => client.info({}, options),
		},
		{
			name: 'echo',
			description: '返回文本，验证 service 调用链',
			arguments: '<text>',
			prepare:
				({ args }) =>
				(client, options) =>
					client.echo({ text: args[0] }, options),
		},
	],
};
