import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { SqlToolInputs, SqlTools } from '../runtime/sql-tools';

export const SqlOperations = {
	ping: defineServiceOperation({ capability: 'sql', tool: SqlTools.ping, input: SqlToolInputs.ping,
		invoke: (service, _input, options) => service.ping(options) }),
	query: defineServiceOperation({ capability: 'sql', tool: SqlTools.query, input: SqlToolInputs.query,
		invoke: (service, input, options) => service.query(input, options) }),
	exec: defineServiceOperation({ capability: 'sql', tool: SqlTools.exec, input: SqlToolInputs.exec,
		invoke: (service, input, options) => service.exec(input, options) }),
	listObject: defineServiceOperation({ capability: 'sql', tool: SqlTools.listObject, input: SqlToolInputs.listObject,
		invoke: (service, input, options) => service.listObject(input, options) }),
	describeObject: defineServiceOperation({ capability: 'sql', tool: SqlTools.describeObject, input: SqlToolInputs.describeObject,
		invoke: (service, input, options) => service.describeObject(input, options) }),
};
