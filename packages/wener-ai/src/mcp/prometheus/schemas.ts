import { z } from 'zod';

/** Time format description for consistent documentation */
export const TimeDescription = `Supported formats: RFC3339 (2024-01-15T10:30:00Z), Unix timestamp (1705316400), Relative (now, now-1h, now-30m)`;

export const QueryInputSchema = z.object({
	expr: z.string().describe('PromQL expression. Examples: up, rate(http_requests_total[5m]), sum by (job) (up)'),
	time: z.string().nullable().optional().describe(`Evaluation timestamp for instant query. ${TimeDescription}`),
	startTime: z.string().nullable().optional().describe(`Start time for range query. ${TimeDescription}`),
	endTime: z.string().nullable().optional().describe(`End time for range query. Default: now. ${TimeDescription}`),
	step: z
		.string()
		.nullable()
		.optional()
		.describe('Resolution step for range query. Examples: 15s, 1m, 5m, 1h. Default: auto-calculated'),
});

export const GetSeriesInputSchema = z.object({
	match: z
		.array(z.string())
		.nullable()
		.optional()
		.describe('Label matchers. Examples: ["up", "http_requests_total{job=\\"api\\"}"]'),
	startTime: z.string().nullable().optional().describe(`Start time. ${TimeDescription}`),
	endTime: z.string().nullable().optional().describe(`End time. ${TimeDescription}`),
	limit: z.number().nullable().optional().describe('Max number of series to return'),
});

export const GetLabelsInputSchema = z.object({
	match: z.array(z.string()).nullable().optional().describe('Optional label matchers to filter labels'),
	startTime: z.string().nullable().optional().describe(`Start time. ${TimeDescription}`),
	endTime: z.string().nullable().optional().describe(`End time. ${TimeDescription}`),
	limit: z.number().nullable().optional().describe('Max number of labels to return'),
});

export const GetLabelValuesInputSchema = z.object({
	name: z.string().describe('Label name. Common labels: job, instance, namespace, pod'),
	match: z.array(z.string()).nullable().optional().describe('Optional matchers to filter values'),
	startTime: z.string().nullable().optional().describe(`Start time. ${TimeDescription}`),
	endTime: z.string().nullable().optional().describe(`End time. ${TimeDescription}`),
	limit: z.number().nullable().optional().describe('Max number of values to return'),
});
