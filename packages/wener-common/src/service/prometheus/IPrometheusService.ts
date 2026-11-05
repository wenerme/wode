import type {
	PrometheusLabelsInput,
	PrometheusLabelValuesInput,
	PrometheusLabelValuesResponse,
	PrometheusMetadataInput,
	PrometheusMetadataResponse,
	PrometheusQueryInput,
	PrometheusQueryRangeInput,
	PrometheusQueryResponse,
	PrometheusSeriesInput,
	PrometheusSeriesResponse,
} from '@wener/client/prometheus';
import { defineServiceCapability } from '../registry/ServiceCapability';

export interface IPrometheusService extends AsyncDisposable {
	readonly type: 'prometheus';
	readonly readOnly: true;
	query(input: PrometheusQueryInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusQueryResponse>;
	queryRange(input: PrometheusQueryRangeInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusQueryResponse>;
	series(input: PrometheusSeriesInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusSeriesResponse>;
	labels(input?: PrometheusLabelsInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusLabelValuesResponse>;
	labelValues(input: PrometheusLabelValuesInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusLabelValuesResponse>;
	metadata(input?: PrometheusMetadataInput, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<PrometheusMetadataResponse>;
	close(): Promise<void>;
}
export type PrometheusService = IPrometheusService;

/** Capability key for `IPrometheusService`; `registry.load(PrometheusServiceCapability)` resolves to `IPrometheusService`. */
export const PrometheusServiceCapability = defineServiceCapability<IPrometheusService>('prometheus');
