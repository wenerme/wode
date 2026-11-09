import type { GrafanaRequestInput, GrafanaRequestOptions } from '@wener/client/grafana';
import { defineServiceCapability } from '../registry/ServiceCapability';

export interface GrafanaListDashboardInput {
	query?: string;
	tag?: string[];
	folderUid?: string;
	limit?: number;
}
export interface GrafanaGetDashboardInput {
	uid: string;
}
export interface GrafanaUpdateDashboardInput {
	dashboard: unknown;
	folderUid?: string;
	message?: string;
	overwrite?: boolean;
	/** Preview the write without saving; see `GrafanaPatchPanelInput.dryRun`. */
	dryRun?: boolean;
}
export interface GrafanaGetPanelInput {
	dashboardUid: string;
	panelId: number;
}
/**
 * Grafana has no standalone panel endpoint; a panel edit is read-dashboard -> locate panel by
 * id -> apply exactly one edit mode -> write the whole dashboard back. `set`/`merge`/`replace`
 * are mutually exclusive on purpose: mixing modes in one call would make the resulting panel
 * state ambiguous to an agent re-reading its own request. This mirrors wode-gf-cli's
 * `panel patch <DASH>/<PANEL-ID> --set/--merge/--from` without copying its CLI surface 1:1.
 */
export interface GrafanaPatchPanelInput {
	dashboardUid: string;
	panelId: number;
	/** Dot/bracket path -> value assignments applied to the panel object, e.g. `{ "title": "CPU" }`. */
	set?: Record<string, unknown>;
	/** Deep-merged into the panel object; arrays are replaced, not concatenated. */
	merge?: Record<string, unknown>;
	/** Replaces the panel object entirely; must keep the same `id`. */
	replace?: unknown;
	message?: string;
	/** When true, computes and returns the result without issuing the underlying write. */
	dryRun?: boolean;
}

export interface IGrafanaService extends AsyncDisposable {
	readonly type: 'grafana';
	readonly readOnly: boolean;
	health(options?: GrafanaRequestOptions): Promise<unknown>;
	whoAmI(options?: GrafanaRequestOptions): Promise<unknown>;
	request(input: GrafanaRequestInput, options?: GrafanaRequestOptions): Promise<unknown>;
	listDashboard(input?: GrafanaListDashboardInput, options?: GrafanaRequestOptions): Promise<unknown>;
	getDashboard(input: GrafanaGetDashboardInput, options?: GrafanaRequestOptions): Promise<unknown>;
	updateDashboard(input: GrafanaUpdateDashboardInput, options?: GrafanaRequestOptions): Promise<unknown>;
	getPanel(input: GrafanaGetPanelInput, options?: GrafanaRequestOptions): Promise<unknown>;
	patchPanel(input: GrafanaPatchPanelInput, options?: GrafanaRequestOptions): Promise<unknown>;
	close(): Promise<void>;
}
export type GrafanaService = IGrafanaService;

/** Capability key for `IGrafanaService`; `registry.load(GrafanaServiceCapability)` resolves to `IGrafanaService`. */
export const GrafanaServiceCapability = defineServiceCapability<IGrafanaService>('grafana');
