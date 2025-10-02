import { setContractHandler } from 'common/mcp';
import { runMcpServerCommand } from 'common/mcp/server';
import { createPrometheusServiceImpl } from './prometheus/createPrometheusServiceImpl';
import { PrometheusServiceContract } from './prometheus/PrometheusServiceContract';
import { getPrometheusConfig } from './server/config';

const AppInfo = {
	name: process.env.PACKAGE_NAME || 'wener-prometheus-mcp',
	version: process.env.PACKAGE_VERSION || '1.0.0',
};

await runMcpServerCommand({
	name: AppInfo.name,
	transport: 'stdio',
	port: 3001,
	onServer: async (config) => {
		const { logger, server } = config;
		// Initialize Prometheus configuration
		const prometheusConfig = getPrometheusConfig({ logger });

		logger.info(`Connecting to Prometheus: ${prometheusConfig.url}`);

		setContractHandler(server, {
			contract: PrometheusServiceContract,
			impl: createPrometheusServiceImpl({
				config: prometheusConfig,
				logger,
			}),
		});
	},
});
