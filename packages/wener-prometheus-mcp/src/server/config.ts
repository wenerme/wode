import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { z } from 'zod';

export const PrometheusConfigSchema = z
	.object({
		url: z
			.string()
			.url('Invalid Prometheus URL format. Please provide a valid URL (e.g., http://localhost:9090)')
			.transform((url) => url.replace(/\/$/, '')), // Remove trailing slash
		username: z.string().optional(),
		password: z.string().optional(),
		token: z.string().optional(),
		orgId: z.string().optional(),
		readonly: z.boolean().default(false),
	})
	.refine(
		(data) => {
			// Basic auth requires both username and password
			if (data.username && !data.password) return false;
			if (data.password && !data.username) return false;
			return true;
		},
		{
			message: 'Both PROMETHEUS_USERNAME and PROMETHEUS_PASSWORD are required for basic authentication',
		},
	)
	.strict();

export type PrometheusConfig = z.infer<typeof PrometheusConfigSchema>;

/**
 * Get Prometheus configuration from environment variables
 */
export function getPrometheusConfig({
	logger = consola.withTag('prometheus-config'),
}: {
	logger?: ConsolaInstance;
} = {}): PrometheusConfig {
	const url = process.env.PROMETHEUS_URL;

	if (!url) {
		throw new Error(
			'PROMETHEUS_URL environment variable is required. Please set it to your Prometheus server URL (e.g., http://localhost:9090)',
		);
	}

	const rawConfig = {
		url,
		username: process.env.PROMETHEUS_USERNAME,
		password: process.env.PROMETHEUS_PASSWORD,
		token: process.env.PROMETHEUS_TOKEN,
		orgId: process.env.ORG_ID,
		readonly: process.env.PROMETHEUS_READONLY === 'true' || process.env.PROMETHEUS_READONLY === '1',
	};

	// Parse and validate configuration using Zod schema
	const config = PrometheusConfigSchema.parse(rawConfig);

	// Warn if both token and basic auth are provided
	if (config.token && (config.username || config.password)) {
		logger.warn('Both token and basic auth credentials provided. Token authentication will be used.');
	}

	// Determine authentication method for logging
	let authMethod = 'none';
	if (config.username && config.password) {
		authMethod = 'basic_auth';
	} else if (config.token) {
		authMethod = 'bearer_token';
	}

	logger.info('Prometheus configuration loaded', {
		url: config.url,
		authentication: authMethod,
		orgId: config.orgId || 'none',
		readonly: config.readonly,
	});

	return config;
}
