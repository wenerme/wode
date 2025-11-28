import consola from 'consola';
import { CacheManager } from '../cache/cache-manager';
import type { FeishuDevDocsConfig } from '../server/config';

const logger = consola.withTag('feishu-devdocs-client');

export interface FeishuRecallRequest {
	question: string;
}

export interface FeishuRecallResponse {
	chunks?: string[];
	error?: string;
}

export interface FeishuRecallResult {
	success: boolean;
	results: string[];
	error?: string;
}

/**
 * Feishu Developer Documentation Recall API Client
 */
export class FeishuDevDocsClient {
	private config: FeishuDevDocsConfig;
	private cacheManager: CacheManager;

	constructor(config: FeishuDevDocsConfig) {
		this.config = config;
		this.cacheManager = new CacheManager({
			cacheDirPath: config.cache?.cacheDir,
			defaultTtl: config.cache?.ttl,
			enableCache: config.cache?.enabled,
		});
	}

	/**
	 * Initialize the client and cache
	 */
	async init(): Promise<void> {
		await this.cacheManager.init();
	}

	/**
	 * Search developer documentation using the recall API
	 */
	async recallDeveloperDocuments(query: string): Promise<FeishuRecallResult> {
		// Try to get from cache first
		const cachedResult = await this.cacheManager.get<FeishuRecallResult>(query);
		if (cachedResult) {
			logger.debug('Using cached result for query', {
				query,
				resultCount: cachedResult.results.length,
			});
			return cachedResult;
		}

		// Make fresh API request
		const result = await this._fetchFromApi(query);

		// Store successful results in cache
		if (result.success) {
			await this.cacheManager.set(query, result);
		}

		return result;
	}

	/**
	 * Internal method to fetch from API
	 */
	private async _fetchFromApi(query: string): Promise<FeishuRecallResult> {
		const url = `${this.config.domain}/document_portal/v1/recall`;
		const payload: FeishuRecallRequest = {
			question: query,
		};

		logger.debug('Making recall API request', {
			url,
			query,
			maxResults: this.config.maxResults,
		});

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'wener-feishu-devdocs-mcp/1.0.0',
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(this.config.timeout || 10000),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: FeishuRecallResponse = await response.json();

			if (data.error) {
				logger.error('Feishu API returned error', {
					query,
					error: data.error,
				});
				return {
					success: false,
					results: [],
					error: data.error,
				};
			}

			const results = data.chunks || [];
			const limitedResults = this.config.maxResults ? results.slice(0, this.config.maxResults) : results;

			logger.info('Recall API request successful', {
				query,
				totalResults: results.length,
				returnedResults: limitedResults.length,
			});

			return {
				success: true,
				results: limitedResults,
			};
		} catch (error) {
			logger.error('HTTP request to Feishu recall API failed', {
				url,
				query,
				error: error instanceof Error ? error.message : String(error),
			});

			let errorMessage = 'Unknown error';
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					errorMessage = 'Request timeout';
				} else if (error.message.includes('fetch')) {
					errorMessage = 'Network error';
				} else {
					errorMessage = error.message;
				}
			}

			return {
				success: false,
				results: [],
				error: errorMessage,
			};
		}
	}

	/**
	 * Test connectivity to Feishu developer documentation API
	 */
	async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
		try {
			// Test with a simple query
			const result = await this.recallDeveloperDocuments('API');
			return {
				healthy: result.success,
				error: result.error,
			};
		} catch (error) {
			return {
				healthy: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Format documentation results for display
	 */
	formatResults(results: string[], query: string): string {
		if (results.length === 0) {
			return `No developer documentation found for query: "${query}"`;
		}

		const header = `Found ${results.length} developer documentation result${results.length > 1 ? 's' : ''} for: "${query}"\n\n`;
		const formattedResults = results.map((chunk, index) => `${index + 1}. ${chunk.trim()}`).join('\n\n---\n\n');

		return header + formattedResults;
	}

	/**
	 * Clear cache for a specific query
	 */
	async clearCache(query?: string): Promise<void> {
		if (query) {
			await this.cacheManager.delete(query);
		} else {
			await this.cacheManager.clear();
		}
	}

	/**
	 * Get cache statistics
	 */
	async getCacheStats() {
		return await this.cacheManager.getStats();
	}

	/**
	 * Clean up expired cache entries
	 */
	async cleanupCache(): Promise<number> {
		return await this.cacheManager.cleanup();
	}
}
