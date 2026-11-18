export { DnsServiceCapability } from './IDnsService';
export type { DnsService, IDnsService } from './IDnsService';
export { DnsOperations } from './operations';
export * from './DnsServiceContract';
export { isValidDnsName, normalizeDnsName, normalizeDnsRecordName, sameDnsName } from './name';
export * from './rdata';
export { DnsDeadlineError, DnsOperationScope, type DnsOperationState, formatPageCursor, pageLocally, parsePageCursor, planDnsRecordChanges, type DnsRecordChangePlan } from './rrset';
