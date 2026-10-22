import {
	CliConfigError,
	type CliConfigStore,
	createMemoryCliConfigStore,
	parseCliConfig,
	serializeCliConfig,
} from 'common/context';
import { BROWSER_CONFIG_STORAGE_KEY } from './const';
import { createDefaultConfig } from './core';
import { createWocliCli, type WocliHost } from './createWocliCli';

export type { CliConfig, CliConfigStore } from 'common/context';
export { createMemoryCliConfigStore } from 'common/context';
export type { ServiceProvider, ServiceRuntimeClient } from 'common/service';
export type { WocliCli, WocliCommand, WocliDescribeOptions, WocliExecution, WocliHost } from './createWocliCli';
export { createWocliCli, createWocliServiceCommand } from './createWocliCli';

/** 默认只用内存；认证、远端 runtime 和文件 I/O 均由页面宿主显式注入。 */
export function createWocliWebCli(host: Omit<WocliHost, 'config'> & { config?: CliConfigStore } = {}) {
	return createWocliCli({
		...host,
		config: host.config ?? createMemoryCliConfigStore(createDefaultConfig()),
		info: { runtime: 'web', ...host.info },
	});
}

export function createBrowserConfigStore(
	storage: Pick<Storage, 'getItem' | 'setItem'>,
	key = BROWSER_CONFIG_STORAGE_KEY,
): CliConfigStore {
	return {
		async load() {
			const value = storage.getItem(key);
			if (value === null) return createDefaultConfig();
			let raw: unknown;
			try {
				raw = JSON.parse(value);
			} catch {
				throw new CliConfigError('Invalid browser configuration');
			}
			return parseCliConfig(raw);
		},
		async save(config) {
			storage.setItem(key, JSON.stringify(serializeCliConfig(config)));
		},
	};
}
