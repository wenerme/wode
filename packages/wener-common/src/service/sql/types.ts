import type { ServiceProviderContext } from '../runtime/types';
import type { SQLQueryInput, SQLExecInput, SQLExecutionResult, SQLPingResult, SQLListObjectInput, SQLObject, SQLDescribeObjectInput, SQLObjectDescription, SqlCallOptions } from './ISqlService';

export type {
	ISqlService,
	ISQLService,
	SQLQueryInput,
	SQLExecInput,
	SQLExecutionResult,
	SQLObjectReference,
	SQLObject,
	SQLListObjectInput,
	SQLDescribeObjectInput,
	SQLObjectDescription,
	SQLPingResult,
	SqlCallOptions,
} from './ISqlService';

/** 驱动负责连接、参数绑定、数据库级只读执行和资源释放；`asyncDispose` 由 createSqlService 包装层提供。 */
export interface SqlAdapter {
	readonly dialect: string;
	ping(options?: SqlCallOptions): Promise<SQLPingResult>;
	query(input: SQLQueryInput, options?: SqlCallOptions): Promise<SQLExecutionResult>;
	exec(input: SQLExecInput, options?: SqlCallOptions): Promise<SQLExecutionResult>;
	listObject(input?: SQLListObjectInput, options?: SqlCallOptions): Promise<SQLObject[]>;
	describeObject(input: SQLDescribeObjectInput, options?: SqlCallOptions): Promise<SQLObjectDescription>;
	close(): void | Promise<void>;
}
export type SqlAdapterFactory = (context: ServiceProviderContext) => SqlAdapter | Promise<SqlAdapter>;
