import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { SqlToolInputs, SqlTools } from '../runtime/sql-tools';
import { SqlServiceCapability } from './ISqlService';

export const SqlOperations = {
	ping: defineServiceOperation({ capability: SqlServiceCapability, tool: SqlTools.ping, input: SqlToolInputs.ping,
		invoke: (service, _input, options) => service.ping(options) }),
	query: defineServiceOperation({ capability: SqlServiceCapability, tool: SqlTools.query, input: SqlToolInputs.query,
		invoke: (service, input, options) => service.query(input, options) }),
	exec: defineServiceOperation({ capability: SqlServiceCapability, tool: SqlTools.exec, input: SqlToolInputs.exec,
		invoke: (service, input, options) => service.exec(input, options) }),
	listObject: defineServiceOperation({ capability: SqlServiceCapability, tool: SqlTools.listObject, input: SqlToolInputs.listObject,
		invoke: (service, input, options) => service.listObject(input, options) }),
	describeObject: defineServiceOperation({ capability: SqlServiceCapability, tool: SqlTools.describeObject, input: SqlToolInputs.describeObject,
		invoke: (service, input, options) => service.describeObject(input, options) }),
};
