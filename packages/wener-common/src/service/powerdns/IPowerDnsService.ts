import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IPowerDnsServiceContract } from './PowerDnsServiceContract';

/** PowerDNS-only extension capability; portable zone/RRSet management is `IDnsService`. */
export interface IPowerDnsService extends AsyncDisposable, IPowerDnsServiceContract {
	readonly type: 'powerdns';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type PowerDnsService = IPowerDnsService;

/** Capability key for `IPowerDnsService`; registry loading preserves the contract-derived interface. */
export const PowerDnsServiceCapability = defineServiceCapability<IPowerDnsService>('powerdns');
