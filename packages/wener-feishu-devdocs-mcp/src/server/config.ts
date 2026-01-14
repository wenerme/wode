import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { z } from 'zod';

const VALID_DOMAINS = ['https://open.feishu.cn', 'https://open.larksuite.com'];

export const FeishuDevDocsConfigSchema = z
	.object({
		domain: z
			.url()
			.default('https://open.feishu.cn')
			.transform((url) => url.replace(/\/$/, '')), // Remove trailing slash
		timeout: z
			.number()
			.int()
			.min(1000, 'Timeout must be at least 1000ms')
			.max(60000, 'Timeout must be at most 60000ms')
			.default(10000),
		maxResults: z
			.number()
			.int()
			.min(1, 'Max results must be at least 1')
			.max(20, 'Max results must be at most 20')
			.default(5),
		readonly: z.boolean().default(false),
		cache: z
			.object({
				enabled: z.boolean().default(true),
				ttl: z
					.number()
					.int()
					.min(0)
					.default(24 * 60 * 60 * 1000), // 24 hours
				cacheDir: z.string().optional(),
			})
			.optional(),
	})
	.strict();

export type FeishuDevDocsConfig = z.infer<typeof FeishuDevDocsConfigSchema>;

/**
 * Get Feishu DevDocs configuration from environment variables
 * Uses unified FEISHU_* environment variables for consistency
 */
export function getFeishuDevDocsConfig({
	logger = consola,
}: {
	logger?: ConsolaInstance;
} = {}): FeishuDevDocsConfig {
	const rawConfig = {
		domain: process.env.FEISHU_DOMAIN,
		timeout: process.env.FEISHU_TIMEOUT ? parseInt(process.env.FEISHU_TIMEOUT, 10) : undefined,
		maxResults: process.env.FEISHU_DEVDOCS_MAX_RESULTS ? parseInt(process.env.FEISHU_DEVDOCS_MAX_RESULTS, 10) : undefined,
		readonly: process.env.FEISHU_READONLY === 'true' ? true : undefined,
		cache: {
			enabled: process.env.FEISHU_CACHE_ENABLED !== 'false', // Default to true
			ttl: process.env.FEISHU_CACHE_TTL ? parseInt(process.env.FEISHU_CACHE_TTL, 10) : undefined,
			cacheDir: process.env.FEISHU_CACHE_DIR,
		},
	};

	// Parse and validate configuration using Zod schema
	const config = FeishuDevDocsConfigSchema.parse(rawConfig);

	// Warn about non-standard domains
	if (!VALID_DOMAINS.includes(config.domain)) {
		logger.warn('Using non-standard domain', {
			domain: config.domain,
			validDomains: VALID_DOMAINS,
		});
	}

	logger.info('Feishu DevDocs configuration loaded', {
		domain: config.domain,
		timeout: config.timeout,
		maxResults: config.maxResults,
		readonly: config.readonly,
		cache: config.cache,
	});

	return config;
}

/**
 * Validate Feishu DevDocs configuration
 */
export function validateFeishuDevDocsConfig(config: FeishuDevDocsConfig): void {
	if (!config.domain) {
		throw new Error('Domain is required');
	}

	// Ensure domain doesn't end with slash for consistency
	if (config.domain.endsWith('/')) {
		config.domain = config.domain.slice(0, -1);
	}

	if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
		throw new Error('Timeout must be between 1000ms and 60000ms');
	}

	if (config.maxResults && (config.maxResults < 1 || config.maxResults > 20)) {
		throw new Error('Max results must be between 1 and 20');
	}

	// Validate cache configuration
	if (config.cache?.ttl && config.cache.ttl < 0) {
		throw new Error('Cache TTL must be a positive number');
	}
}
