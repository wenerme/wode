import type { ServiceCallOptions } from '../runtime/types';
import { defineServiceCapability } from '../registry/ServiceCapability';
import type { ISqlServiceContract, SqlServiceInputs, SqlServiceOutputs } from './SqlServiceContract';

export type SQLQueryInput = SqlServiceInputs['query'];
export type SQLExecInput = SqlServiceInputs['exec'];
export type SQLExecutionResult = SqlServiceOutputs['query'];
export type SQLListObjectInput = NonNullable<SqlServiceInputs['listObject']>;
export type SQLObjectReference = NonNullable<SQLListObjectInput['parent']>;
export type SQLObject = SqlServiceOutputs['listObject'][number];
export type SQLDescribeObjectInput = SqlServiceInputs['describeObject'];
export type SQLObjectDescription = SqlServiceOutputs['describeObject'];
export type SQLPingResult = SqlServiceOutputs['ping'];
/** Native driver options; contract callers use SqlServiceCallOptions.context.timeoutMs. */
export interface SqlCallOptions extends ServiceCallOptions {
	timeoutMs?: number;
}
export interface ISqlService extends AsyncDisposable, ISqlServiceContract {
	readonly type: string;
	readonly dialect: string;
	readonly readOnly: boolean;
	close(): void | Promise<void>;
}
export type ISQLService = ISqlService;

/** Capability key for `ISqlService`; `registry.load(SqlServiceCapability)` resolves to `ISqlService`. */
export const SqlServiceCapability = defineServiceCapability<ISqlService>('sql');
