import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IGrafanaServiceContract } from './GrafanaServiceContract';

export type {
	GrafanaListDashboardInput, GrafanaGetDashboardInput, GrafanaUpdateDashboardInput,
	GrafanaListPanelInput, GrafanaGetPanelInput, GrafanaPatchPanelInput,
} from './GrafanaServiceContract';

export interface IGrafanaService extends AsyncDisposable, IGrafanaServiceContract {
	readonly type: 'grafana';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type GrafanaService = IGrafanaService;

/** Capability key for `IGrafanaService`; registry loading preserves the contract-derived interface. */
export const GrafanaServiceCapability = defineServiceCapability<IGrafanaService>('grafana');
