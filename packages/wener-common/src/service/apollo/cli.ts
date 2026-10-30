import type { ServiceCliDefinition } from '../cli/ServiceCliDefinition';
import type { IApolloService } from './index';

function input(options: Record<string, unknown>) {
	return {
		...(typeof options.namespace === 'string' ? { namespace: options.namespace } : {}),
		...(typeof options.cluster === 'string' ? { cluster: options.cluster } : {}),
		...(typeof options['app-id'] === 'string' ? { appId: options['app-id'] } : {}),
	};
}

export const ApolloCliDefinition: ServiceCliDefinition<IApolloService> = {
	name: 'apollo',
	description: 'Read Apollo Config service data',
	options: [
		{ name: 'namespace', description: 'Apollo namespace' },
		{ name: 'cluster', description: 'Apollo cluster' },
		{ name: 'app-id', description: 'Override the Apollo app ID' },
	],
	commands: [
		{ name: 'config', aliases: ['get'], description: 'Get the Apollo configuration response', prepare({ options }) { return (service) => service.getConfig(input(options)); } },
		{ name: 'json', description: 'Get Apollo configuration as JSON', prepare({ options }) { return (service) => service.getJson(input(options)); } },
		{ name: 'content', description: 'Get Apollo configuration content', prepare({ options }) { return (service) => service.getContent(input(options)); } },
		{ name: 'data', description: 'Parse Apollo configuration data', prepare({ options }) { return (service) => service.getData(input(options)); } },
		{ name: 'properties', description: 'Get Apollo properties content', prepare({ options }) { return (service) => service.getProperties(input(options)); } },
		{ name: 'raw', description: 'Get Apollo raw configuration content', prepare({ options }) { return (service) => service.getConfigRaw(input(options)); } },
	],
};
