import consola from 'consola';
import { SimpleStorage } from 'common/storage';
import type { FeishuTokens } from 'common/feishu';

const logger = consola.withTag('token-storage');

export interface StoredTokens extends FeishuTokens {
	appId: string;
	expiresAt?: number;
	refreshExpiresAt?: number;
}

/**
 * Token storage system using simple file storage
 * Stores tokens as: feishu-mcp-tokens.store.local.json
 */
export class FeishuTokenStorage {
	private storage = new SimpleStorage<Record<string, StoredTokens>>({
		namespace: 'feishu-mcp-tokens'
	});

	/**
	 * Store tokens for an app
	 */
	async storeTokens(appId: string, tokens: FeishuTokens, expiresIn?: number): Promise<void> {
		try {
			const storedTokens: StoredTokens = {
				appId,
				...tokens,
				expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined
			};

			// Load existing tokens
			const allTokens = await this.storage.get() || {};
			allTokens[appId] = storedTokens;

			// Save to storage
			await this.storage.store(allTokens);

			logger.debug('Tokens stored successfully', { appId });
		} catch (error) {
			logger.error('Failed to store tokens', { appId, error });
			throw new Error(`Failed to store tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Retrieve tokens for an app
	 */
	async getTokens(appId: string): Promise<FeishuTokens | null> {
		try {
			const allTokens = await this.storage.get() || {};
			const stored = allTokens[appId];

			if (!stored) {
				logger.debug('No tokens found for app', { appId });
				return null;
			}

			// Check if token is expired
			if (stored.expiresAt && Date.now() > stored.expiresAt) {
				logger.warn('Stored tokens are expired', { appId });
				// Don't return expired tokens, but keep them for refresh
				if (!stored.refreshToken) {
					await this.deleteTokens(appId);
					return null;
				}
			}

			logger.debug('Tokens retrieved successfully', { appId });
			return {
				tenantAccessToken: stored.tenantAccessToken,
				userAccessToken: stored.userAccessToken,
				appAccessToken: stored.appAccessToken,
				refreshToken: stored.refreshToken
			};
		} catch (error) {
			logger.error('Failed to retrieve tokens', { appId, error });
			return null;
		}
	}

	/**
	 * Delete tokens for an app
	 */
	async deleteTokens(appId: string): Promise<void> {
		try {
			const allTokens = await this.storage.get() || {};
			delete allTokens[appId];

			await this.storage.store(allTokens);

			logger.debug('Tokens deleted successfully', { appId });
		} catch (error) {
			logger.error('Failed to delete tokens', { appId, error });
			throw new Error(`Failed to delete tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * List all stored app IDs
	 */
	async listApps(): Promise<string[]> {
		try {
			const allTokens = await this.storage.get() || {};
			return Object.keys(allTokens);
		} catch (error) {
			logger.error('Failed to list apps', { error });
			return [];
		}
	}

	/**
	 * Clear all tokens
	 */
	async clearAll(): Promise<void> {
		try {
			await this.storage.clear();
			logger.info('All tokens cleared');
		} catch (error) {
			logger.error('Failed to clear all tokens', { error });
			throw new Error(`Failed to clear tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Check if tokens exist for an app
	 */
	async hasTokens(appId: string): Promise<boolean> {
		const tokens = await this.getTokens(appId);
		return tokens !== null;
	}

	/**
	 * Get token expiration info
	 */
	async getTokenInfo(appId: string): Promise<{
		hasTokens: boolean;
		isExpired: boolean;
		expiresAt?: Date;
		hasRefreshToken: boolean;
	} | null> {
		try {
			const allTokens = await this.storage.get() || {};
			const stored = allTokens[appId];

			if (!stored) {
				return null;
			}

			const isExpired = stored.expiresAt ? Date.now() > stored.expiresAt : false;

			return {
				hasTokens: true,
				isExpired,
				expiresAt: stored.expiresAt ? new Date(stored.expiresAt) : undefined,
				hasRefreshToken: !!stored.refreshToken
			};
		} catch (error) {
			logger.error('Failed to get token info', { appId, error });
			return null;
		}
	}

	/**
	 * Get storage file path
	 */
	getStoragePath(): string {
		return this.storage.getFilePath();
	}
}