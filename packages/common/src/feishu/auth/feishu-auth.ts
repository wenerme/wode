import consola from 'consola';
import { FeishuHttpClient } from '../client/http-client';
import type {
	FeishuConfig,
	FeishuOAuthConfig,
	FeishuOAuthTokenRequest,
	FeishuTokenResponse,
	FeishuTokens,
} from '../types';

const logger = consola.withTag('feishu-auth');

/**
 * Feishu OAuth and token management
 */
export class FeishuAuth {
	private httpClient: FeishuHttpClient;
	private config: FeishuConfig;
	private tokens: FeishuTokens = {};

	constructor(config: FeishuConfig) {
		this.config = config;
		this.httpClient = new FeishuHttpClient(config);
	}

	/**
	 * Get tenant access token (app-level authentication)
	 */
	async getTenantAccessToken(): Promise<string> {
		try {
			const response = await this.httpClient.post<FeishuTokenResponse>('/auth/v3/tenant_access_token/internal', {
				app_id: this.config.appId,
				app_secret: this.config.appSecret,
			});

			this.tokens.tenantAccessToken = response.access_token;
			logger.debug('Tenant access token obtained');
			return response.access_token;
		} catch (error) {
			logger.error('Failed to get tenant access token', { error });
			throw error;
		}
	}

	/**
	 * Get app access token (app-level, no tenant)
	 */
	async getAppAccessToken(): Promise<string> {
		try {
			const response = await this.httpClient.post<FeishuTokenResponse>('/auth/v3/app_access_token/internal', {
				app_id: this.config.appId,
				app_secret: this.config.appSecret,
			});

			this.tokens.appAccessToken = response.access_token;
			logger.debug('App access token obtained');
			return response.access_token;
		} catch (error) {
			logger.error('Failed to get app access token', { error });
			throw error;
		}
	}

	/**
	 * Generate OAuth authorization URL
	 */
	generateOAuthUrl(oauthConfig: FeishuOAuthConfig): string {
		const { appId, redirectUri, scopes = [], domain } = oauthConfig;
		const baseUrl = domain || this.config.domain || 'https://open.feishu.cn';

		const url = new URL(`${baseUrl}/open-apis/authen/v1/authorize`);
		url.searchParams.set('app_id', appId);
		url.searchParams.set('redirect_uri', redirectUri);
		url.searchParams.set('response_type', 'code');

		if (scopes.length > 0) {
			url.searchParams.set('scope', scopes.join(' '));
		}

		// Add state for security (can be customized)
		url.searchParams.set('state', Date.now().toString());

		return url.toString();
	}

	/**
	 * Exchange authorization code for user access token
	 */
	async exchangeCodeForToken(code: string, redirectUri: string): Promise<FeishuTokenResponse> {
		try {
			const requestBody: FeishuOAuthTokenRequest = {
				grant_type: 'authorization_code',
				code,
			};

			const response = await this.httpClient.post<FeishuTokenResponse>('/auth/v3/access_token', requestBody, {
				Authorization: `Bearer ${await this.getAppAccessToken()}`,
			});

			this.tokens.userAccessToken = response.access_token;
			this.tokens.refreshToken = response.refresh_token;

			logger.info('User access token obtained via authorization code');
			return response;
		} catch (error) {
			logger.error('Failed to exchange code for token', { error });
			throw error;
		}
	}

	/**
	 * Refresh user access token using refresh token
	 */
	async refreshUserAccessToken(refreshToken?: string): Promise<FeishuTokenResponse> {
		const token = refreshToken || this.tokens.refreshToken;
		if (!token) {
			throw new Error('No refresh token available');
		}

		try {
			const requestBody: FeishuOAuthTokenRequest = {
				grant_type: 'refresh_token',
				refresh_token: token,
			};

			const response = await this.httpClient.post<FeishuTokenResponse>('/auth/v3/refresh_access_token', requestBody, {
				Authorization: `Bearer ${await this.getAppAccessToken()}`,
			});

			this.tokens.userAccessToken = response.access_token;
			if (response.refresh_token) {
				this.tokens.refreshToken = response.refresh_token;
			}

			logger.info('User access token refreshed');
			return response;
		} catch (error) {
			logger.error('Failed to refresh user access token', { error });
			throw error;
		}
	}

	/**
	 * Set tokens manually
	 */
	setTokens(tokens: Partial<FeishuTokens>): void {
		this.tokens = { ...this.tokens, ...tokens };
	}

	/**
	 * Get current tokens
	 */
	getTokens(): FeishuTokens {
		return { ...this.tokens };
	}

	/**
	 * Clear all tokens
	 */
	clearTokens(): void {
		this.tokens = {};
	}

	/**
	 * Get authorization header for API requests
	 */
	async getAuthHeader(tokenType: 'tenant' | 'user' | 'app' = 'tenant'): Promise<Record<string, string>> {
		let token: string;

		switch (tokenType) {
			case 'tenant':
				token = this.tokens.tenantAccessToken || (await this.getTenantAccessToken());
				break;
			case 'user':
				if (!this.tokens.userAccessToken) {
					throw new Error('User access token not available. Please authenticate first.');
				}
				token = this.tokens.userAccessToken;
				break;
			case 'app':
				token = this.tokens.appAccessToken || (await this.getAppAccessToken());
				break;
			default:
				throw new Error(`Invalid token type: ${tokenType}`);
		}

		return {
			Authorization: `Bearer ${token}`,
		};
	}

	/**
	 * Test token validity
	 */
	async testToken(tokenType: 'tenant' | 'user' | 'app' = 'tenant'): Promise<boolean> {
		try {
			const headers = await this.getAuthHeader(tokenType);
			// Use a simple API call to test the token
			await this.httpClient.get('/auth/v3/tenant_access_token/internal', undefined, headers);
			return true;
		} catch (error) {
			logger.warn('Token test failed', { tokenType, error });
			return false;
		}
	}
}
