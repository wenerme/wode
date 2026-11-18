import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod/v4';
import { toJsonSchema } from '../../schema';
import type { ServiceToolMeta } from '../runtime/contract';
import type { ServiceContract, ServiceTool } from '../runtime/types';
import * as s from './schema';

// The shared bridge exports schemas in output mode and rewrites optional fields as nullable.
// Carry the native input JSON Schema as metadata so discovery retains the DTO's input rules.
function inputSchema<T extends z.ZodType>(schema: T): T {
	const jsonSchema = z.toJSONSchema(schema, { io: 'input' });
	return schema.meta({ ...jsonSchema, required: jsonSchema.required ?? [] });
}

export const LinearMethodInputs = {
	getViewer: inputSchema(s.LinearEmptyInputSchema.default({})),
	listTeam: inputSchema(s.LinearListTeamInputSchema.default({ first: 50, includeArchived: false })),
	listIssueState: inputSchema(s.LinearListIssueStateInputSchema),
	listUser: inputSchema(s.LinearListUserInputSchema.default({ first: 50, includeArchived: false })),
	listProject: inputSchema(s.LinearListProjectInputSchema.default({ first: 50, includeArchived: false })),
	listIssue: inputSchema(s.LinearListIssueInputSchema.default({ first: 50, includeArchived: false })),
	getIssue: inputSchema(s.LinearGetIssueInputSchema),
	createIssue: inputSchema(s.LinearCreateIssueInputSchema),
	updateIssue: inputSchema(s.LinearUpdateIssueInputSchema.meta({
		anyOf: Object.keys(s.LinearUpdateIssueInputSchema.shape).filter((key) => key !== 'id').map((key) => ({ required: [key] })),
	})),
	listComment: inputSchema(s.LinearListCommentInputSchema),
	createComment: inputSchema(s.LinearCreateCommentInputSchema),
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
const linear = oc.$meta<ServiceToolMeta>({});
const read: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const write: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };

/** Canonical oRPC procedures; DTO envelopes and pagination stay shared with the adapter. */
export const LinearServiceContract = {
	getViewer: linear.input(LinearMethodInputs.getViewer).output(LinearMethodOutputs.getViewer).meta({ ...read, description: descriptions.getViewer }),
	listTeam: linear.input(LinearMethodInputs.listTeam).output(LinearMethodOutputs.listTeam).meta({ ...read, description: descriptions.listTeam }),
	listIssueState: linear.input(LinearMethodInputs.listIssueState).output(LinearMethodOutputs.listIssueState).meta({ ...read, description: descriptions.listIssueState }),
	listUser: linear.input(LinearMethodInputs.listUser).output(LinearMethodOutputs.listUser).meta({ ...read, description: descriptions.listUser }),
	listProject: linear.input(LinearMethodInputs.listProject).output(LinearMethodOutputs.listProject).meta({ ...read, description: descriptions.listProject }),
	listIssue: linear.input(LinearMethodInputs.listIssue).output(LinearMethodOutputs.listIssue).meta({ ...read, description: descriptions.listIssue }),
	getIssue: linear.input(LinearMethodInputs.getIssue).output(LinearMethodOutputs.getIssue).meta({ ...read, description: descriptions.getIssue }),
	createIssue: linear.input(LinearMethodInputs.createIssue).output(LinearMethodOutputs.createIssue).meta({ ...write, description: descriptions.createIssue }),
	updateIssue: linear.input(LinearMethodInputs.updateIssue).output(LinearMethodOutputs.updateIssue).meta({ ...write, destructiveHint: true, description: descriptions.updateIssue }),
	listComment: linear.input(LinearMethodInputs.listComment).output(LinearMethodOutputs.listComment).meta({ ...read, description: descriptions.listComment }),
	createComment: linear.input(LinearMethodInputs.createComment).output(LinearMethodOutputs.createComment).meta({ ...write, description: descriptions.createComment }),
};

export type LinearServiceInputs = InferContractRouterInputs<typeof LinearServiceContract>;
export type LinearServiceOutputs = InferContractRouterOutputs<typeof LinearServiceContract>;
/** Cancellation is the only current per-call transport option. */
export type LinearServiceClientContext = Record<string, never>;
export type ILinearServiceContract = ContractRouterClient<typeof LinearServiceContract, LinearServiceClientContext>;
export type LinearServiceCallOptions = NonNullable<Parameters<ILinearServiceContract['getIssue']>[1]>;
export const LinearWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(LinearServiceContract).filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([name]) => name),
);

/** Compatibility exports for schema/tool consumers; metadata is derived from the procedures. */
function tool(name: LinearOperationName): ServiceTool {
	const { inputSchema, outputSchema, meta } = LinearServiceContract[name]['~orpc'];
	return {
		title: meta.title,
		description: meta.description,
		inputSchema: toJsonSchema(inputSchema!) as Record<string, unknown>,
		outputSchema: toJsonSchema(outputSchema!) as Record<string, unknown>,
		annotations: { readOnlyHint: meta.readOnlyHint, destructiveHint: meta.destructiveHint, supportsDryRun: meta.supportsDryRun },
	};
}
export const LinearTools = {
	getViewer: tool('getViewer'), listTeam: tool('listTeam'), listIssueState: tool('listIssueState'),
	listUser: tool('listUser'), listProject: tool('listProject'), listIssue: tool('listIssue'),
	getIssue: tool('getIssue'), createIssue: tool('createIssue'), updateIssue: tool('updateIssue'),
	listComment: tool('listComment'), createComment: tool('createComment'),
};

/** Static projection required by the current provider/catalog boundary. */
export const LinearStaticServiceContract = {
	methods: Object.fromEntries(Object.entries(LinearTools).map(([name, item]) => [name, {
		description: item.description, inputSchema: item.inputSchema, outputSchema: item.outputSchema,
	}])),
} satisfies ServiceContract;
