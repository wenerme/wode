import consola from 'consola';
import { FeishuDomains, type FeishuApiResponse, type FeishuConfig, type FeishuError } from '../types';

const logger = consola.withTag('feishu-http-client');

export interface FeishuRequestOptions {
	/** API endpoint path (will be appended to base URL) */
	path: string;
	/** HTTP method */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	/** Request body (will be JSON stringified) */
	body?: any;
	/** Request headers */
	headers?: Record<string, string>;
	/** Query parameters */
	params?: Record<string, string>;
}

/**
 * HTTP client for Feishu/Lark API requests
 */
export class FeishuHttpClient {
	private config: Required<FeishuConfig>;
	private baseUrl: string;

	constructor(config: FeishuConfig) {
		this.config = {
			domain: config.domain || FeishuDomains.China,
			timeout: config.timeout || 10000,
			...config,
		};
		this.baseUrl = `${this.config.domain}/open-apis`;
	}

	/**
	 * Make a request to Feishu API
	 */
	async request<T = any>(options: FeishuRequestOptions): Promise<T> {
		const { path, method = 'GET', body, headers = {}, params } = options;

		// Build URL with query parameters
		const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value);
				}
			});
		}

		// Prepare headers
		const requestHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			'User-Agent': 'wener-feishu-mcp/1.0.0',
			...headers,
		};

		logger.debug('Making Feishu API request', {
			method,
			url: url.toString(),
			hasBody: !!body,
		});

		try {
			const response = await fetch(url.toString(), {
				method,
				headers: requestHeaders,
				body: body ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(this.config.timeout),
			});

			const contentType = response.headers.get('content-type');

			// Handle non-JSON responses
			if (!contentType?.includes('application/json')) {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				return response as any;
			}

			const data: FeishuApiResponse<T> = await response.json();

			// Check for Feishu API errors
			if (data.code !== 0 || !response.ok) {
				const error = this.createFeishuError(data, response);
				logger.error('Feishu API returned error', {
					path,
					code: data.code,
					message: error.message,
				});
				throw error;
			}

			logger.debug('Feishu API request successful', {
				path,
				hasData: !!data.data,
			});

			return data.data as T;
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				logger.error('Feishu API request timeout', { path, timeout: this.config.timeout });
				throw new Error(`Request timeout after ${this.config.timeout}ms`);
			}

			logger.error('Feishu API request failed', {
				path,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Create standardized error from Feishu API response
	 */
	private createFeishuError(data: FeishuApiResponse, response: Response): Error {
		let message = 'Feishu API error';

		if (data.msg) {
			message = data.msg;
		} else if (typeof data.error === 'string') {
			message = data.error;
		} else if (data.error && typeof data.error === 'object' && data.error.message) {
			message = data.error.message;
		} else if (!response.ok) {
			message = `HTTP ${response.status}: ${response.statusText}`;
		}

		const error = new Error(message);
		(error as any).code = data.code;
		(error as any).feishuError = data;
		return error;
	}

	/**
	 * GET request helper
	 */
	async get<T = any>(path: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
		return this.request<T>({ path, method: 'GET', params, headers });
	}

	/**
	 * POST request helper
	 */
	async post<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
		return this.request<T>({ path, method: 'POST', body, headers });
	}

	/**
	 * PUT request helper
	 */
	async put<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
		return this.request<T>({ path, method: 'PUT', body, headers });
	}

	/**
	 * DELETE request helper
	 */
	async delete<T = any>(path: string, headers?: Record<string, string>): Promise<T> {
		return this.request<T>({ path, method: 'DELETE', headers });
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<FeishuConfig>): void {
		this.config = { ...this.config, ...config };
		if (config.domain) {
			this.baseUrl = `${config.domain}/open-apis`;
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): FeishuConfig {
		return { ...this.config };
	}
}
