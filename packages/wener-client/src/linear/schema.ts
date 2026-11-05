import { z } from 'zod/v4';

export const LinearEmptyInputSchema = z.object({});
export const LinearPageInfoSchema = z.object({
	hasNextPage: z.boolean(),
	endCursor: z.string().nullish(),
});
export const LinearPageInputSchema = z.object({
	first: z.number().int().min(1).max(100).default(50),
	after: z.string().min(1).optional(),
	includeArchived: z.boolean().default(false),
});
export const LinearUserSchema = z.object({
	id: z.string(), name: z.string(), displayName: z.string().nullish(),
	email: z.string().nullish(), active: z.boolean().nullish(),
});
export const LinearViewerSchema = LinearUserSchema;
export const LinearTeamSchema = z.object({
	id: z.string(), key: z.string(), name: z.string(), description: z.string().nullish(),
});
export const LinearIssueStateSchema = z.object({
	id: z.string(), name: z.string(), type: z.string(), color: z.string().nullish(), position: z.number().nullish(),
});
export const LinearProjectSchema = z.object({
	id: z.string(), name: z.string(), description: z.string().nullish(),
	status: z.object({ id: z.string(), name: z.string(), type: z.string(), color: z.string().nullish() }).nullish(),
	priority: z.number().nullish(), health: z.string().nullish(),
	startDate: z.string().nullish(), targetDate: z.string().nullish(),
	createdAt: z.string(), updatedAt: z.string(), url: z.string(),
	teams: z.object({ nodes: z.array(LinearTeamSchema) }),
});
export const LinearLabelSchema = z.object({ id: z.string(), name: z.string(), color: z.string().nullish() });
export const LinearIssueSchema = z.object({
	id: z.string(), identifier: z.string(), title: z.string(), description: z.string().nullish(), url: z.string(),
	branchName: z.string().nullish(), priority: z.number().int(), estimate: z.number().nullish(),
	dueDate: z.string().nullish(), createdAt: z.string(), updatedAt: z.string(),
	archivedAt: z.string().nullish(), completedAt: z.string().nullish(), canceledAt: z.string().nullish(),
	team: LinearTeamSchema, state: LinearIssueStateSchema.nullish(),
	assignee: LinearUserSchema.nullish(), creator: LinearUserSchema.nullish(),
	project: LinearProjectSchema.pick({ id: true, name: true }).nullish(),
	labels: z.object({ nodes: z.array(LinearLabelSchema) }),
});
export const LinearCommentSchema = z.object({
	id: z.string(), body: z.string(), createdAt: z.string(), updatedAt: z.string(), user: LinearUserSchema.nullish(),
});
export function linearConnectionSchema<T extends z.ZodType>(node: T) {
	return z.object({ nodes: z.array(node), pageInfo: LinearPageInfoSchema });
}

export const LinearListTeamInputSchema = LinearPageInputSchema;
export const LinearListIssueStateInputSchema = LinearPageInputSchema.omit({ includeArchived: true }).extend({
	teamId: z.string().min(1),
});
export const LinearListUserInputSchema = LinearPageInputSchema.extend({ query: z.string().trim().min(1).optional() });
export const LinearListProjectInputSchema = LinearPageInputSchema.extend({
	teamId: z.string().min(1).optional(), query: z.string().trim().min(1).optional(),
});
export const LinearListIssueInputSchema = LinearPageInputSchema.extend({
	teamId: z.string().min(1).optional(), assigneeId: z.string().min(1).optional(),
	projectId: z.string().min(1).optional(), stateId: z.string().min(1).optional(),
	query: z.string().trim().min(1).optional(), updatedAfter: z.string().datetime().optional(),
	filter: z.record(z.string(), z.json()).optional(),
});
export const LinearGetIssueInputSchema = z.object({ id: z.string().trim().min(1) });
export const LinearCreateIssueInputSchema = z.object({
	teamId: z.string().min(1), title: z.string().trim().min(1).max(512),
	description: z.string().max(100_000).optional(), stateId: z.string().min(1).optional(),
	assigneeId: z.string().min(1).optional(), projectId: z.string().min(1).optional(),
	priority: z.number().int().min(0).max(4).optional(), dueDate: z.string().date().optional(),
	labelIds: z.array(z.string().min(1)).max(100).optional(),
});
export const LinearUpdateIssueInputSchema = LinearCreateIssueInputSchema.omit({ teamId: true }).partial().extend({
	id: z.string().trim().min(1), assigneeId: z.string().min(1).nullish(),
	projectId: z.string().min(1).nullish(), dueDate: z.string().date().nullish(),
}).superRefine((value, context) => {
	if (Object.entries(value).every(([key, item]) => key === 'id' || item === undefined)) {
		context.addIssue({ code: 'custom', message: 'Linear issue update requires at least one change' });
	}
});
export const LinearListCommentInputSchema = LinearPageInputSchema.omit({ includeArchived: true }).extend({
	issueId: z.string().trim().min(1),
});
export const LinearCreateCommentInputSchema = z.object({
	issueId: z.string().trim().min(1), body: z.string().trim().min(1).max(100_000),
});
export const LinearTeamConnectionSchema = linearConnectionSchema(LinearTeamSchema);
export const LinearIssueStateConnectionSchema = linearConnectionSchema(LinearIssueStateSchema);
export const LinearUserConnectionSchema = linearConnectionSchema(LinearUserSchema);
export const LinearProjectConnectionSchema = linearConnectionSchema(LinearProjectSchema);
export const LinearIssueConnectionSchema = linearConnectionSchema(LinearIssueSchema);
export const LinearCommentConnectionSchema = linearConnectionSchema(LinearCommentSchema);

export type LinearViewer = z.output<typeof LinearViewerSchema>;
export type LinearTeam = z.output<typeof LinearTeamSchema>;
export type LinearIssueState = z.output<typeof LinearIssueStateSchema>;
export type LinearUser = z.output<typeof LinearUserSchema>;
export type LinearProject = z.output<typeof LinearProjectSchema>;
export type LinearIssue = z.output<typeof LinearIssueSchema>;
export type LinearComment = z.output<typeof LinearCommentSchema>;
export type LinearListTeamInput = z.input<typeof LinearListTeamInputSchema>;
export type LinearListIssueStateInput = z.input<typeof LinearListIssueStateInputSchema>;
export type LinearListUserInput = z.input<typeof LinearListUserInputSchema>;
export type LinearListProjectInput = z.input<typeof LinearListProjectInputSchema>;
export type LinearListIssueInput = z.input<typeof LinearListIssueInputSchema>;
export type LinearGetIssueInput = z.input<typeof LinearGetIssueInputSchema>;
export type LinearCreateIssueInput = z.input<typeof LinearCreateIssueInputSchema>;
export type LinearUpdateIssueInput = z.input<typeof LinearUpdateIssueInputSchema>;
export type LinearListCommentInput = z.input<typeof LinearListCommentInputSchema>;
export type LinearCreateCommentInput = z.input<typeof LinearCreateCommentInputSchema>;
export type LinearTeamConnection = z.output<typeof LinearTeamConnectionSchema>;
export type LinearIssueStateConnection = z.output<typeof LinearIssueStateConnectionSchema>;
export type LinearUserConnection = z.output<typeof LinearUserConnectionSchema>;
export type LinearProjectConnection = z.output<typeof LinearProjectConnectionSchema>;
export type LinearIssueConnection = z.output<typeof LinearIssueConnectionSchema>;
export type LinearCommentConnection = z.output<typeof LinearCommentConnectionSchema>;
