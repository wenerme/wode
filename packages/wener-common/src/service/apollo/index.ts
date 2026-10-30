import {
	ApolloConfigClient,
	type ApolloConfigClientOptions,
	type CommonConfigOptions,
	type NotificationItem,
} from '@wener/client/apolloconfig';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';

export const ApolloServiceOptionsSchema = Object.assign(z.strictObject({
	appId: z.string().min(1),
	appSecret: z.string().optional(),
	appSecretEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u).optional(),
	cluster: z.string().min(1).optional(),
	namespace: z.string().min(1).optional(),
	clientIp: z.string().optional(),
}), {
	jsonSchema: {
		type: 'object',
		required: ['appId'],
		properties: {
			appId: { type: 'string' }, appSecret: { type: 'string' }, appSecretEnv: { type: 'string' },
			cluster: { type: 'string', default: 'default' }, namespace: { type: 'string', default: 'application' },
			clientIp: { type: 'string' },
		},
		additionalProperties: false,
	},
});

export interface IApolloService {
	readonly type: 'apollo';
	readonly readOnly: true;
	getConfig(input?: CommonConfigOptions & { releaseKey?: string; messages?: string; label?: string }): Promise<unknown>;
	getJson(input?: CommonConfigOptions): Promise<Record<string, string>>;
	getContent(input?: CommonConfigOptions & { format?: ApolloConfigFormat }): Promise<string>;
	getData(input?: CommonConfigOptions & { format?: ApolloConfigFormat }): Promise<unknown>;
	getProperties(input?: CommonConfigOptions): Promise<string>;
	getConfigRaw(input?: CommonConfigOptions): Promise<string>;
	getNotifications(input: { notifications: NotificationItem[]; appId?: string; cluster?: string }): Promise<unknown>;
	close(): Promise<void>;
}
export type ApolloConfigFormat = 'json' | 'xml' | 'yaml' | 'yml' | 'properties' | 'txt';

const contract = {
	methods: {
		getConfig: { description: 'Get the Apollo configuration response for a namespace.', inputType: '{namespace?: string; cluster?: string; appId?: string}', outputType: 'unknown' },
		getJson: { description: 'Get Apollo configuration as a key-value object.', inputType: '{namespace?: string; cluster?: string; appId?: string}', outputType: 'Record<string, string>' },
		getContent: { description: 'Get Apollo configuration content in the requested format.', inputType: '{namespace?: string; cluster?: string; appId?: string; format?: string}', outputType: 'string' },
		getData: { description: 'Parse Apollo configuration into structured data.', inputType: '{namespace?: string; cluster?: string; appId?: string; format?: string}', outputType: 'unknown' },
		getProperties: { description: 'Get Apollo configuration as properties text.', inputType: '{namespace?: string; cluster?: string; appId?: string}', outputType: 'string' },
		getConfigRaw: { description: 'Get Apollo raw configuration content.', inputType: '{namespace?: string; cluster?: string; appId?: string}', outputType: 'string' },
		getNotifications: { description: 'Check Apollo namespace notifications.', inputType: '{notifications: unknown[]; appId?: string; cluster?: string}', outputType: 'unknown' },
	},
} as const;

function createClient({ config, getEnv, fetch }: ServiceProviderContext): ApolloConfigClient {
	if (!config.baseUrl) throw new Error('Apollo service requires baseUrl');
	const parsed = ApolloServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Apollo service options');
	const value = parsed.data;
	if (value.appSecret !== undefined && value.appSecretEnv !== undefined) throw new Error('Conflicting Apollo app secret options');
	const appSecret = value.appSecretEnv === undefined ? value.appSecret : getEnv?.(value.appSecretEnv);
	if (value.appSecretEnv !== undefined && !appSecret) throw new Error('Apollo app secret environment variable is unavailable');
	const options: ApolloConfigClientOptions = {
		url: config.baseUrl,
		appId: value.appId,
		appSecret,
		cluster: value.cluster ?? 'default',
		namespace: value.namespace ?? 'application',
		clientIp: value.clientIp,
		fetch,
	};
	return new ApolloConfigClient(options);
}

export const ApolloServiceProvider: ServiceProviderDefinition<'apollo'> = {
	name: 'apollo',
	provides: ['apollo'],
	optionsSchema: ApolloServiceOptionsSchema,
	contract,
	create(context) {
		const client = createClient(context);
		return {
			apollo: {
				type: 'apollo',
				readOnly: true,
				getConfig: (input) => client.getConfig(input),
				getJson: (input) => client.getJson(input),
				getContent: (input) => client.getContent(input),
				getData: (input) => client.getData(input),
				getProperties: (input) => client.getProperties(input),
				getConfigRaw: (input) => client.getConfigRaw(input),
				getNotifications: (input) => client.getNotifications(input),
				close: async () => undefined,
			},
		};
	},
};

export type ApolloService = IApolloService;
