import type { OpenObserveClient } from '@wener/client/openobserve';
import { defineServiceCapability } from '../registry/ServiceCapability';

export type IOpenObserveService = Pick<
	OpenObserveClient,
	'type' | 'health' | 'status' | 'listStreams' | 'getStreamSchema' | 'search' | 'listTraces' | 'getStreamSettings' | 'updateStreamSettings' | 'deleteStream' | 'ingestJson' | 'ingestMulti' | 'getValues' | 'searchAround' | 'close'
> &
	AsyncDisposable & { readonly readOnly: boolean };
export type OpenObserveService = IOpenObserveService;

/** Capability key for `IOpenObserveService`; `registry.load(OpenObserveServiceCapability)` resolves to `IOpenObserveService`. */
export const OpenObserveServiceCapability = defineServiceCapability<IOpenObserveService>('openobserve');
