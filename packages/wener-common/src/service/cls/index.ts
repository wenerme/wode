import { TencentLogClient, type TencentLogClientInit } from '@wener/client/tencent/cls';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { ITencentClsService, TencentClsListTopicInput, TencentClsQueryInput } from './ITencentClsService';
import { ClsOperations } from './operations';
import { TencentClsServiceCapability } from './ITencentClsService';

export * from './operations';
export { sanitizeClsOutput } from './sanitize';
export type { ITencentClsService, TencentClsListTopicInput, TencentClsQueryInput } from './ITencentClsService';
export { TencentClsServiceCapability } from './ITencentClsService';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
/**
 * Only environment variable references are accepted for credentials, consistent with
 * Telegram's bot token handling: a Tencent Cloud secret key is a full account-control
 * credential, so inline plaintext configuration is intentionally not supported.
 */
export const TencentClsServiceOptionsSchema = Object.assign(
	z.strictObject({
		clientIdEnv: envName,
		clientSecretEnv: envName,
		region: z.string().min(1).optional(),
		endpoint: z.string().min(1).optional(),
	}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				clientIdEnv: { type: 'string' },
				clientSecretEnv: { type: 'string' },
				region: { type: 'string' },
				endpoint: { type: 'string' },
			},
			required: ['clientIdEnv', 'clientSecretEnv'],
			additionalProperties: false,
		},
	},
);
const configOptions = TencentClsServiceOptionsSchema;

function clientOptions({ config, getEnv }: ServiceProviderContext): TencentLogClientInit {
	const parsed = configOptions.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Tencent CLS service configuration');
	const value = parsed.data;
	function credential(name: 'clientId' | 'clientSecret', reference: string): string {
		const secret = getEnv?.(reference);
		if (secret === undefined || !secret.length) throw new Error(`Tencent CLS ${name} environment variable is unavailable`);
		return secret;
	}
	return {
		clientId: credential('clientId', value.clientIdEnv),
		clientSecret: credential('clientSecret', value.clientSecretEnv),
		region: value.region,
		endpoint: value.endpoint,
	};
}

export const TencentClsServiceProvider: ServiceProviderDefinition<ITencentClsService> = {
	name: 'cls',
	title: 'Tencent CLS',
	description: 'Query Tencent Cloud Log Service (CLS) logs and list log topics.',
	examples: [
		{ command: 'woctl cls query --topic my-topic "*"', description: 'Search a log topic.' },
		{ command: 'woctl cls topics', description: 'List log topics.' },
	],
	aliases: ['tencent-cls', 'tencent-log'],
	provides: [TencentClsServiceCapability],
	optionsSchema: TencentClsServiceOptionsSchema,
	operations: ClsOperations,
	create(context) {
		// This slice is read-only; writing (create/delete topic, put logs) is left to a later slice.
		if (context.config.readOnly === false) throw new Error('Tencent CLS service must be read-only');
		const client = new TencentLogClient({ ...clientOptions(context), fetch: context.fetch });
		const service: ITencentClsService = {
			type: 'cls',
			readOnly: true,
			async query(input: TencentClsQueryInput, _options) {
				const { topic, query, from, to, limit, sort, cursor, sql } = input;
				const ids = await client.resolveTopicIds([...topic]);
				if (ids.length === 0) throw new Error('No matching CLS topic');
				const topicShape = ids.length === 1 ? { TopicId: ids[0] } : { Topics: ids.map((TopicId) => ({ TopicId })) };
				return client.searchLog({
					Query: query,
					From: from,
					To: to,
					...(limit !== undefined ? { Limit: limit } : {}),
					...(sort !== undefined ? { Sort: sort } : {}),
					...(cursor !== undefined ? { Context: cursor } : {}),
					...(sql === true ? { SyntaxRule: 1 as const } : {}),
					...topicShape,
				});
			},
			async listTopic(input: TencentClsListTopicInput = {}, _options) {
				const { search, limit, offset } = input;
				return client.listTopic({
					...(search ? { Filters: [{ Key: 'topicName', Values: [search] }] } : {}),
					...(limit !== undefined ? { Limit: limit } : {}),
					...(offset !== undefined ? { Offset: offset } : {}),
				});
			},
			close: () => Promise.resolve(),
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { cls: service };
	},
};
