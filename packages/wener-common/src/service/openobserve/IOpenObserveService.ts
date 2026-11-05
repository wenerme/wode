import type { OpenObserveClient } from '@wener/client/openobserve';

export type IOpenObserveService = Pick<
	OpenObserveClient,
	'type' | 'health' | 'status' | 'listStreams' | 'getStreamSchema' | 'search' | 'listTraces' | 'getStreamSettings' | 'updateStreamSettings' | 'deleteStream' | 'ingestJson' | 'ingestMulti' | 'getValues' | 'searchAround' | 'close'
> & { readonly readOnly: boolean };
export type OpenObserveService = IOpenObserveService;
