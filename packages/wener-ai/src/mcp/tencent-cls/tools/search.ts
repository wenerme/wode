import type { DescribeLogContextRequest, SearchLogRequest } from '@wener/client/tencent/cls';
import { Drain } from '@wener/common/drain3';
import { ClusterLogsInputSchema, LogContextInputSchema, SearchInputSchema } from '../schemas';
import type { TencentClsContext } from '../server';
import { formatBTime, parseTimeRange, toToon } from '../utils';

export function registerSearchTools(ctx: TencentClsContext) {
	const { server, getClient, textResult, jsonResult } = ctx;

	server.registerTool(
		'search',
		{
			description:
				'Search logs in CLS topic(s). Supports CQL syntax. **MUST** read resource "search-guide" for syntax help.',
			inputSchema: SearchInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, topics, query, from, to, limit, sort, format, context }) => {
			try {
				const client = getClient();
				const { fromMs, toMs } = parseTimeRange(from, to);

				// Resolve topics - support comma-separated in single topic param
				const inputTopics = [
					...topic
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean),
					...(topics || []),
				].filter(Boolean);

				if (!inputTopics.length) {
					return textResult('Error: At least one topic is required');
				}

				const topicIds = await client.resolveTopicIds(inputTopics);
				if (!topicIds.length) {
					return textResult(`Error: No valid topics found for: ${inputTopics.join(', ')}`);
				}

				const req: SearchLogRequest = {
					Query: query || '*',
					From: fromMs,
					To: toMs,
					Limit: limit,
					Sort: sort,
					SyntaxRule: 1, // CQL
					UseNewAnalysis: true,
				};

				// Handle single vs multi topic
				if (topicIds.length === 1) {
					req.TopicId = topicIds[0];
					if (context) req.Context = context;
				} else {
					const contexts = (context || '').split('#').filter(Boolean);
					req.Topics = topicIds.map((id, i) => ({
						TopicId: id,
						Context: contexts[i] || undefined,
					}));
				}

				const res = await client.searchLog(req);

				// Check if this is an SQL analysis query (contains |)
				const isAnalysisQuery = query?.includes('|');

				// If SQL analysis query, return AnalysisRecords directly
				if (isAnalysisQuery) {
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
						count: records.length,
						analysis: true,
						columns: res.Columns?.map((c) => c.Name),
						records,
						samplingRate: res.SamplingRate,
						requestId: res.RequestId,
					});
				}

				// Extract common fields for deduplication
				const commonFields: Record<string, any> = {};
				const logs: any[] = [];

				for (const r of res.Results || []) {
					let logData: Record<string, any> = {};
					if (r.LogJson) {
						try {
							logData = JSON.parse(r.LogJson);
							// Remove empty string fields
							for (const [key, value] of Object.entries(logData)) {
								if (value === '') {
									delete logData[key];
								}
							}
						} catch {
							logData = { _raw: r.LogJson };
						}
					}

					// Add metadata fields for context lookup
					if (r.Time) logData._time = new Date(r.Time).toISOString();
					if (r.TopicName) logData._topic = r.TopicName;
					if (r.PkgId) logData._pkgId = r.PkgId;
					if (r.PkgLogId) logData._pkgLogId = r.PkgLogId;

					logs.push(logData);
				}

				// Find common fields (appear in all logs with same value)
				if (logs.length > 1) {
					const firstLog = logs[0];
					for (const [key, value] of Object.entries(firstLog)) {
						if (key.startsWith('_')) continue;
						const isCommon = logs.every((log) => JSON.stringify(log[key]) === JSON.stringify(value));
						if (isCommon && value !== undefined && value !== null) {
							commonFields[key] = value;
						}
					}
					// Remove common fields from individual logs
					if (Object.keys(commonFields).length > 0) {
						for (const log of logs) {
							for (const key of Object.keys(commonFields)) {
								delete log[key];
							}
						}
					}
				}

				// Build next cursor for pagination
				let nextCursor: string | undefined;
				if (res.Context) {
					nextCursor = res.Context;
				} else if (res.Topics?.Infos?.some((v) => v.Context)) {
					nextCursor = res.Topics.Infos.toSorted((a, b) => a.TopicId.localeCompare(b.TopicId))
						.map((v) => v.Context || '')
						.join('#');
				}

				const result = {
					count: logs.length,
					listOver: res.ListOver,
					cursor: nextCursor,
					common: Object.keys(commonFields).length > 0 ? commonFields : undefined,
					logs,
				};

				if (format === 'toon') {
					return textResult(toToon(result));
				}

				return jsonResult(result);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	server.registerTool(
		'cluster_logs',
		{
			description:
				'Cluster log messages using Drain3 algorithm. Finds common patterns in logs and groups similar messages together. Useful for discovering error patterns.',
			inputSchema: ClusterLogsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, query, field, from, to, limit, simTh, maxClusters }) => {
			try {
				const client = getClient();
				const { fromMs, toMs } = parseTimeRange(from, to);

				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				// Fetch logs using same request structure as search tool
				const req: SearchLogRequest = {
					Query: query || '*',
					From: fromMs,
					To: toMs,
					Limit: limit,
					Sort: 'desc',
					SyntaxRule: 1,
					UseNewAnalysis: true,
				};

				// Handle single vs multi topic (same as search tool)
				if (topicIds.length === 1) {
					req.TopicId = topicIds[0];
				} else {
					req.Topics = topicIds.map((id) => ({ TopicId: id }));
				}

				const res = await client.searchLog(req);

				if (!res.Results?.length) {
					return textResult(
						`No logs found matching the query.\n\nDebug:\n- Topics: ${topicIds.join(', ')}\n- Query: ${query}\n- From: ${new Date(fromMs).toISOString()}\n- To: ${new Date(toMs).toISOString()}`,
					);
				}

				// Initialize Drain
				const drain = new Drain({
					simTh,
					maxClusters,
					logClusterDepth: 4,
					extraDelimiters: ['=', ':', ',', '(', ')', '[', ']', '{', '}'],
				});

				// Process logs from Results
				const processedLogs: string[] = [];
				for (const r of res.Results) {
					if (!r.LogJson) continue;
					try {
						const logData = JSON.parse(r.LogJson);
						let content = logData[field];
						if (!content || typeof content !== 'string') {
							content = logData.error || logData.message || logData.msg || logData.reason;
						}
						if (!content || typeof content !== 'string') {
							const { __TAG__, ...rest } = logData;
							if (Object.keys(rest).length > 0) {
								content = JSON.stringify(rest);
							}
						}
						if (content && typeof content === 'string' && content.trim()) {
							processedLogs.push(content);
							drain.addLogMessage(content);
						}
					} catch {}
				}

				if (!processedLogs.length) {
					return textResult(`Found ${res.Results.length} logs but no valid content in field "${field}".`);
				}

				// Get clusters sorted by size
				const clusters = drain.getClusters();
				clusters.sort((a, b) => b.size - a.size);

				// Format output
				const result = {
					totalLogs: processedLogs.length,
					clusterCount: clusters.length,
					clusters: clusters.slice(0, 50).map((c) => ({
						id: c.clusterId,
						count: c.size,
						template: c.getTemplate(),
						// Get a sample log for this cluster
						sample: processedLogs.find((log) => drain.match(log) === c),
					})),
				};

				return jsonResult(result);
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);

	server.registerTool(
		'log_context',
		{
			description:
				'Get surrounding context logs for a specific log entry. Useful for debugging by viewing logs before and after a particular event. Use _pkgId and _pkgLogId from search results.',
			inputSchema: LogContextInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ topic, time, pkgId, pkgLogId, prevLogs, nextLogs, query }) => {
			try {
				const client = getClient();

				const topicIds = await client.resolveTopicIds([topic]);
				if (!topicIds.length) {
					return textResult(`Error: Topic not found: ${topic}`);
				}

				// Convert time to BTime format: YYYY-mm-dd HH:MM:SS.FFF (UTC+8)
				const btime = formatBTime(time);

				const req: DescribeLogContextRequest = {
					TopicId: topicIds[0],
					BTime: btime,
					PkgId: pkgId,
					PkgLogId: typeof pkgLogId === 'string' ? parseInt(pkgLogId, 10) : pkgLogId,
					PrevLogs: prevLogs,
					NextLogs: nextLogs,
				};

				if (query) req.Query = query;

				const res = await client.describeLogContext(req);

				// Parse and format the context logs
				const logs = res.LogContextInfos.map((info) => {
					let content: any;
					try {
						content = JSON.parse(info.Content);
						// Remove empty string fields
						for (const [key, value] of Object.entries(content)) {
							if (value === '') {
								delete content[key];
							}
						}
					} catch {
						content = { _raw: info.Content };
					}
					return {
						_time: new Date(info.BTime).toISOString(),
						_pkgId: info.PkgId,
						_pkgLogId: info.PkgLogId,
						...content,
					};
				});

				return jsonResult({
					count: logs.length,
					prevOver: res.PrevOver,
					nextOver: res.NextOver,
					logs,
				});
			} catch (e) {
				return textResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
			}
		},
	);
}
