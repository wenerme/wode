import { AsyncLocalStorage } from 'node:async_hooks';
import type { MaybePromise } from '@wener/utils';
import type { BaseHttpRequestLogEntity } from './BaseHttpRequestLogEntity';

export class FetchCache {
	private static readonly Storage = new AsyncLocalStorage<FetchCacheConfig>();

	static get() {
		return FetchCache.Storage.getStore()?.last;
	}

	static set(v: BaseHttpRequestLogEntity, hit: boolean) {
		const store = FetchCache.Storage.getStore();
		if (store) {
			store.last = v;
			store.lastHit = hit;
		}
	}

	static getConfig() {
		return FetchCache.Storage.getStore();
	}

	static isLastHit() {
		return FetchCache.Storage.getStore()?.lastHit;
	}

	static skip<T = void>(f: () => MaybePromise<T>) {
		return FetchCache.Storage.run({ ...FetchCache.Storage.getStore(), use: 'request' }, f);
	}

	static fallback<T = void>(conf: FetchCacheConfig, f: () => MaybePromise<T>) {
		return FetchCache.Storage.run({ ...conf, ...FetchCache.Storage.getStore() }, f);
	}

	static run<T = void>(conf: FetchCacheConfig, f: () => MaybePromise<T>) {
		return FetchCache.Storage.run({ ...FetchCache.Storage.getStore(), ...conf }, f);
	}
}

export interface FetchCacheOptions {
	expires?: string;
	use?: 'request' | 'cache' | 'cache-only' | string;

	onBeforeRequest?: (o: FetchCacheHookContext) => MaybePromise<void>;
	onBeforeFetch?: (o: FetchCacheHookContext) => MaybePromise<void>;
	onAfterRequest?: (o: FetchCacheHookContext) => MaybePromise<void>;
}

export interface FetchCacheConfig {
	expires?: string;
	use?: 'request' | 'cache' | 'cache-only' | 'skip' | string;
	last?: BaseHttpRequestLogEntity;
	lastHit?: boolean;

	match?: { cookie?: boolean };

	onBeforeRequest?: (o: FetchCacheHookContext) => MaybePromise<void>;
	onBeforeFetch?: (o: FetchCacheHookContext) => MaybePromise<void>;
	onAfterRequest?: (o: FetchCacheHookContext) => MaybePromise<void>;
}

export interface FetchCacheHookContext {
	entry: BaseHttpRequestLogEntity;
	config: FetchCacheConfig;
	init: RequestInit;
	hit: boolean;
}
