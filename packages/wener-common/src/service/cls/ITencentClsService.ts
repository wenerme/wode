import { defineServiceCapability } from '../registry/ServiceCapability';
import type { ITencentClsServiceContract } from './TencentClsServiceContract';

export type {
	ITencentClsServiceContract,
	TencentClsListTopicInput,
	TencentClsQueryInput,
	TencentClsServiceCallOptions,
	TencentClsServiceInputs,
	TencentClsServiceOutputs,
} from './TencentClsServiceContract';

export interface ITencentClsService extends AsyncDisposable, ITencentClsServiceContract {
	readonly type: 'cls';
	readonly readOnly: true;
	close(): Promise<void>;
}
export type TencentClsService = ITencentClsService;

/** Capability key for `ITencentClsService`; registry loading preserves the contract-derived interface. */
export const TencentClsServiceCapability = defineServiceCapability<ITencentClsService>('cls');
