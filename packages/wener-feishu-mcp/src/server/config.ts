import { FeishuDomains, type FeishuOAuthConfig } from 'common/feishu';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { z } from 'zod';

const VALID_DOMAINS: string[] = [FeishuDomains.China, FeishuDomains.Intl];

export const FeishuMcpConfigSchema = z
	.object({
		appId: z.string().min(1, 'App ID is required').startsWith('cli_', 'App ID should start with "cli_"'),
		appSecret: z.string().min(1, 'App Secret is required'),
		domain: z
			.string()
			.url('Invalid domain URL')
			.default(FeishuDomains.China)
			.transform((url) => url.replace(/\/$/, '')), // Remove trailing slash
		timeout: z
			.number()
			.int()
			.min(1000, 'Timeout must be at least 1000ms')
			.max(60000, 'Timeout must be at most 60000ms')
			.default(10000),
		readonly: z.boolean().default(false),
		oauth: z
			.object({
				redirectUri: z.string().url('Invalid redirect URI').default('http://localhost:3000/callback'),
				scopes: z.array(z.string()).default(['docx:document', 'drive:drive', 'contact:user.id:readonly']),
				autoRefresh: z.boolean().default(true),
			})
			.optional(),
	})
	.strict();

export type FeishuMcpConfig = z.infer<typeof FeishuMcpConfigSchema>;

/**
 * Get Feishu MCP configuration from environment variables
 */
export function getFeishuMcpConfig({
	logger = consola.withTag('feishu-mcp-config'),
}: {
	logger?: ConsolaInstance;
} = {}): FeishuMcpConfig {
	const appId = process.env.FEISHU_APP_ID;
	const appSecret = process.env.FEISHU_APP_SECRET;

	if (!appId || !appSecret) {
		throw new Error(
			'FEISHU_APP_ID and FEISHU_APP_SECRET environment variables are required. '
				+ 'Please set them to your Feishu application credentials.',
		);
	}

	const rawConfig = {
		appId,
		appSecret,
		domain: process.env.FEISHU_DOMAIN,
		timeout: process.env.FEISHU_TIMEOUT ? parseInt(process.env.FEISHU_TIMEOUT) : undefined,
		readonly: process.env.FEISHU_READONLY === 'true' || process.env.FEISHU_READONLY === '1',
		oauth: {
			redirectUri: process.env.FEISHU_REDIRECT_URI,
			scopes: process.env.FEISHU_SCOPES ? process.env.FEISHU_SCOPES.split(',').map((s) => s.trim()) : undefined,
			autoRefresh: process.env.FEISHU_AUTO_REFRESH !== 'false',
		},
	};

	// Parse and validate configuration using Zod schema
	const config = FeishuMcpConfigSchema.parse(rawConfig);

	// Warn about non-standard domains
	if (!VALID_DOMAINS.includes(config.domain)) {
		logger.warn('Using non-standard domain', {
			domain: config.domain,
			validDomains: VALID_DOMAINS,
		});
	}

	// Warn if no OAuth scopes configured
	if (config.oauth && config.oauth.scopes.length === 0) {
		logger.warn('No OAuth scopes configured. This may limit functionality.');
	}

	logger.info('Feishu MCP configuration loaded', {
		appId: config.appId.substring(0, 8) + '...',
		domain: config.domain,
		timeout: config.timeout,
		readonly: config.readonly,
		oauth: config.oauth
			? {
					redirectUri: config.oauth.redirectUri,
					scopes: config.oauth.scopes,
					autoRefresh: config.oauth.autoRefresh,
				}
			: undefined,
	});

	return config;
}

/**
 * Create OAuth configuration from MCP config
 */
export function createOAuthConfig(config: FeishuMcpConfig): FeishuOAuthConfig {
	if (!config.oauth) {
		throw new Error('OAuth configuration not available');
	}

	return {
		appId: config.appId,
		appSecret: config.appSecret,
		redirectUri: config.oauth.redirectUri || 'http://localhost:3000/callback',
		scopes: config.oauth.scopes || [],
		domain: config.domain,
	};
}
