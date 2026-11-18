import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IOpenObserveServiceContract } from './OpenObserveServiceContract';

export type {
	OpenObserveHealthResult,
	OpenObserveStatus,
	OpenObserveListStreamInput,
	OpenObserveListStreamResult,
	OpenObserveGetStreamSchemaInput,
	OpenObserveStreamSchemaResult,
	OpenObserveSearchInput,
	OpenObserveSearchResult,
	OpenObserveListTraceInput,
	OpenObserveListTraceResult,
	OpenObserveGetStreamSettingsInput,
	OpenObserveStreamSettingsResult,
	OpenObserveUpdateStreamSettingsInput,
	OpenObserveDeleteStreamInput,
	OpenObserveMutationResult,
	OpenObserveIngestJsonInput,
	OpenObserveIngestMultiInput,
	OpenObserveIngestResult,
	OpenObserveGetValuesInput,
	OpenObserveGetValuesResult,
	OpenObserveSearchAroundInput,
	OpenObserveServiceCallOptions,
	OpenObserveServiceClient,
	OpenObserveServiceInputs,
	OpenObserveServiceOutputs,
} from './OpenObserveServiceContract';

export interface IOpenObserveService extends AsyncDisposable, IOpenObserveServiceContract {
	readonly type: 'openobserve';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type OpenObserveService = IOpenObserveService;

/** Capability key for `IOpenObserveService`; registry loading preserves the contract-derived interface. */
export const OpenObserveServiceCapability = defineServiceCapability<IOpenObserveService>('openobserve');
