import type { TencentClsContext } from '../server';
import { HistogramInputSchema, FieldValuesInputSchema, AnalyzeInputSchema } from '../schemas';
import { parseTimeRange } from '../utils';

export function registerAnalysisTools(ctx: TencentClsContext) {
	const { server, getClient, textResult, jsonResult } = ctx;

	server.registerTool(
		'histogram',
		{
			description: 'Get log count distribution over time.',
			inputSchema: HistogramInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, query, from, to, buckets }) => {
			try {
				const client = getClient();
				const { fromMs, toMs } = parseTimeRange(from, to);

				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				const timeRangeMs = toMs - fromMs;
				const intervalSeconds = Math.max(1, Math.ceil(timeRangeMs / buckets / 1000));

				const sql = `${query} | SELECT histogram(cast(__TIMESTAMP__ as timestamp), INTERVAL ${intervalSeconds} SECOND) as time, count(*) as count GROUP BY time ORDER BY time`;

				const res = await client.searchLog({
					Query: sql,
					UseNewAnalysis: true,
					From: fromMs,
					To: toMs,
					TopicId: topicIds[0],
					SyntaxRule: 1,
				});

				const data: Array<{ t: string; c: number }> = [];
				let total = 0;

				if (res.AnalysisRecords) {
					for (const record of res.AnalysisRecords) {
						try {
							const parsed = JSON.parse(record);
							const count = Number(parsed.count) || 0;
							data.push({
								t: new Date(parsed.time).toISOString(),
								c: count,
							});
							total += count;
						} catch {}
					}
				}

				return jsonResult({ total, interval: intervalSeconds, data });
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	server.registerTool(
		'field_values',
		{
			description: 'Get value distribution for a field (top values).',
			inputSchema: FieldValuesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, field, query, from, to, limit }) => {
			try {
				const client = getClient();
				const { fromMs, toMs } = parseTimeRange(from, to);

				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				const sql = `${query} | SELECT "${field}" as v, count(*) as c GROUP BY "${field}" ORDER BY c DESC LIMIT ${limit}`;

				const res = await client.searchLog({
					TopicId: topicIds[0],
					Query: sql,
					From: fromMs,
					To: toMs,
					UseNewAnalysis: true,
					SyntaxRule: 1,
				});

				const values: Array<{ v: any; c: number }> = [];
				let total = 0;

				if (res.AnalysisRecords) {
					for (const record of res.AnalysisRecords) {
						try {
							const parsed = JSON.parse(record);
							const count = Number(parsed.c) || 0;
							values.push({ v: parsed.v, c: count });
							total += count;
						} catch {}
					}
				}

				return jsonResult({ field, total, values });
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	server.registerTool(
		'analyze',
		{
			description: 'Execute SQL analysis on logs.',
			inputSchema: AnalyzeInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, sql, from, to, filter }) => {
			try {
				const client = getClient();
				const { fromMs, toMs } = parseTimeRange(from, to);

				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				const query = `${filter} | ${sql}`;

				const res = await client.searchLog({
					TopicId: topicIds[0],
					Query: query,
					From: fromMs,
					To: toMs,
					UseNewAnalysis: true,
					SyntaxRule: 1,
				});

				const records: any[] = [];
				if (res.AnalysisRecords) {
					for (const record of res.AnalysisRecords) {
						try {
							records.push(JSON.parse(record));
						} catch {
							records.push(record);
						}
					}
				}

				return jsonResult({
					records,
					columns: res.Columns?.map((c) => c.Name),
				});
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);
}
