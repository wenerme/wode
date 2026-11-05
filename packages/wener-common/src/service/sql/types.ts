import type { ServiceProviderContext } from '../runtime/types';
import type { ISqlService } from './ISqlService';

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

/** 驱动负责连接、参数绑定、数据库级只读执行和资源释放。 */
export interface SqlAdapter extends Omit<ISqlService, 'type' | 'readOnly'> {}
export type SqlAdapterFactory = (context: ServiceProviderContext) => SqlAdapter | Promise<SqlAdapter>;
