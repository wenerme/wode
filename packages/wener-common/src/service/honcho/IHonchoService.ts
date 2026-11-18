import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IHonchoServiceContract } from './HonchoServiceContract';

/** Disposable profile: close aborts in-flight HTTP requests and rejects later calls. */
export interface IHonchoService extends AsyncDisposable, IHonchoServiceContract {
	readonly type: 'honcho';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type HonchoService = IHonchoService;

/** Capability key for `IHonchoService`; registry loading preserves the contract-derived interface. */
export const HonchoServiceCapability = defineServiceCapability<IHonchoService>('honcho');
