import { defineContractOperation } from '../runtime/contract';
import { SqlServiceCapability } from './ISqlService';
import { SqlServiceContract } from './SqlServiceContract';

export const SqlOperations = {
	ping: defineContractOperation({ capability: SqlServiceCapability, contract: SqlServiceContract.ping,
		invoke: (service, input, options) => service.ping(input, options) }),
	query: defineContractOperation({ capability: SqlServiceCapability, contract: SqlServiceContract.query,
		invoke: (service, input, options) => service.query(input, options) }),
	exec: defineContractOperation({ capability: SqlServiceCapability, contract: SqlServiceContract.exec,
		invoke: (service, input, options) => service.exec(input, options) }),
	listObject: defineContractOperation({ capability: SqlServiceCapability, contract: SqlServiceContract.listObject,
		invoke: (service, input, options) => service.listObject(input, options) }),
	describeObject: defineContractOperation({ capability: SqlServiceCapability, contract: SqlServiceContract.describeObject,
		invoke: (service, input, options) => service.describeObject(input, options) }),
};
