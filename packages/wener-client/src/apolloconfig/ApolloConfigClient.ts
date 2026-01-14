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

type ConfigFormat = 'json' | 'xml' | 'yaml' | 'yml' | 'properties' | 'txt';

export type ApolloConfigClientInit = {
	url: string;
	cluster?: string;
	appId: string;
	appSecret?: string;
	clientIp?: string;
	fetch?: FetchLike;
	namespace?: string;
};

export type ApolloConfigClientOptions = {
	appId: string;
	appSecret?: string;
	cluster: string;
	namespace: string;
	url: string;
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
			appSecret: init.appSecret,
			fetch: init.fetch || globalThis.fetch,
		};
	}

	async request<T = any>(url: string, options: Partial<RequestOptions> = {}): Promise<T> {
		return request<T>({
			baseUrl: this.options.url,
			url,
			method: 'GET',
			headers: options.headers,
			fetch: this.options.fetch,
			appId: this.options.appId,
			appSecret: this.options.appSecret,
			...options,
		});
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
		try {
			return await this.request<ApolloConfigResponse<T>>(url, { params });
		} catch (e: any) {
			if (e && e.status === 304) {
				// Not Modified
				return null;
			}
			throw e;
		}
	}

	async getJson(options: CommonConfigOptions = {}): Promise<Record<string, string>> {
		const resolved = this.resolveOptions(options);

		const params: Record<string, any> = {};
		if (resolved.ip) {
			params.ip = resolved.ip;
		}

		const url = `configfiles/json/${resolved.appId}/${resolved.cluster}/${resolved.namespace}`;
		return this.request<Record<string, string>>(url, { params });
	}

	async getContent({
		format,
		namespace,
		...options
	}: CommonConfigOptions & {
		format?: ConfigFormat;
	} = {}): Promise<string> {
		namespace ||= this.options.namespace;
		({ namespace, format } = resolveNamespaceFormat({
			namespace,
			format,
		}));

		const out = await this.getJson({
			namespace,
			...options,
		});

		let keys = Object.keys(out);
		if (format === 'properties' || !format) {
			return keys.map((k) => `${k}=${JSON.stringify(out[k])}`).join('\n');
		}

		if (keys.length === 1 && keys[0] === 'content') {
			// this is the case
			return out.content;
		}

		throw new Error(`${namespace} config unknown format ${format}, keys: ${keys.join(',')}`);
	}

	async getData({
		format,
		namespace,
		...options
	}: CommonConfigOptions & {
		format?: ConfigFormat;
	} = {}): Promise<any> {
		namespace ||= this.options.namespace;

		({ namespace, format } = resolveNamespaceFormat({
			namespace,
			format,
		}));

		const out = await this.getJson({
			namespace,
			...options,
		});
		switch (format) {
			case 'properties':
				return out;
			case 'json':
				return JSON.parse(out.content || '{}');
			case 'yml':
			case 'yaml': {
				// lazy load
				const { parse } = await import('yaml');
				return parse(out.content || '', { merge: true });
			}
			default:
				throw new Error(`Unsupported format ${format}`);
		}
	}

	async getProperties(options: CommonConfigOptions = {}): Promise<string> {
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

	async *watch(options: WatchOptions = {}): AsyncGenerator<WatchResult<T>, void, unknown> {
		const {
			namespaces: inputNamespaces,
			onError = () => true, // Default: continue on errors
			signal,
			includeConfig = true, // Default to true
			namespace = 'application',
		} = options;

		// Convert single namespace to namespaces array if namespaces is missing
		const namespaces = inputNamespaces || [namespace];

		// Track state for each namespace
		const tracks: Record<string, { namespace: string; id: number; releaseKey?: string }> = {};

		// Initialize tracks
		namespaces.forEach((ns) => {
			tracks[ns] = { namespace: ns, id: -1 };
		});

		const handleError = (error: any) => {
			if (onError?.(error)) {
				return;
			}
			throw error;
		};

		// first getNotifications always return, because initial id is -1

		while (!signal?.aborted) {
			try {
				if (signal?.aborted) break; // Check again before making request

				const notifications = Object.values(tracks).map((track) => ({
					namespaceName: track.namespace,
					notificationId: track.id,
				}));

				const changes = await this.getNotifications({
					notifications,
					signal,
				});

				if (signal?.aborted) break; // Check after request

				if (!changes.length) {
					// nothing
					continue;
				}

				changes.forEach((change) => {
					tracks[change.namespaceName].id = change.notificationId;
				});

				if (!includeConfig) {
					yield* changes.map((v) => ({ notification: v }));
					continue;
				}

				for (const change of changes) {
					try {
						if (signal?.aborted) break;

						const changedNamespace = change.namespaceName;
						const track = tracks[changedNamespace];
						const currentReleaseKey = track.releaseKey;

						const updatedConfig = await this.getConfig({
							namespace: changedNamespace,
							releaseKey: currentReleaseKey,
							// todo messages
						});
						if (signal?.aborted) break;

						// Handle 304 Not Modified (null response) - skip yielding
						if (updatedConfig === null) {
							continue;
						}

						// Only yield if releaseKey has actually changed (deduplication)
						if (updatedConfig.releaseKey !== currentReleaseKey) {
							track.releaseKey = updatedConfig.releaseKey;

							yield { config: updatedConfig, notification: change };
						}
					} catch (error) {
						handleError(error);
					}
				}
			} catch (error) {
				handleError(error);
			}
		}
	}
}

function resolveNamespaceFormat({ namespace, format }: { namespace: string; format?: ConfigFormat }): {
	namespace: string;
	format: ConfigFormat;
} {
	if (!format) {
		let ext = namespace.split('.').pop();
		if (ext && ['json', 'xml', 'yaml', 'yml', 'properties', 'txt'].includes(ext)) {
			format = ext as ConfigFormat;
		}
	}

	format ||= 'properties';
	if (format === 'properties') {
	} else if (!namespace.endsWith(`.${format}`)) {
		namespace = `${namespace}.${format}`;
	}

	return { namespace, format };
}
