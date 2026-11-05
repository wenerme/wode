import type { LinearAdapter } from '@wener/client/linear';

export type { LinearAdapter, LinearAdapterFactory, LinearCallOptions } from '@wener/client/linear';

export interface ILinearService extends LinearAdapter {
	readonly type: 'linear';
	readonly readOnly: boolean;
}
