import { defineContractOperation } from '../runtime/contract';
import { LinearServiceContract as contract } from './LinearServiceContract';
import { LinearServiceCapability } from './ILinearService';

export const LinearOperations = {
	getViewer: defineContractOperation({ capability: LinearServiceCapability, contract: contract.getViewer,
		invoke: (service, input, options) => service.getViewer(input, options) }),
	listTeam: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listTeam,
		invoke: (service, input, options) => service.listTeam(input, options) }),
	listIssueState: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listIssueState,
		invoke: (service, input, options) => service.listIssueState(input, options) }),
	listUser: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listUser,
		invoke: (service, input, options) => service.listUser(input, options) }),
	listProject: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listProject,
		invoke: (service, input, options) => service.listProject(input, options) }),
	listIssue: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listIssue,
		invoke: (service, input, options) => service.listIssue(input, options) }),
	getIssue: defineContractOperation({ capability: LinearServiceCapability, contract: contract.getIssue,
		invoke: (service, input, options) => service.getIssue(input, options) }),
	createIssue: defineContractOperation({ capability: LinearServiceCapability, contract: contract.createIssue,
		invoke: (service, input, options) => service.createIssue(input, options) }),
	updateIssue: defineContractOperation({ capability: LinearServiceCapability, contract: contract.updateIssue,
		invoke: (service, input, options) => service.updateIssue(input, options) }),
	listComment: defineContractOperation({ capability: LinearServiceCapability, contract: contract.listComment,
		invoke: (service, input, options) => service.listComment(input, options) }),
	createComment: defineContractOperation({ capability: LinearServiceCapability, contract: contract.createComment,
		invoke: (service, input, options) => service.createComment(input, options) }),
};
