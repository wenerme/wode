import type { ILinearServiceContract } from './LinearServiceContract';
import type { LinearAdapter } from '@wener/client/linear';
import { defineServiceCapability } from '../registry/ServiceCapability';

export type { LinearAdapter, LinearAdapterFactory, LinearCallOptions } from '@wener/client/linear';

export interface ILinearService extends AsyncDisposable, ILinearServiceContract {
	readonly type: 'linear';
	readonly readOnly: boolean;
	/** Preserve the original options-only viewer call alongside the canonical (input, options). */
	getViewer: ILinearServiceContract['getViewer'] & LinearAdapter['getViewer'];
	close(): Promise<void>;
}

/** Capability key for `ILinearService`; `registry.load(LinearServiceCapability)` resolves to `ILinearService`. */
export const LinearServiceCapability = defineServiceCapability<ILinearService>('linear');
