import {
	TencentLogClient,
	type ListTopicRequest,
	type ListTopicResponse,
	type SearchLogResponse,
	type TencentLogClientInit,
	isTopicId,
} from '@wener/client/tencent/cls';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { ITencentClsService, TencentClsServiceCallOptions } from './ITencentClsService';
import { TencentClsServiceCapability } from './ITencentClsService';
import { ClsOperations } from './operations';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
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

type ClsRequestScope = { signal?: AbortSignal; close(): void };

function requestScope(options?: TencentClsServiceCallOptions): ClsRequestScope {
	const timeoutMs = options?.context?.timeoutMs;
	if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3_600_000))
		throw new Error('Invalid Tencent CLS timeout');
	if (timeoutMs === undefined) return { signal: options?.signal, close() {} };
	const timeoutController = new AbortController();
	const signal = options?.signal ? AbortSignal.any([options.signal, timeoutController.signal]) : timeoutController.signal;
	const timer = setTimeout(() => timeoutController.abort(Object.assign(new Error('Tencent CLS request timed out'), { code: 'TIMEOUT' })), timeoutMs);
	return { signal, close: () => clearTimeout(timer) };
}

async function resolveTopicIds(client: TencentLogClient, needle: readonly string[], signal?: AbortSignal): Promise<string[]> {
	const ids = needle.filter((value) => isTopicId(value));
	const names = needle.filter((value) => !isTopicId(value));
	if (names.length === 0) return ids;
	const query: ListTopicRequest = {
		Filters: [{ Key: 'topicName', Values: names }],
	};
	const list = (input: ListTopicRequest) => client.request<ListTopicResponse>('DescribeTopics', input, { signal });
	let topics = (await list({ ...query, PreciseSearch: 1 })).Topics;
	if (topics.length === 0) topics = (await list(query)).Topics;
	if (topics.length === 0) topics = (await list({ Limit: 100 })).Topics.filter((topic) => names.some((name) => topic.TopicName?.includes(name)));
	return [...ids, ...topics.map((topic) => topic.TopicId)];
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
		if (context.config.readOnly === false) throw new Error('Tencent CLS service must be read-only');
		const client = new TencentLogClient({ ...clientOptions(context), fetch: context.fetch });
		const service: ITencentClsService = {
			type: 'cls',
			readOnly: true,
			async query(input, options) {
				const scope = requestScope(options);
				try {
					const ids = await resolveTopicIds(client, input.topic, scope.signal);
					if (ids.length === 0) throw new Error('No matching CLS topic');
					const topicShape = ids.length === 1 ? { TopicId: ids[0] } : { Topics: ids.map((TopicId) => ({ TopicId })) };
					return await client.request<SearchLogResponse>('SearchLog', {
						Query: input.query,
						From: input.from,
						To: input.to,
						...(input.limit !== undefined ? { Limit: input.limit } : {}),
						...(input.sort !== undefined ? { Sort: input.sort } : {}),
						...(input.cursor !== undefined ? { Context: input.cursor } : {}),
						...(input.sql === true ? { SyntaxRule: 1 as const } : {}),
						...topicShape,
					}, { signal: scope.signal });
				} finally {
					scope.close();
				}
			},
			async listTopic(input = {}, options) {
				const scope = requestScope(options);
				try {
					return await client.request<ListTopicResponse>('DescribeTopics', {
						...(input.search ? { Filters: [{ Key: 'topicName', Values: [input.search] }] } : {}),
						...(input.limit !== undefined ? { Limit: input.limit } : {}),
						...(input.offset !== undefined ? { Offset: input.offset } : {}),
					}, { signal: scope.signal });
				} finally {
					scope.close();
				}
			},
			close: () => Promise.resolve(),
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { cls: service };
	},
};
