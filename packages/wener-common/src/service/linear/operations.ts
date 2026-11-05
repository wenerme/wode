import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { LinearMethodInputs as input, LinearTools as tool } from './LinearServiceContract';
import { LinearServiceCapability } from './ILinearService';

export const LinearOperations = {
	getViewer: defineServiceOperation({ capability: LinearServiceCapability, input: input.getViewer, tool: tool.getViewer,
		invoke: (service, _input, options) => service.getViewer(options) }),
	listTeam: defineServiceOperation({ capability: LinearServiceCapability, input: input.listTeam, tool: tool.listTeam,
		invoke: (service, input, options) => service.listTeam(input, options) }),
	listIssueState: defineServiceOperation({ capability: LinearServiceCapability, input: input.listIssueState, tool: tool.listIssueState,
		invoke: (service, input, options) => service.listIssueState(input, options) }),
	listUser: defineServiceOperation({ capability: LinearServiceCapability, input: input.listUser, tool: tool.listUser,
		invoke: (service, input, options) => service.listUser(input, options) }),
	listProject: defineServiceOperation({ capability: LinearServiceCapability, input: input.listProject, tool: tool.listProject,
		invoke: (service, input, options) => service.listProject(input, options) }),
	listIssue: defineServiceOperation({ capability: LinearServiceCapability, input: input.listIssue, tool: tool.listIssue,
		invoke: (service, input, options) => service.listIssue(input, options) }),
	getIssue: defineServiceOperation({ capability: LinearServiceCapability, input: input.getIssue, tool: tool.getIssue,
		invoke: (service, input, options) => service.getIssue(input, options) }),
	createIssue: defineServiceOperation({ capability: LinearServiceCapability, input: input.createIssue, tool: tool.createIssue,
		invoke: (service, input, options) => service.createIssue(input, options) }),
	updateIssue: defineServiceOperation({ capability: LinearServiceCapability, input: input.updateIssue, tool: tool.updateIssue,
		invoke: (service, input, options) => service.updateIssue(input, options) }),
	listComment: defineServiceOperation({ capability: LinearServiceCapability, input: input.listComment, tool: tool.listComment,
		invoke: (service, input, options) => service.listComment(input, options) }),
	createComment: defineServiceOperation({ capability: LinearServiceCapability, input: input.createComment, tool: tool.createComment,
		invoke: (service, input, options) => service.createComment(input, options) }),
};
