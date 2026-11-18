import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IPrometheusServiceContract } from './PrometheusServiceContract';

export interface IPrometheusService extends AsyncDisposable, IPrometheusServiceContract {
	readonly type: 'prometheus';
	readonly readOnly: true;
	close(): Promise<void>;
}
export type PrometheusService = IPrometheusService;

/** Capability key for `IPrometheusService`; `registry.load(PrometheusServiceCapability)` resolves to `IPrometheusService`. */
export const PrometheusServiceCapability = defineServiceCapability<IPrometheusService>('prometheus');
