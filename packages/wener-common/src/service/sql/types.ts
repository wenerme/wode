import type { ServiceCallOptions, ServiceProviderContext } from '../runtime/types';

export interface SQLQueryInput {
	statement: string;
	params?: readonly unknown[];
	limit?: number;
	offset?: number;
}
export interface SQLExecInput {
	statement: string;
	params?: readonly unknown[];
}
export interface SQLExecutionResult {
	columns: string[];
	rows: Record<string, unknown>[];
	durationMs: number;
	affectedRows?: number | string;
	lastInsertId?: string;
	warnings?: string[];
}
export interface SQLObjectReference {
	catalog?: string;
	schema?: string;
	name?: string;
	type?: string;
}
export interface SQLObject extends SQLObjectReference {
	name: string;
	type: string;
	comment?: string;
	attributes?: Record<string, unknown>;
}
export interface SQLListObjectInput {
	parent?: SQLObjectReference;
	search?: string;
	limit?: number;
	offset?: number;
}
export interface SQLDescribeObjectInput {
	object: SQLObjectReference & { name: string };
}
export interface SQLObjectDescription {
	object: SQLObject;
	children?: SQLObject[];
	attributes?: Record<string, unknown>;
	durationMs?: number;
}
export interface SQLPingResult {
	ok: boolean;
	durationMs: number;
	version?: string;
}
export interface SqlCallOptions extends ServiceCallOptions {
	timeoutMs?: number;
}
export interface ISqlService {
	readonly type: string;
	readonly dialect: string;
	readonly readOnly: boolean;
	ping(options?: SqlCallOptions): Promise<SQLPingResult>;
	query(input: SQLQueryInput, options?: SqlCallOptions): Promise<SQLExecutionResult>;
	exec(input: SQLExecInput, options?: SqlCallOptions): Promise<SQLExecutionResult>;
	listObject(input?: SQLListObjectInput, options?: SqlCallOptions): Promise<SQLObject[]>;
	describeObject(input: SQLDescribeObjectInput, options?: SqlCallOptions): Promise<SQLObjectDescription>;
	close(): void | Promise<void>;
}
export type ISQLService = ISqlService;

/** 驱动负责连接、参数绑定、数据库级只读执行和资源释放。 */
export interface SqlAdapter extends Omit<ISqlService, 'type' | 'readOnly'> {}
export type SqlAdapterFactory = (context: ServiceProviderContext) => SqlAdapter | Promise<SqlAdapter>;
