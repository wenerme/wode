import type { ResolvedGrafanaAuthOptions } from './auth';
import { GrafanaApiClient } from './client';

function createCacheKey(options: ResolvedGrafanaAuthOptions) {
	return [
		options.url,
		options.serviceAccountToken ?? '',
		options.username ?? '',
		options.password ?? '',
		options.orgId ?? '',
		JSON.stringify(options.extraHeaders),
	].join('::');
}

export class GrafanaClientCache {
	readonly #items = new Map<string, GrafanaApiClient>();

	getOrCreate(options: ResolvedGrafanaAuthOptions) {
		const key = createCacheKey(options);
		const existing = this.#items.get(key);
		if (existing) return existing;

		const client = new GrafanaApiClient(options);
		this.#items.set(key, client);
		return client;
	}

	clear() {
		this.#items.clear();
	}
}

export const grafanaClientCache = new GrafanaClientCache();
