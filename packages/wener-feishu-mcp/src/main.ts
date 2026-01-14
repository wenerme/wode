#!/usr/bin/env node
import { FeishuAuth } from 'common/feishu';
import { setContractHandler } from 'common/mcp';
import { runMcpServerCommand } from 'common/mcp/server';
import consola from 'consola';
import { FeishuOAuthServer } from './auth/oauth-server';
import { FeishuTokenStorage } from './auth/token-storage';
import { createFeishuDocumentServiceImpl } from './feishu/createFeishuDocumentServiceImpl';
import { FeishuDocsClient } from './feishu/feishu-docs-client';
import { FeishuDocumentServiceContract } from './feishu/FeishuDocumentServiceContract';
import { createOAuthConfig, getFeishuMcpConfig } from './server/config';

const logger = consola.withTag('feishu-mcp');

runMcpServerCommand({
	transport: 'stdio',
	port: 3000,
	onProgram: async (program) => {
		// Login command
		program
			.command('login')
			.description('Login to Feishu/Lark using OAuth')
			.option('-p, --port <port>', 'OAuth callback server port', '3000')
			.option('--no-open', 'Do not automatically open browser')
			.action(async (_options) => {
				try {
					const config = getFeishuMcpConfig();
					const oauthConfig = createOAuthConfig(config);
					const tokenStorage = new FeishuTokenStorage();
					const oauthServer = new FeishuOAuthServer(oauthConfig);

					logger.info('Starting OAuth login process...');

					const result = await oauthServer.startOAuthFlow();

					if (result.success && result.accessToken) {
						// Store the tokens
						await tokenStorage.storeTokens(config.appId, {
							userAccessToken: result.accessToken,
							refreshToken: result.refreshToken,
						});

						logger.success('Successfully logged in to Feishu/Lark!');
						logger.info('You can now start the MCP server with: feishu-mcp start');
					} else {
						logger.error('OAuth login failed:', result.error);
						process.exit(1);
					}
				} catch (error) {
					logger.error('Login failed', {
						error: error instanceof Error ? error.message : String(error),
					});
					process.exit(1);
				}
			});

		// Logout command
		program
			.command('logout')
			.description('Logout and clear stored tokens')
			.action(async () => {
				try {
					const config = getFeishuMcpConfig();
					const tokenStorage = new FeishuTokenStorage();

					await tokenStorage.deleteTokens(config.appId);
					logger.success('Successfully logged out. All tokens have been cleared.');
				} catch (error) {
					logger.error('Logout failed', {
						error: error instanceof Error ? error.message : String(error),
					});
					process.exit(1);
				}
			});

		// Status command
		program
			.command('status')
			.description('Check authentication status')
			.action(async () => {
				try {
					const config = getFeishuMcpConfig();
					const tokenStorage = new FeishuTokenStorage();

					const tokenInfo = await tokenStorage.getTokenInfo(config.appId);

					if (tokenInfo?.hasTokens) {
						logger.info('Authentication Status:', {
							authenticated: true,
							isExpired: tokenInfo.isExpired,
							expiresAt: tokenInfo.expiresAt?.toISOString() || 'Unknown',
							hasRefreshToken: tokenInfo.hasRefreshToken,
							domain: config.domain,
						});
					} else {
						logger.info('Authentication Status:', {
							authenticated: false,
							message: 'No valid tokens found. Please run: feishu-mcp login',
						});
					}
				} catch (error) {
					logger.error('Failed to check status', {
						error: error instanceof Error ? error.message : String(error),
					});
					process.exit(1);
				}
			});

		// Config command
		program
			.command('config')
			.description('Show current configuration')
			.action(() => {
				try {
					const config = getFeishuMcpConfig();

					logger.info('Feishu MCP Configuration:', {
						appId: `${config.appId.substring(0, 8)}...`,
						domain: config.domain,
						timeout: config.timeout,
						readonly: config.readonly,
						oauth: {
							redirectUri: config.oauth?.redirectUri,
							scopes: config.oauth?.scopes,
							autoRefresh: config.oauth?.autoRefresh,
						},
					});
				} catch (error) {
					logger.error('Failed to load configuration', {
						error: error instanceof Error ? error.message : String(error),
					});
					process.exit(1);
				}
			});
	},
	onServer: async (config) => {
		const { logger, server } = config;

		// Initialize Feishu MCP configuration
		const mcpConfig = getFeishuMcpConfig({ logger });
		const tokenStorage = new FeishuTokenStorage();

		// Check if we have stored tokens
		const hasTokens = await tokenStorage.hasTokens(mcpConfig.appId);
		if (!hasTokens) {
			throw new Error('No valid authentication tokens found. Please run OAuth login first:\nfeishu-mcp login');
		}

		// Get stored tokens
		const tokens = await tokenStorage.getTokens(mcpConfig.appId);
		if (!tokens) {
			throw new Error('Failed to retrieve stored tokens');
		}

		// Initialize authentication
		const auth = new FeishuAuth(mcpConfig);
		await auth.setTokens(tokens);

		// Initialize document client
		const docsClient = new FeishuDocsClient(mcpConfig, auth);

		// Test connection
		const connectionOk = await docsClient.testConnection();
		if (!connectionOk) {
			throw new Error('Failed to connect to Feishu API. Please check your authentication tokens.');
		}

		logger.info('Connected to Feishu API successfully');

		setContractHandler(server, {
			contract: FeishuDocumentServiceContract,
			impl: createFeishuDocumentServiceImpl({
				client: docsClient,
				logger,
			}),
		});
	},
});
