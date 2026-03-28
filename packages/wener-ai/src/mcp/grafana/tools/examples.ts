import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const ExampleCatalog = Object.freeze({
	prometheus: [
		'up',
		'rate(http_requests_total[5m])',
		'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
	],
	loki: ['{job="api"} |= "error"', 'sum by (level) (count_over_time({job="api"}[5m]))'],
	clickhouse: [
		'SELECT count(*) FROM logs',
		'SELECT service, count(*) FROM logs GROUP BY service ORDER BY count(*) DESC LIMIT 20',
	],
	elasticsearch: [
		'level:error AND service:api',
		'{"query":{"bool":{"filter":[{"range":{"@timestamp":{"gte":"now-1h"}}}]}}}',
	],
	cloudwatch: ['AWS/EC2 CPUUtilization Average', 'AWS/ApplicationELB RequestCount Sum'],
} as const);

const GetQueryExamplesInputSchema = z.object({
	datasourceType: z
		.enum(['prometheus', 'loki', 'clickhouse', 'elasticsearch', 'cloudwatch'])
		.describe('Datasource type'),
});

export function registerExampleTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_query_examples',
		{
			description: 'Get example queries for supported datasource types',
			inputSchema: GetQueryExamplesInputSchema,
			readOnly: true,
		},
		({ datasourceType }) => ({
			datasourceType,
			examples: ExampleCatalog[datasourceType],
		}),
	);
}
