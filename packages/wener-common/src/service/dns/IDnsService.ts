import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IDnsServiceContract } from './DnsServiceContract';

/** Portable DNS zone/RRSet management; `provider` names the backing supplier (e.g. powerdns). */
export interface IDnsService extends AsyncDisposable, IDnsServiceContract {
	readonly type: 'dns';
	readonly provider: string;
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type DnsService = IDnsService;

export const DnsServiceCapability = defineServiceCapability<IDnsService>('dns');
