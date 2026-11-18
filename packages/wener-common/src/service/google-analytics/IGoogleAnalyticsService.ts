import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IGoogleAnalyticsServiceContract } from './GoogleAnalyticsServiceContract';

/**
 * Disposable profile: the local service caches an OAuth access token and tracks in-flight
 * requests, so `close()` aborts pending calls and drops the cached token.
 */
export interface IGoogleAnalyticsService extends AsyncDisposable, IGoogleAnalyticsServiceContract {
	readonly type: 'google-analytics';
	readonly readOnly: true;
	close(): Promise<void>;
}

/** Capability key; `registry.load(GoogleAnalyticsServiceCapability)` resolves to `IGoogleAnalyticsService`. */
export const GoogleAnalyticsServiceCapability = defineServiceCapability<IGoogleAnalyticsService>('google-analytics');
