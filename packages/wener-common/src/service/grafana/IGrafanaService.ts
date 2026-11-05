import type { GrafanaRequestInput, GrafanaRequestOptions } from '@wener/client/grafana';

export interface IGrafanaService {
	readonly type: 'grafana';
	readonly readOnly: boolean;
	health(options?: GrafanaRequestOptions): Promise<unknown>;
	whoAmI(options?: GrafanaRequestOptions): Promise<unknown>;
	request(input: GrafanaRequestInput, options?: GrafanaRequestOptions): Promise<unknown>;
	close(): Promise<void>;
}
export type GrafanaService = IGrafanaService;
