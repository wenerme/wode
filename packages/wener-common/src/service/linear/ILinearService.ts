import type { LinearAdapter } from '@wener/client/linear';
import { defineServiceCapability } from '../registry/ServiceCapability';

export type { LinearAdapter, LinearAdapterFactory, LinearCallOptions } from '@wener/client/linear';

export interface ILinearService extends LinearAdapter {
	readonly type: 'linear';
	readonly readOnly: boolean;
}

/** Capability key for `ILinearService`; `registry.load(LinearServiceCapability)` resolves to `ILinearService`. */
export const LinearServiceCapability = defineServiceCapability<ILinearService>('linear');
