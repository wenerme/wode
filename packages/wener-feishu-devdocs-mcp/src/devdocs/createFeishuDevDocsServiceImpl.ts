import consola from 'consola';
import type { FeishuDevDocsConfig } from '../server/config';
import { FeishuDevDocsClient } from './feishu-devdocs-client';

const logger = consola.withTag('feishu-devdocs-service');

export interface FeishuDevDocsServiceOptions {
	config: FeishuDevDocsConfig;
}

/**
 * Create Feishu Developer Documentation service implementation
 * that follows the DevDocsServiceContract
 */
export function createFeishuDevDocsServiceImpl({ config }: FeishuDevDocsServiceOptions) {
	const client = new FeishuDevDocsClient(config);

	// Initialize client on first use
	let initialized = false;
	const ensureInitialized = async () => {
		if (!initialized) {
			await client.init();
			initialized = true;
		}
	};

	return {
		async healthCheck() {
			await ensureInitialized();
			try {
				const healthStatus = {
					status: 'healthy' as const,
					service: 'feishu-devdocs-mcp-server',
					version: '1.0.0',
					timestamp: new Date().toISOString(),
					domain: config.domain,
				};

				// Test API connectivity
				try {
					const connectivityTest = await client.healthCheck();
					if (connectivityTest.healthy) {
						return {
							...healthStatus,
							connectivity: 'healthy' as const,
						};
					} else {
						return {
							...healthStatus,
							status: 'unhealthy' as const,
							connectivity: 'unhealthy' as const,
							error: connectivityTest.error,
						};
					}
				} catch (error) {
					return {
						...healthStatus,
						status: 'unhealthy' as const,
						connectivity: 'unhealthy' as const,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			} catch (error) {
				logger.error('Health check failed', {
					error: error instanceof Error ? error.message : String(error)
				});
				return {
					status: 'unhealthy' as const,
					service: 'feishu-devdocs-mcp-server',
					version: '1.0.0',
					timestamp: new Date().toISOString(),
					domain: config.domain,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},

		async recallDeveloperDocuments({ query }: { query: string }) {
			await ensureInitialized();
			try {
				logger.info('Searching developer documentation', { query });

				const result = await client.recallDeveloperDocuments(query);

				if (!result.success) {
					throw new Error(result.error || 'Search failed');
				}

				logger.info('Developer documentation search completed', {
					query,
					resultCount: result.results.length
				});

				return {
					results: result.results,
					query,
					resultCount: result.results.length,
				};
			} catch (error) {
				logger.error('Developer documentation search failed', {
					query,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		},
	};
}