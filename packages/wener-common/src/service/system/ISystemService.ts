import { defineServiceCapability } from '../registry/ServiceCapability';
import type { ISystemServiceContract } from './SystemServiceContract';

/** Stateless offline runtime capability. */
export interface ISystemService extends ISystemServiceContract {
	readonly type: string;
	readonly readOnly: true;
}

export const SystemServiceCapability = defineServiceCapability<ISystemService>('system');
