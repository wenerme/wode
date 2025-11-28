import { implement } from '@orpc/server';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import type { PrometheusConfig } from '../server/config';
import { PrometheusClient } from './prometheus-client';
import { PrometheusServiceContract } from './PrometheusServiceContract';

export interface PrometheusServiceOptions {
	config: PrometheusConfig;
	logger?: ConsolaInstance;
}

/**
 * Create Prometheus service implementation that follows the PrometheusServiceContract
 */
export function createPrometheusServiceImpl({
	config,
	logger = consola.withTag('prometheus'),
}: PrometheusServiceOptions) {
	const os = implement(PrometheusServiceContract);
	const client = new PrometheusClient(config);

	return {
		healthCheck: os.healthCheck.handler(async () => {
			try {
				const healthStatus = {
					status: 'healthy' as const,
					service: 'prometheus-mcp-server',
					version: '1.0.0',
					timestamp: new Date().toISOString(),
					configuration: {
						prometheus_url_configured: Boolean(config.url),
						authentication_configured: Boolean(config.username || config.token),
						org_id_configured: Boolean(config.orgId),
					},
				};

				// Test Prometheus connectivity
				try {
					const connectivityTest = await client.healthCheck();
					if (connectivityTest.healthy) {
						return {
							...healthStatus,
							prometheus_connectivity: 'healthy' as const,
							prometheus_url: config.url,
						};
					} else {
						return {
							...healthStatus,
							status: 'degraded' as const,
							prometheus_connectivity: 'unhealthy' as const,
							prometheus_error: connectivityTest.error,
						};
					}
				} catch (error) {
					return {
						...healthStatus,
						status: 'degraded' as const,
						prometheus_connectivity: 'unhealthy' as const,
						prometheus_error: error instanceof Error ? error.message : String(error),
					};
				}
			} catch (error) {
				logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
				return {
					status: 'unhealthy' as const,
					service: 'prometheus-mcp-server',
					error: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				};
			}
		}),

		executeQuery: os.executeQuery.handler(async ({ input }) => {
			logger.info('Executing instant query', { query: input.query, time: input.time });

			const result = await client.query(input.query, {
				time: input.time,
				timeout: input.timeout,
			});

			return {
				resultType: result.resultType,
				result: result.result,
			};
		}),

		executeRangeQuery: os.executeRangeQuery.handler(async ({ input }) => {
			logger.info('Executing range query', {
				query: input.query,
				start: input.start,
				end: input.end,
				step: input.step,
			});

			const result = await client.queryRange(input.query, input.start, input.end, input.step, {
				timeout: input.timeout,
			});

			return {
				resultType: result.resultType,
				result: result.result,
			};
		}),

		listMetrics: os.listMetrics.handler(async () => {
			logger.info('Listing available metrics');

			const metrics = await client.listMetrics();

			return {
				metrics,
			};
		}),

		getMetricMetadata: os.getMetricMetadata.handler(async ({ input }) => {
			logger.info('Retrieving metric metadata', { metric: input.metric });

			const metadata = await client.getMetricMetadata(input.metric);

			return {
				metadata,
			};
		}),

		getTargets: os.getTargets.handler(async () => {
			logger.info('Retrieving scrape targets information');

			const targets = await client.getTargets();

			return {
				activeTargets: targets.activeTargets,
				droppedTargets: targets.droppedTargets,
			};
		}),
	};
}
