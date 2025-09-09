import { createHmac } from 'node:crypto';
import type { FetchLike } from '@wener/utils';
import { request, type RequestOptions } from './request';
import type {
	ApolloConfigResponse,
	CommonConfigOptions,
	NotificationItem,
	NotificationResponse,
	WatchOptions,
	WatchResult,
} from './types';

// https://www.apolloconfig.com/#/zh/client/other-language-client-user-guide

export type ApolloConfigClientInit = {
	appId: string;
	cluster?: string;
	configServerUrl: string;
	appSecret?: string;
	clientIp?: string;
	fetch?: FetchLike;
	namespace?: string;
};

export type ApolloConfigClientOptions = {
	appId: string;
	cluster: string;
	namespace: string;
	configServerUrl: string;
	accessKeySecret?: string;
	clientIp?: string;
	fetch: FetchLike;
};

export class ApolloConfigClient<T extends Record<string, string> = Record<string, string>> {
	options: ApolloConfigClientOptions;

	constructor(init: ApolloConfigClientInit) {
		this.options = {
			cluster: 'default',
			namespace: 'application',
			...init,
			accessKeySecret: init.appSecret,
			fetch: init.fetch || globalThis.fetch,
		};
	}

	async request<T = any>(url: string, options: Partial<RequestOptions> = {}): Promise<T> {
		const headers: Record<string, string> = {
			...options.headers,
		};

		// Add access key authentication if configured
		if (this.options.accessKeySecret) {
			const timestamp = Date.now().toString();
			// Build full URL with query parameters to get correct path for signature
			let fullUrl = new URL(url, this.options.configServerUrl);
			if (options.params) {
				for (const [k, v] of Object.entries(options.params)) {
					if (v === null || v === undefined) continue;
					if (Array.isArray(v)) {
						for (const vv of v) {
							fullUrl.searchParams.append(k, String(vv));
						}
						continue;
					}
					fullUrl.searchParams.set(k, String(v));
				}
				fullUrl.searchParams.sort();
			}
			const pathAndQuery = fullUrl.pathname + (fullUrl.search || '');
			const signature = this.generateSignature(pathAndQuery, timestamp);

			headers['Authorization'] = `Apollo ${this.options.appId}:${signature}`;
			headers['Timestamp'] = timestamp;
		}

		return request<T>({
			baseUrl: this.options.configServerUrl,
			url,
			method: 'GET',
			headers,
			fetch: this.options.fetch,
			...options,
		});
	}

	private generateSignature(urlPath: string, timestamp: string): string {
		if (!this.options.accessKeySecret) {
			throw new Error('Access key secret is required for signature generation');
		}

		const stringToSign = `${timestamp}\n${urlPath}`;
		return createHmac('sha1', this.options.accessKeySecret).update(stringToSign, 'utf8').digest('base64');
	}

	private resolveOptions(options: CommonConfigOptions = {}) {
		const { appId, cluster, namespace, ip } = options;
		return {
			appId: appId ?? this.options.appId,
			cluster: cluster ?? this.options.cluster,
			namespace: namespace ?? this.options.namespace,
			ip: ip ?? this.options.clientIp,
		};
	}

	async getConfig(
		options: CommonConfigOptions & {
			/**
			 * 将上一次返回对象中的releaseKey传入即可，用来给服务端比较版本，如果版本比下来没有变化，则服务端直接返回304以节省流量和运算
			 */
			releaseKey?: string;
			/**
			 * 用于给服务端即时更新内存缓存，如果传递了 releaseKey，而不传递 messages参数，在服务端多实例、且开启内存缓存时、有概率会获取不到最新的配置。
			 * 这个参数是json结构的字符串 {"details":{"key":notificationId}}，需要将 appId、clusterName、namespaceName使用 + 号拼接为 key,假设现在 appId=app、clusterName=default、namespaceName=test、notificationId=11，则 messages 参数为 {"details":{"app+default+test":11}}，使用 messages 参数时，需要进行 URL编码。
			 */
			messages?:
				| string
				| Record<string, any>
				| Array<[{ appId: string; cluster: string; namespace: string; notificationId: number }]>;
			label?: string;
		} = {},
	): Promise<ApolloConfigResponse<T> | null> {
		const { releaseKey, messages, label, ...commonOptions } = options;
		const resolved = this.resolveOptions(commonOptions);

		const params: Record<string, any> = {};
		if (releaseKey) params.releaseKey = releaseKey;
		if (messages) {
			if (Array.isArray(messages)) {
				let o = { details: {} as Record<string, number> };
				for (const { appId, cluster, namespace, notificationId } of messages) {
					o.details[`${appId}+${cluster}+${namespace}`] = notificationId;
				}
				params.messages = JSON.stringify(o.details);
			} else {
				params.messages = typeof messages === 'string' ? messages : JSON.stringify(messages);
			}
		}
		if (label) params.label = label;
		if (resolved.ip) params.ip = resolved.ip;

		const url = `configs/${resolved.appId}/${resolved.cluster}/${resolved.namespace}`;
		const result = await this.request<ApolloConfigResponse<T> | null>(url, { params });

		// If 304 Not Modified, return null to indicate no changes
		if (result === null) {
			return null;
		}

		return result;
	}

	async getConfigJson(options: CommonConfigOptions = {}): Promise<Record<string, string>> {
		const resolved = this.resolveOptions(options);

		const params: Record<string, any> = {};
		if (resolved.ip) {
			params.ip = resolved.ip;
		}

		const url = `configfiles/json/${resolved.appId}/${resolved.cluster}/${resolved.namespace}`;
		return this.request<Record<string, string>>(url, { params });
	}

	async getConfigProperties(options: CommonConfigOptions = {}): Promise<string> {
		const resolved = this.resolveOptions(options);

		const params: Record<string, any> = {};
		if (resolved.ip) params.ip = resolved.ip;

		const url = `configfiles/${resolved.appId}/${resolved.cluster}/${resolved.namespace}`;
		return this.request<string>(url, { params });
	}

	async getConfigRaw(options: CommonConfigOptions = {}): Promise<string> {
		const resolved = this.resolveOptions(options);

		const params: Record<string, any> = {};
		if (resolved.ip) params.ip = resolved.ip;

		const url = `configfiles/raw/${resolved.appId}/${resolved.cluster}/${resolved.namespace}`;
		return this.request<string>(url, { params });
	}

	async getNotifications(
		options: Pick<CommonConfigOptions, 'appId' | 'cluster'> & {
			notifications: NotificationItem[];
			signal?: AbortSignal;
		},
	): Promise<NotificationResponse> {
		const { notifications, signal, ...commonOptions } = options;
		const resolved = this.resolveOptions(commonOptions);

		const params = {
			appId: resolved.appId,
			cluster: resolved.cluster,
			notifications: JSON.stringify(notifications),
		};

		return this.request<NotificationResponse>('notifications/v2', { params, signal });
	}

	/**
	 * Create an async generator that watches for configuration changes
	 *
	 * @param options - Watch options
	 * @returns AsyncGenerator that yields {config?, notification} objects
	 *
	 * @example
	 * ```typescript
	 * // Watch config content (default behavior)
	 * for await (const result of client.watch()) {
	 *   console.log('Notification:', result.notification);
	 *   if (result.config) {
	 *     console.log('Config changed:', result.config.configurations);
	 *     console.log('Release key:', result.config.releaseKey);
	 *   }
	 * }
	 *
	 * // Watch notifications only (low-level)
	 * for await (const result of client.watch({ includeConfig: false })) {
	 *   console.log('Notification:', result.notification);
	 *   // result.config will be undefined
	 * }
	 *
	 * // With AbortController
	 * const controller = new AbortController();
	 * setTimeout(() => controller.abort(), 10000); // Stop after 10s
	 *
	 * for await (const result of client.watch({ signal: controller.signal })) {
	 *   console.log('Changes:', result);
	 * }
	 * ```
	 */
	async *watch(options: WatchOptions = {}): AsyncGenerator<WatchResult<T>, void, unknown> {
		const {
			namespaces: inputNamespaces,
			interval = 60000, // 60 seconds
			includeInitial = options.includeConfig ?? true, // Default to true if includeConfig
			onError = () => true, // Default: continue on errors
			signal,
			includeConfig = true, // Default to true
			namespace = 'application',
		} = options;

		// Convert single namespace to namespaces array if namespaces is missing
		const namespaces = inputNamespaces || [namespace];

		const notificationMap = new Map<string, number>();
		const releaseKeyMap = new Map<string, string>(); // Track releaseKey per namespace

		// Initialize notification IDs
		namespaces.forEach((ns) => notificationMap.set(ns, -1));

		let isFirstPoll = true;

		// Handle initial data if requested
		if (includeInitial && includeConfig) {
			try {
				if (signal?.aborted) return;
				const initialConfig = await this.getConfig({ namespace });
				if (initialConfig !== null) {
					releaseKeyMap.set(namespace, initialConfig.releaseKey);
					// For initial config, create result with empty notification
					yield {
						config: initialConfig,
						notification: { namespaceName: namespace, notificationId: -1 },
					};
				}
			} catch (error) {
				if (error instanceof Error && onError) {
					const shouldContinue = onError(error);
					if (!shouldContinue) return;
				} else {
					throw error;
				}
			}
		}

		while (!signal?.aborted) {
			try {
				if (signal?.aborted) break; // Check again before making request

				const notifications = Array.from(notificationMap.entries()).map(([namespaceName, notificationId]) => ({
					namespaceName,
					notificationId,
				}));

				const changes = await this.getNotifications({
					notifications,
					signal,
				});

				if (signal?.aborted) break; // Check after request

				if (changes.length > 0) {
					// Update notification IDs
					changes.forEach((change) => {
						notificationMap.set(change.namespaceName, change.notificationId);
					});

					if (includeConfig) {
						// Process each changed namespace from notifications
						let configToYield: ApolloConfigResponse<T> | undefined;

						for (const change of changes) {
							try {
								if (signal?.aborted) break;

								const changedNamespace = change.namespaceName;
								const currentReleaseKey = releaseKeyMap.get(changedNamespace);

								const updatedConfig = await this.getConfig({
									namespace: changedNamespace,
									releaseKey: currentReleaseKey,
								});

								// Handle 304 Not Modified (null response) - skip yielding
								if (updatedConfig === null) {
									// No changes, skip yielding
									continue;
								}

								// Only update if releaseKey has actually changed (deduplication)
								if (updatedConfig.releaseKey !== currentReleaseKey) {
									releaseKeyMap.set(changedNamespace, updatedConfig.releaseKey);
									configToYield = updatedConfig; // Use the last changed config
								}
							} catch (error) {
								if (onError?.(error)) {
									// continue on error
									break;
								} else {
									throw error;
								}
							}
						}

						// Yield result with both notification and config (if any)
						if (!signal?.aborted) {
							if (configToYield) {
								// Yield one result per changed namespace
								for (const change of changes) {
									yield {
										config: configToYield,
										notification: change,
									};
								}
							}
						}
					} else {
						// Yield only notifications (skip first poll unless includeInitial is true)
						if (!isFirstPoll || includeInitial) {
							if (!signal?.aborted) {
								// Yield one result per notification
								for (const change of changes) {
									yield {
										notification: change,
									};
								}
							}
						}
					}
				}

				isFirstPoll = false;

				// Wait before next poll, but allow early exit on abort
				if (!signal?.aborted) {
					await new Promise<void>((resolve) => {
						const timeout = setTimeout(resolve, interval);

						if (signal) {
							const abortHandler = () => {
								clearTimeout(timeout);
								resolve();
							};
							signal.addEventListener('abort', abortHandler, { once: true });
						}
					});
				}
			} catch (error) {
				if (error instanceof Error && onError) {
					const shouldContinue = onError(error);
					if (!shouldContinue) {
						break;
					}
				} else {
					throw error;
				}
			}
		}
	}
}
