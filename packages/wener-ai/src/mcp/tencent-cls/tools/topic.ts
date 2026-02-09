import type { TencentClsContext } from '../server';
import { DescribeTopicInputSchema, ListTopicsInputSchema } from '../schemas';

export function registerTopicTools(ctx: TencentClsContext) {
	const { server, getClient, textResult, jsonResult } = ctx;

	server.registerTool(
		'describe_topic',
		{
			description: 'Get topic metadata and discovered fields from sample logs.',
			inputSchema: DescribeTopicInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic }) => {
			try {
				const client = getClient();
				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				const { Topics } = await client.listTopic({
					Filters: [{ Key: 'topicId', Values: topicIds }],
				});
				const topicInfo = Topics?.[0];
				if (!topicInfo) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				// Sample logs to discover fields
				const sampleRes = await client.searchLog({
					TopicId: topicIds[0],
					Query: '*',
					From: Date.now() - 3600 * 1000,
					To: Date.now(),
					Limit: 20,
				});

				const fields = new Map<string, { types: Set<string>; samples: any[] }>();
				for (const result of sampleRes.Results || []) {
					if (result.LogJson) {
						try {
							const logData = JSON.parse(result.LogJson);
							for (const [key, value] of Object.entries(logData)) {
								if (!fields.has(key)) {
									fields.set(key, { types: new Set(), samples: [] });
								}
								const field = fields.get(key);
								if (!field) continue;
								field.types.add(typeof value);
								if (field.samples.length < 2 && value !== null && value !== undefined) {
									field.samples.push(value);
								}
							}
						} catch {}
					}
				}

				const fieldList = Array.from(fields.entries())
					.map(([name, info]) => ({
						name,
						types: Array.from(info.types),
						samples: info.samples,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));

				return jsonResult({
					id: topicInfo.TopicId,
					name: topicInfo.TopicName,
					logsetId: topicInfo.LogsetId,
					status: topicInfo.Status,
					storageType: topicInfo.StorageType,
					period: topicInfo.Period,
					fields: fieldList,
				});
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	server.registerTool(
		'list_topics',
		{
			description: 'List available log topics.',
			inputSchema: ListTopicsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ filter, limit }) => {
			try {
				const client = getClient();
				const filters: Array<{ Key: string; Values: string[] }> = [];
				if (filter) filters.push({ Key: 'topicName', Values: [filter] });

				const res = await client.listTopic({
					Filters: filters.length > 0 ? filters : undefined,
					Limit: limit,
				});

				const topics = res.Topics.map((t) => ({
					id: t.TopicId,
					name: t.TopicName,
					period: t.Period,
				}));

				return jsonResult({ topics, total: res.TotalCount });
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);
}
