export const APP_NAME = 'woctl';
export const LEGACY_APP_NAME = 'wocli';
export const APP_VERSION = '0.1.1';

export const DEFAULT_CONFIG_DIRECTORY = '.wode';
export const DEFAULT_CONFIG_FILENAME = `${APP_NAME}.yaml`;
export const BROWSER_CONFIG_STORAGE_KEY = `${APP_NAME}.config`;

export const ENV = {
	config: 'WOCTL_CONFIG',
	context: 'WOCTL_CONTEXT',
	logLevel: 'WOCTL_LOG_LEVEL',
} as const;

export const LEGACY_ENV = {
	config: 'WOCLI_CONFIG',
	context: 'WOCLI_CONTEXT',
	logLevel: 'WOCLI_LOG_LEVEL',
} as const;

export const MCP_CLIENT_INFO = {
	name: APP_NAME,
	version: APP_VERSION,
} as const;
