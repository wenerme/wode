import type { GrafanaRequestInput, GrafanaRequestOptions } from '@wener/client/grafana';
import { defineServiceCapability } from '../registry/ServiceCapability';

export interface IGrafanaService extends AsyncDisposable {
	readonly type: 'grafana';
	readonly readOnly: boolean;
	health(options?: GrafanaRequestOptions): Promise<unknown>;
	whoAmI(options?: GrafanaRequestOptions): Promise<unknown>;
	request(input: GrafanaRequestInput, options?: GrafanaRequestOptions): Promise<unknown>;
	close(): Promise<void>;
}
export type GrafanaService = IGrafanaService;

/** Capability key for `IGrafanaService`; `registry.load(GrafanaServiceCapability)` resolves to `IGrafanaService`. */
export const GrafanaServiceCapability = defineServiceCapability<IGrafanaService>('grafana');
