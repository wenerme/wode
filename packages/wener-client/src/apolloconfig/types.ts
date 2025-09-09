// Apollo Config API Types
// Based on https://github.com/apolloconfig/apollo/blob/master/docs/en/client/other-language-client-user-guide.md

export type ApolloConfigResponse<T extends Record<string, string> = Record<string, string>> = {
	appId: string;
	cluster: string;
	namespaceName: string;
	configurations: T;
	releaseKey: string;
};

export type NotificationItem = {
	namespaceName: string;
	notificationId: number;
};

export type NotificationResponse = NotificationItem[];

export type WatchResult<T extends Record<string, string> = Record<string, string>> = {
	config?: ApolloConfigResponse<T>;
	notification: NotificationItem;
};

export type ApolloConfigOptions = {
	appId: string;
	cluster?: string;
	configServerUrl: string;
	accessKeySecret?: string;
	clientIp?: string;
};

export type GetConfigOptions = {
	namespaceName?: string;
	releaseKey?: string;
	messages?: string;
	label?: string;
	ip?: string;
};

export type NotificationOptions = {
	notifications: NotificationItem[];
	cluster?: string;
};

export type CommonConfigOptions = {
	appId?: string;
	cluster?: string;
	namespace?: string;
	ip?: string;
};

export type WatchOptions = {
	/**
	 * Namespaces to monitor for changes
	 * @default ['application']
	 */
	namespaces?: string[];
	/**
	 * Interval between polls in milliseconds
	 * @default 60000 (60 seconds)
	 */
	interval?: number;
	/**
	 * Whether to yield initial data
	 * @default true for includeConfig, false for notifications
	 */
	includeInitial?: boolean;
	/**
	 * Custom error handler. Return true to continue, false to stop
	 * @default () => true (continue on errors)
	 */
	onError?: (error: any) => boolean;
	/**
	 * AbortController signal to stop watching
	 */
	signal?: AbortSignal;
	/**
	 * Include config content when changes detected
	 * If false: yields NotificationResponse (raw notifications)
	 * If true: yields ApolloConfigResponse (config content)
	 * @default true
	 */
	includeConfig?: boolean;
	/**
	 * Target namespace when includeConfig is true (single namespace only)
	 * @default 'application'
	 */
	namespace?: string;
};
