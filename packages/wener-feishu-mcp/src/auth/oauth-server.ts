import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http';
import { URL } from 'url';
import { FeishuAuth, type FeishuOAuthConfig } from 'common/feishu';
import consola from 'consola';
import open from 'open';

const logger = consola.withTag('oauth-server');

export interface OAuthFlowResult {
	success: boolean;
	accessToken?: string;
	refreshToken?: string;
	error?: string;
}

/**
 * Local OAuth callback server for handling Feishu OAuth flow
 */
export class FeishuOAuthServer {
	private server?: Server;
	private auth: FeishuAuth;
	private config: FeishuOAuthConfig;

	constructor(config: FeishuOAuthConfig) {
		this.config = config;
		this.auth = new FeishuAuth({
			appId: config.appId,
			appSecret: config.appSecret,
			domain: config.domain,
		});
	}

	/**
	 * Start OAuth flow by opening browser and starting callback server
	 */
	async startOAuthFlow(): Promise<OAuthFlowResult> {
		const url = new URL(this.config.redirectUri);
		const port = parseInt(url.port) || 3000;
		const host = url.hostname || 'localhost';

		return new Promise((resolve, reject) => {
			let resolved = false;
			const timeout = setTimeout(
				() => {
					if (!resolved) {
						resolved = true;
						this.stopServer();
						resolve({
							success: false,
							error: 'OAuth flow timeout after 5 minutes',
						});
					}
				},
				5 * 60 * 1000,
			); // 5 minutes timeout

			// Create HTTP server to handle OAuth callback
			this.server = createServer((req, res) => this.handleCallback(req, res, resolve, timeout));

			this.server.on('error', (error) => {
				if (!resolved) {
					resolved = true;
					clearTimeout(timeout);
					logger.error('OAuth server error', { error });
					resolve({
						success: false,
						error: `Server error: ${error.message}`,
					});
				}
			});

			this.server.listen(port, host, () => {
				logger.info(`OAuth callback server started on http://${host}:${port}`);

				// Generate and open OAuth URL
				const authUrl = this.auth.generateOAuthUrl(this.config);
				logger.info('Opening OAuth authorization URL...');
				logger.info(`If the browser doesn't open automatically, visit: ${authUrl}`);

				open(authUrl).catch((error) => {
					logger.warn('Failed to open browser automatically', { error });
					logger.info(`Please manually open: ${authUrl}`);
				});
			});
		});
	}

	/**
	 * Handle OAuth callback request
	 */
	private async handleCallback(
		req: IncomingMessage,
		res: ServerResponse,
		resolve: (result: OAuthFlowResult) => void,
		timeout: NodeJS.Timeout,
	): Promise<void> {
		const url = new URL(req.url || '', `http://${req.headers.host}`);
		const code = url.searchParams.get('code');
		const error = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');

		logger.debug('Received OAuth callback', {
			path: url.pathname,
			hasCode: !!code,
			hasError: !!error,
		});

		// Handle OAuth errors
		if (error) {
			const errorMsg = errorDescription || error;
			logger.error('OAuth authorization error', { error, errorDescription });

			this.sendResponse(res, 400, 'OAuth Error', `Authorization failed: ${errorMsg}`);
			clearTimeout(timeout);
			this.stopServer();
			resolve({
				success: false,
				error: errorMsg,
			});
			return;
		}

		// Handle authorization code
		if (code && url.pathname === '/callback') {
			try {
				logger.info('Exchanging authorization code for tokens...');
				const tokenResponse = await this.auth.exchangeCodeForToken(code, this.config.redirectUri);

				logger.success('OAuth flow completed successfully');
				this.sendResponse(res, 200, 'OAuth Success', 'Authorization successful! You can close this window.');

				clearTimeout(timeout);
				this.stopServer();
				resolve({
					success: true,
					accessToken: tokenResponse.access_token,
					refreshToken: tokenResponse.refresh_token,
				});
				return;
			} catch (error) {
				logger.error('Token exchange failed', { error });
				const errorMsg = error instanceof Error ? error.message : 'Token exchange failed';

				this.sendResponse(res, 500, 'Token Exchange Error', `Failed to exchange code for token: ${errorMsg}`);
				clearTimeout(timeout);
				this.stopServer();
				resolve({
					success: false,
					error: errorMsg,
				});
				return;
			}
		}

		// Handle other requests (health check, etc.)
		if (url.pathname === '/health') {
			this.sendResponse(
				res,
				200,
				'OAuth Server Status',
				'OAuth callback server is running and waiting for authorization...',
			);
			return;
		}

		// Unknown request
		this.sendResponse(res, 404, 'Not Found', 'Invalid callback URL');
	}

	/**
	 * Send HTTP response with HTML page
	 */
	private sendResponse(res: ServerResponse, status: number, title: string, message: string): void {
		const html = `
<!DOCTYPE html>
<html>
<head>
	<title>${title}</title>
	<style>
		body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
		.container { max-width: 600px; margin: 0 auto; }
		.success { color: #28a745; }
		.error { color: #dc3545; }
		.info { color: #007bff; }
	</style>
</head>
<body>
	<div class="container">
		<h1 class="${status === 200 ? 'success' : status === 400 || status === 500 ? 'error' : 'info'}">${title}</h1>
		<p>${message}</p>
		${status === 200 ? '<p>You can safely close this window and return to your terminal.</p>' : ''}
	</div>
</body>
</html>`;

		res.writeHead(status, {
			'Content-Type': 'text/html',
			'Content-Length': Buffer.byteLength(html),
		});
		res.end(html);
	}

	/**
	 * Stop the OAuth callback server
	 */
	private stopServer(): void {
		if (this.server) {
			this.server.close(() => {
				logger.debug('OAuth callback server stopped');
			});
			this.server = undefined;
		}
	}

	/**
	 * Get the auth instance for further operations
	 */
	getAuth(): FeishuAuth {
		return this.auth;
	}
}
