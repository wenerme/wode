
import { oc, } from '@orpc/contract';
import { McpMetaKey } from 'common/mcp';
import { z } from 'zod/v4';

/**
 * Prometheus Tools ORPC Contract
 * Defines the interface for Prometheus query and metrics exploration tools in MCP servers
 */

// Input schemas
const PrometheusQueryInputSchema = z.object({
	query: z.string().min(1).describe('The PromQL query to execute'),
	time: z.string().optional().describe('Evaluation timestamp (RFC3339 or Unix timestamp). Default: current time'),
	timeout: z.string().optional().describe('Evaluation timeout (e.g., "30s")'),
});

const PrometheusRangeQueryInputSchema = z.object({
	query: z.string().min(1).describe('The PromQL query to execute'),
	start: z.string().describe('Start timestamp (RFC3339 or Unix timestamp)'),
	end: z.string().describe('End timestamp (RFC3339 or Unix timestamp)'),
	step: z.string().describe('Query resolution step width (e.g., "15s", "1m", "1h")'),
	timeout: z.string().optional().describe('Evaluation timeout (e.g., "30s")'),
});

const MetricMetadataInputSchema = z.object({
	metric: z
		.string()
		.optional()
		.describe('Specific metric name to get metadata for. If not provided, returns metadata for all metrics'),
});

// Output schemas
const PrometheusQueryResultSchema = z.object({
	resultType: z.enum(['matrix', 'vector', 'scalar', 'string']).describe('Type of query result'),
	result: z.array(z.any()).describe('Query result data'),
});

const MetricsListSchema = z.object({
	metrics: z.array(z.string()).describe('List of available metric names'),
});

const MetricMetadataSchema = z.object({
	metadata: z
		.record(
			z.string(),
			z.array(
				z.object({
					type: z.string().describe('Metric type (gauge, counter, histogram, summary)'),
					help: z.string().describe('Metric description'),
					unit: z.string().optional().describe('Metric unit'),
				}),
			),
		)
		.describe('Metric metadata grouped by metric name'),
});

const TargetsSchema = z.object({
	activeTargets: z
		.array(
			z.object({
				discoveredLabels: z.record(z.string(), z.string()).describe('Labels discovered during service discovery'),
				labels: z.record(z.string(), z.string()).describe('Final target labels after relabeling'),
				scrapePool: z.string().describe('Name of the scrape pool'),
				scrapeUrl: z.string().describe('URL being scraped'),
				globalUrl: z.string().describe('Global URL for this target'),
				lastError: z.string().describe('Last scrape error message'),
				lastScrape: z.string().describe('Timestamp of last scrape'),
				lastScrapeDuration: z.number().describe('Duration of last scrape in seconds'),
				health: z.enum(['up', 'down', 'unknown']).describe('Target health status'),
				scrapeInterval: z.string().describe('Scrape interval for this target'),
				scrapeTimeout: z.string().describe('Scrape timeout for this target'),
			}),
		)
		.describe('Active scrape targets'),
	droppedTargets: z
		.array(
			z.object({
				discoveredLabels: z.record(z.string(), z.string()).describe('Labels discovered during service discovery'),
			}),
		)
		.describe('Dropped scrape targets'),
});

const HealthCheckSchema = z.object({
	status: z.enum(['healthy', 'unhealthy', 'degraded']).describe('Health status'),
	service: z.string().describe('Service name'),
	version: z.string().optional().describe('Service version'),
	timestamp: z.string().describe('Health check timestamp'),
	prometheus_connectivity: z.enum(['healthy', 'unhealthy']).optional().describe('Prometheus connectivity status'),
	prometheus_url: z.string().optional().describe('Prometheus server URL'),
	prometheus_error: z.string().optional().describe('Prometheus connection error'),
	error: z.string().optional().describe('General error message'),
	configuration: z
		.object({
			prometheus_url_configured: z.boolean().describe('Whether Prometheus URL is configured'),
			authentication_configured: z.boolean().describe('Whether authentication is configured'),
			org_id_configured: z.boolean().describe('Whether organization ID is configured'),
		})
		.optional()
		.describe('Configuration status'),
});

export const PrometheusServiceContract = {
	// Health check tool
	healthCheck: oc
		.input(z.object({}))
		.output(HealthCheckSchema)
		.route({
			description: 'Health check endpoint for container monitoring and Prometheus connectivity verification',
			tags: ['prometheus', 'health', 'monitoring'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	// Query execution tools
	executeQuery: oc
		.input(PrometheusQueryInputSchema)
		.output(PrometheusQueryResultSchema)
		.route({
			description: 'Execute a PromQL instant query against Prometheus',
			tags: ['prometheus', 'query', 'instant'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	executeRangeQuery: oc
		.input(PrometheusRangeQueryInputSchema)
		.output(PrometheusQueryResultSchema)
		.route({
			description: 'Execute a PromQL range query with start time, end time, and step interval',
			tags: ['prometheus', 'query', 'range'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	// Discovery tools
	listMetrics: oc
		.input(z.object({}))
		.output(MetricsListSchema)
		.route({
			description: 'List all available metrics in Prometheus',
			tags: ['prometheus', 'metrics', 'discovery'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	getMetricMetadata: oc
		.input(MetricMetadataInputSchema)
		.output(MetricMetadataSchema)
		.route({
			description: 'Get metadata for specific metrics including type, description, and unit information',
			tags: ['prometheus', 'metadata', 'discovery'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	getTargets: oc
		.input(z.object({}))
		.output(TargetsSchema)
		.route({
			description: 'Get information about all Prometheus scrape targets including health status',
			tags: ['prometheus', 'targets', 'monitoring'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),
};
