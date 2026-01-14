import consola from 'consola';
import type { PrometheusConfig } from '../server/config';

const logger = consola.withTag('prometheus-client');

export interface PrometheusResponse<T = any> {
	status: 'success' | 'error';
	data?: T;
	error?: string;
	errorType?: string;
	warnings?: string[];
}

export interface PrometheusQueryResult {
	resultType: 'matrix' | 'vector' | 'scalar' | 'string';
	result: any[];
}

export interface PrometheusMetricMetadata {
	type: string;
	help: string;
	unit?: string;
}

export interface PrometheusTarget {
	discoveredLabels: Record<string, string>;
	labels: Record<string, string>;
	scrapePool: string;
	scrapeUrl: string;
	globalUrl: string;
	lastError: string;
	lastScrape: string;
	lastScrapeDuration: number;
	health: 'up' | 'down' | 'unknown';
	scrapeInterval: string;
	scrapeTimeout: string;
}

export interface PrometheusTargetsResult {
	activeTargets: PrometheusTarget[];
	droppedTargets: PrometheusTarget[];
}

/**
 * Prometheus HTTP API client
 */
export class PrometheusClient {
	private config: PrometheusConfig;

	constructor(config: PrometheusConfig) {
		this.config = config;
	}

	/**
	 * Get authentication headers for requests
	 */
	private getAuthHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.config.token) {
			headers.Authorization = `Bearer ${this.config.token}`;
		} else if (this.config.username && this.config.password) {
			const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
			headers.Authorization = `Basic ${credentials}`;
		}

		// Add organization ID header if specified
		if (this.config.orgId) {
			headers['X-Scope-OrgID'] = this.config.orgId;
		}

		return headers;
	}

	/**
	 * Make a request to the Prometheus API
	 */
	private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
		const url = new URL(`${this.config.url}/api/v1/${endpoint}`);

		// Add query parameters if provided
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value);
				}
			});
		}

		const headers = this.getAuthHeaders();

		logger.debug('Making Prometheus API request', {
			endpoint,
			url: url.toString(),
			params,
		});

		try {
			const response = await fetch(url.toString(), {
				method: 'GET',
				headers,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result: PrometheusResponse<T> = await response.json();

			if (result.status !== 'success') {
				const error = result.error || 'Unknown error';
				logger.error('Prometheus API returned error', {
					endpoint,
					error,
					errorType: result.errorType,
				});
				throw new Error(`Prometheus API error: ${error}`);
			}

			logger.debug('Prometheus API request successful', {
				endpoint,
				resultType: typeof result.data,
			});

			return result.data as T;
		} catch (error) {
			logger.error('HTTP request to Prometheus failed', {
				endpoint,
				url: url.toString(),
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Test connectivity to Prometheus server
	 */
	async healthCheck(): Promise<{ healthy: boolean; version?: string; error?: string }> {
		try {
			// Try a simple query to test connectivity
			await this.query('up', { time: Math.floor(Date.now() / 1000).toString() });
			return { healthy: true };
		} catch (error) {
			return {
				healthy: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Execute an instant query
	 */
	async query(query: string, options?: { time?: string; timeout?: string }): Promise<PrometheusQueryResult> {
		const params: Record<string, string> = { query };

		if (options?.time) {
			params.time = options.time;
		}
		if (options?.timeout) {
			params.timeout = options.timeout;
		}

		logger.info('Executing instant query', { query, time: options?.time });

		const data = await this.makeRequest<PrometheusQueryResult>('query', params);

		logger.info('Instant query completed', {
			query,
			resultType: data.resultType,
			resultCount: Array.isArray(data.result) ? data.result.length : 1,
		});

		return data;
	}

	/**
	 * Execute a range query
	 */
	async queryRange(
		query: string,
		start: string,
		end: string,
		step: string,
		options?: { timeout?: string },
	): Promise<PrometheusQueryResult> {
		const params: Record<string, string> = {
			query,
			start,
			end,
			step,
		};

		if (options?.timeout) {
			params.timeout = options.timeout;
		}

		logger.info('Executing range query', { query, start, end, step });

		const data = await this.makeRequest<PrometheusQueryResult>('query_range', params);

		logger.info('Range query completed', {
			query,
			resultType: data.resultType,
			resultCount: Array.isArray(data.result) ? data.result.length : 1,
		});

		return data;
	}

	/**
	 * List all available metrics
	 */
	async listMetrics(): Promise<string[]> {
		logger.info('Listing available metrics');

		const data = await this.makeRequest<string[]>('label/__name__/values');

		logger.info('Metrics list retrieved', { metricCount: data.length });

		return data;
	}

	/**
	 * Get metadata for a specific metric
	 */
	async getMetricMetadata(metric?: string): Promise<Record<string, PrometheusMetricMetadata[]>> {
		logger.info('Retrieving metric metadata', { metric });

		const params = metric ? { metric } : undefined;
		const data = await this.makeRequest<Record<string, PrometheusMetricMetadata[]>>('metadata', params);

		logger.info('Metric metadata retrieved', {
			metric,
			metadataCount: Object.keys(data).length,
		});

		return data;
	}

	/**
	 * Get information about scrape targets
	 */
	async getTargets(): Promise<PrometheusTargetsResult> {
		logger.info('Retrieving scrape targets information');

		const data = await this.makeRequest<PrometheusTargetsResult>('targets');

		logger.info('Scrape targets retrieved', {
			activeTargets: data.activeTargets.length,
			droppedTargets: data.droppedTargets.length,
		});

		return data;
	}

	/**
	 * Get Prometheus build information
	 */
	async getBuildInfo(): Promise<Record<string, any>> {
		logger.info('Retrieving build information');

		const data = await this.makeRequest<Record<string, any>>('status/buildinfo');

		logger.info('Build information retrieved');

		return data;
	}
}
