import { implement } from '@orpc/server';
import { setContractHandler } from 'common/mcp';
import { runMcpServerCommand } from 'common/mcp/server';
import { type ConsolaInstance, consola } from 'consola';
import { FeishuDevDocsServiceContract } from './devdocs';
import { FeishuDevDocsClient } from './devdocs/feishu-devdocs-client';
import { type FeishuDevDocsConfig, getFeishuDevDocsConfig } from './server/config';

const AppInfo = {
	name: process.env.PACKAGE_NAME || 'wener-feishu-devdocs',
	version: process.env.PACKAGE_VERSION || '1.0.0',
};

await runMcpServerCommand({
	name: AppInfo.name,
	transport: 'stdio',
	port: 3000,
	onServer: async (config) => {
		const { logger, server } = config;
		// Initialize Feishu DevDocs configuration
		const devDocsConfig = getFeishuDevDocsConfig({ logger });

		logger.info(`Connecting to Feishu DevDocs API: ${devDocsConfig.domain}`);

		setContractHandler(server, {
			contract: FeishuDevDocsServiceContract,
			impl: createFeishuDevDocsServiceContractImpl(devDocsConfig, {
				logger,
			}),
		});
	},
});

function createFeishuDevDocsServiceContractImpl(
	conf: FeishuDevDocsConfig,
	{
		logger = consola,
	}: {
		logger?: ConsolaInstance;
	},
) {
	const os = implement(FeishuDevDocsServiceContract);
	const client = new FeishuDevDocsClient(conf);

	return {
		health: os.health.handler(async () => {
			try {
				const connectivityTest = await client.healthCheck();
				return {
					status: connectivityTest.healthy ? 'healthy' : 'unhealthy',
					service: AppInfo.name,
					version: AppInfo.version,
					timestamp: new Date().toISOString(),
					domain: conf.domain,
					connectivity: connectivityTest.healthy ? 'healthy' : 'unhealthy',
					error: connectivityTest.error,
				};
			} catch (error) {
				return {
					status: 'unhealthy',
					service: AppInfo.name,
					version: AppInfo.version,
					timestamp: new Date().toISOString(),
					domain: conf.domain,
					connectivity: 'unhealthy',
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}),

		recallDeveloperDocuments: os.recallDeveloperDocuments.handler(async ({ input }) => {
			logger.info('Searching developer documentation', { query: input.query });

			const result = await client.recallDeveloperDocuments(input.query);

			if (!result.success) {
				throw new Error(result.error || 'Search failed');
			}

			return {
				results: result.results,
				query: input.query,
				resultCount: result.results.length,
			};
		}),
	};
}
