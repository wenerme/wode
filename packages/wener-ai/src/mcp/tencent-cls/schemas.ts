import { z } from 'zod';

export const SearchInputSchema = z.object({
	topic: z
		.string()
		.describe('Topic ID or name. Can search multiple topics by providing comma-separated values or use topics array.'),
	topics: z.array(z.string()).optional().describe('Additional topic IDs/names to search (max 20 total)'),
	query: z.string().default('*').describe('CQL query. Examples: trace_id:"xxx", level:ERROR, status:>400'),
	from: z.string().optional().describe('Start time: -1h, -30m, now-1d, ISO8601. Default: -1h'),
	to: z.string().optional().describe('End time: now, -5m, ISO8601. Default: now'),
	limit: z.number().min(1).max(1000).default(100).describe('Max logs (1-1000)'),
	sort: z.enum(['asc', 'desc']).default('desc').describe('Time sort order'),
	format: z.enum(['json', 'toon']).default('json').describe('Output format: json (full) or toon (compact)'),
	context: z.string().optional().describe('Pagination cursor from previous search'),
});

export const DescribeTopicInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
});

export const ListTopicsInputSchema = z.object({
	filter: z.string().optional().describe('Filter by name (fuzzy match)'),
	limit: z.number().min(1).max(100).default(50).describe('Max results'),
});

export const HistogramInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
	query: z.string().default('*').describe('CQL query to filter logs'),
	from: z.string().optional().describe('Start time. Default: -1h'),
	to: z.string().optional().describe('End time. Default: now'),
	buckets: z.number().min(10).max(200).default(50).describe('Number of time buckets'),
});

export const FieldValuesInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
	field: z.string().describe('Field name to analyze'),
	query: z.string().default('*').describe('CQL query to filter logs'),
	from: z.string().optional().describe('Start time. Default: -1h'),
	to: z.string().optional().describe('End time. Default: now'),
	limit: z.number().min(1).max(100).default(20).describe('Max values to return'),
});

export const AnalyzeInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
	sql: z.string().describe('SQL query after |. Example: SELECT level, count(*) as c GROUP BY level'),
	from: z.string().optional().describe('Start time. Default: -1h'),
	to: z.string().optional().describe('End time. Default: now'),
	filter: z.string().default('*').describe('Pre-filter CQL query'),
});

export const ClusterLogsInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
	query: z.string().default('*').describe('CQL query to filter logs'),
	field: z.string().default('msg').describe('Field to cluster (default: msg)'),
	from: z.string().optional().describe('Start time. Default: -1h'),
	to: z.string().optional().describe('End time. Default: now'),
	limit: z.number().min(10).max(1000).default(500).describe('Number of logs to sample'),
	simTh: z.number().min(0.1).max(1).default(0.4).describe('Similarity threshold (0.1-1.0)'),
	maxClusters: z.number().min(10).max(500).default(100).describe('Maximum clusters to form'),
});

export const LogContextInputSchema = z.object({
	topic: z.string().describe('Topic ID or name'),
	time: z
		.string()
		.describe(
			'Log timestamp: ISO8601 (2026-01-14T15:30:45.123Z), milliseconds (1768405523000), or _time from search results',
		),
	pkgId: z.string().describe('Log package ID (_pkgId from search results)'),
	pkgLogId: z.union([z.string(), z.number()]).describe('Log sequence number (_pkgLogId from search results)'),
	prevLogs: z.number().min(0).max(100).default(10).describe('Number of preceding logs (max 100)'),
	nextLogs: z.number().min(0).max(100).default(10).describe('Number of following logs (max 100)'),
	query: z.string().optional().describe('Optional CQL filter for context logs'),
});
