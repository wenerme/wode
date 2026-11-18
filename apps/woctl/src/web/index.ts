import {
	CliConfigError,
	type CliConfigStore,
	createMemoryCliConfigStore,
	parseCliConfig,
	serializeCliConfig,
} from 'common/context';
import { BROWSER_CONFIG_STORAGE_KEY } from '../const';
import { createDefaultConfig } from '../core';
import { createCli, type CliHost } from '../createCli';

export type { ServiceProvider, ServiceRuntimeClient } from '@wener/common/service';
export type { CliConfig, CliConfigStore } from 'common/context';
export { createMemoryCliConfigStore } from 'common/context';
export type { WocliCli, WoctlCommand, WocliDescribeOptions, CliExecution, CliHost } from '../createCli';
export { createCli, createWoctlServiceCommand } from '../createCli';
export {
	createCliCatalog, describeServiceProvider, renderCliCatalog, formatServiceProviderTypeScript,
	CliCatalogJsonSchema, WOCLI_CATALOG_SCHEMA_VERSION,
} from '../catalog';
export type { CliCatalog, CliCatalogCommand, CliCatalogProvider, CliCatalogAvailability, CreateCliCatalogInput } from '../catalog';

/** 默认只用内存；认证、远端 runtime 和文件 I/O 均由页面宿主显式注入。 */
export function createWebCli(host: Omit<CliHost, 'config'> & { config?: CliConfigStore } = {}) {
	return createCli({
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
