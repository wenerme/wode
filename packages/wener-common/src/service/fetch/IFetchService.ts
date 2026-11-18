import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IFetchServiceContract } from './FetchServiceContract';

export type { FetchRequest, FetchResponse, IFetchServiceContract } from './FetchServiceContract';

/** Stateless page-content capability; providers need no mandatory disposal. */
export interface IFetchService extends IFetchServiceContract {
	readonly type: string;
	readonly readOnly: true;
	close?(): void | Promise<void>;
}

/** Capability key for `IFetchService`; `registry.load(FetchServiceCapability)` resolves to `IFetchService`. */
export const FetchServiceCapability = defineServiceCapability<IFetchService>('fetch');
