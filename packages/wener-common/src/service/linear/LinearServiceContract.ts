import { z } from 'zod/v4';
import type { ServiceContract, ServiceTool } from '../runtime/types';
import * as s from './schema';

export const LinearMethodInputs = {
	getViewer: s.LinearEmptyInputSchema,
	listTeam: s.LinearListTeamInputSchema,
	listIssueState: s.LinearListIssueStateInputSchema,
	listUser: s.LinearListUserInputSchema,
	listProject: s.LinearListProjectInputSchema,
	listIssue: s.LinearListIssueInputSchema,
	getIssue: s.LinearGetIssueInputSchema,
	createIssue: s.LinearCreateIssueInputSchema,
	updateIssue: s.LinearUpdateIssueInputSchema,
	listComment: s.LinearListCommentInputSchema,
	createComment: s.LinearCreateCommentInputSchema,
};
export const LinearMethodOutputs = {
	getViewer: s.LinearViewerSchema,
	listTeam: s.LinearTeamConnectionSchema,
	listIssueState: s.LinearIssueStateConnectionSchema,
	listUser: s.LinearUserConnectionSchema,
	listProject: s.LinearProjectConnectionSchema,
	listIssue: s.LinearIssueConnectionSchema,
	getIssue: s.LinearIssueSchema,
	createIssue: s.LinearIssueSchema,
	updateIssue: s.LinearIssueSchema,
	listComment: s.LinearCommentConnectionSchema,
	createComment: s.LinearCommentSchema,
};
const descriptions = {
	getViewer: 'Get the authenticated Linear user.',
	listTeam: 'List teams with cursor pagination and optional archived teams.',
	listIssueState: 'List workflow states for a team with cursor pagination.',
	listUser: 'List users, optionally filtered by name or email.',
	listProject: 'List projects, optionally filtered by team and name.',
	listIssue: 'List issues with cursor pagination, field filters, text search and nested GraphQL filters.',
	getIssue: 'Get an issue by ID or identifier.',
	createIssue: 'Create an issue; requires a writable service.',
	updateIssue: 'Update issue fields; requires a writable service and at least one change.',
	listComment: 'List comments for an issue with cursor pagination.',
	createComment: 'Create a comment on an issue; requires a writable service.',
};
export type LinearOperationName = keyof typeof LinearMethodInputs;
const mutationNames = new Set<LinearOperationName>(['createIssue', 'updateIssue', 'createComment']);
function method(name: LinearOperationName) {
	return {
		description: descriptions[name],
		inputSchema: z.toJSONSchema(LinearMethodInputs[name], { io: 'input' }),
		outputSchema: z.toJSONSchema(LinearMethodOutputs[name]),
	};
}
const methods = {
	getViewer: method('getViewer'), listTeam: method('listTeam'), listIssueState: method('listIssueState'),
	listUser: method('listUser'), listProject: method('listProject'), listIssue: method('listIssue'),
	getIssue: method('getIssue'), createIssue: method('createIssue'), updateIssue: method('updateIssue'),
	listComment: method('listComment'), createComment: method('createComment'),
};

/** Static JSON-schema contract; independent of oRPC, transports and provider construction. */
export const LinearServiceContract = { methods } satisfies ServiceContract;
function tool(name: LinearOperationName): ServiceTool {
	return {
		...methods[name],
		annotations: { readOnlyHint: !mutationNames.has(name), destructiveHint: name === 'updateIssue' },
	};
}
export const LinearTools = {
	getViewer: tool('getViewer'), listTeam: tool('listTeam'), listIssueState: tool('listIssueState'),
	listUser: tool('listUser'), listProject: tool('listProject'), listIssue: tool('listIssue'),
	getIssue: tool('getIssue'), createIssue: tool('createIssue'), updateIssue: tool('updateIssue'),
	listComment: tool('listComment'), createComment: tool('createComment'),
};
