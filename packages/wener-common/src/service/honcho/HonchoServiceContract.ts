import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { isSafeHonchoPath } from '@wener/client/honcho';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const honcho = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };
const requestTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

const identifier = z.string().trim().min(1).max(512);
const text = z.string().refine((value) => value.trim().length > 0, { message: 'Text must not be empty' });
// Zod omits own __proto__ keys while copying records; reject them so input is never silently dropped.
const rawObject = z.custom<Record<string, unknown>>(
	(value) => value !== null && typeof value === 'object' && !Array.isArray(value) && !Object.hasOwn(value, '__proto__'),
	{ message: 'Honcho objects must not contain an own __proto__ key' },
);
const jsonObject = rawObject.pipe(z.record(z.string(), z.unknown()));
const workspace = { workspaceId: identifier.optional().describe('Workspace id; defaults to the configured workspaceId.') };
const pageInput = {
	size: z.number().int().min(1).max(100).optional().describe('Page size.'),
	page: z.number().int().min(1).optional().describe('Page number, starting at 1.'),
	filters: jsonObject.optional().describe('Honcho list filters.'),
};

/** Stable resource fields; supplier-specific fields are preserved. */
export const HonchoWorkspaceSchema = z.looseObject({
	id: z.string().optional(), metadata: jsonObject.optional(), configuration: jsonObject.optional(), created_at: z.string().optional(),
});
export const HonchoPeerSchema = z.looseObject({
	id: z.string().optional(), workspace_id: z.string().optional(), metadata: jsonObject.optional(),
	configuration: jsonObject.optional(), created_at: z.string().optional(),
});
export const HonchoSessionSchema = z.looseObject({
	id: z.string().optional(), workspace_id: z.string().optional(), is_active: z.boolean().optional(),
	metadata: jsonObject.optional(), configuration: jsonObject.optional(), created_at: z.string().optional(),
});
export const HonchoMessageSchema = z.looseObject({
	id: z.string().optional(), peer_id: z.string().optional(), session_id: z.string().optional(),
	content: z.string().optional(), metadata: jsonObject.optional(), created_at: z.string().optional(),
	token_count: z.number().optional(),
});
export const HonchoConclusionSchema = z.looseObject({
	id: z.string().optional(), content: z.string().optional(), observer_id: z.string().optional(),
	observed_id: z.string().optional(), session_id: z.string().optional(), created_at: z.string().optional(),
	distance: z.number().optional(),
});
export const HonchoSummarySchema = z.looseObject({
	content: z.string().optional(), summary_type: z.string().optional(), created_at: z.string().optional(),
	token_count: z.number().optional(),
});

function page<T extends z.ZodType>(item: T) {
	return z.looseObject({
		items: z.array(item),
		total: z.number().int().optional(), page: z.number().int().optional(),
		size: z.number().int().optional(), pages: z.number().int().optional(),
	});
}

export const HonchoRememberInputSchema = z.strictObject({
	...workspace,
	peerId: identifier.optional().describe('Author peer id; defaults to the configured peerId.'),
	sessionId: identifier,
	content: text,
	metadata: jsonObject.optional(),
});
export const HonchoRememberOutputSchema = HonchoMessageSchema;

export const HonchoQueryInputSchema = z.strictObject({
	...workspace,
	query: text,
	observerId: identifier.optional().describe('observer_id filter; defaults to the configured peerId.'),
	observedId: identifier.optional().describe('observed_id filter; defaults to the observer.'),
	sessionId: identifier.optional(),
	limit: z.number().int().min(1).max(100).optional().describe('Top K conclusions.'),
});
export const HonchoQueryOutputSchema = z.array(HonchoConclusionSchema);

export const HonchoChatInputSchema = z.strictObject({
	...workspace,
	query: text,
	observerId: identifier.optional().describe('Observer peer id; defaults to the configured peerId.'),
	target: identifier.optional().describe('Observed peer id; defaults to the observer.'),
	sessionId: identifier.optional(),
	reasoningLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional(),
});
export const HonchoChatOutputSchema = z.looseObject({ content: z.string() });

export const HonchoListWorkspaceInputSchema = z.strictObject(pageInput).default({});
export const HonchoListWorkspaceOutputSchema = page(HonchoWorkspaceSchema);
const createResource = { metadata: jsonObject.optional(), configuration: jsonObject.optional() };
export const HonchoCreateWorkspaceInputSchema = z.strictObject({ id: identifier.optional(), ...createResource }).default({});
export const HonchoCreateWorkspaceOutputSchema = HonchoWorkspaceSchema;

export const HonchoListPeerInputSchema = z.strictObject({ ...workspace, ...pageInput }).default({});
export const HonchoListPeerOutputSchema = page(HonchoPeerSchema);
export const HonchoCreatePeerInputSchema = z.strictObject({ ...workspace, id: identifier, ...createResource });
export const HonchoCreatePeerOutputSchema = HonchoPeerSchema;

export const HonchoListSessionInputSchema = z.strictObject({ ...workspace, ...pageInput }).default({});
export const HonchoListSessionOutputSchema = page(HonchoSessionSchema);
export const HonchoCreateSessionInputSchema = z.strictObject({
	...workspace, id: identifier, ...createResource,
	peers: z.array(identifier).max(100).optional().describe('Peer ids to attach to the session.'),
});
export const HonchoCreateSessionOutputSchema = HonchoSessionSchema;

export const HonchoListMessageInputSchema = z.strictObject({ ...workspace, sessionId: identifier, ...pageInput });
export const HonchoListMessageOutputSchema = page(HonchoMessageSchema);

export const HonchoGetSessionSummaryInputSchema = z.strictObject({ ...workspace, sessionId: identifier });
export const HonchoGetSessionSummaryOutputSchema = z.looseObject({
	id: z.string().optional(),
	short_summary: HonchoSummarySchema.nullable().optional(),
	long_summary: HonchoSummarySchema.nullable().optional(),
});
export const HonchoGetSessionContextInputSchema = z.strictObject({
	...workspace, sessionId: identifier,
	tokens: z.number().int().min(1).max(1_000_000).optional().describe('Context token budget.'),
	summary: z.boolean().optional().describe('Include the session summary; defaults to true.'),
});
export const HonchoGetSessionContextOutputSchema = z.looseObject({
	id: z.string().optional(),
	messages: z.array(HonchoMessageSchema).optional(),
	summary: HonchoSummarySchema.nullable().optional(),
	peer_representation: z.string().nullable().optional(),
	peer_card: z.array(z.string()).nullable().optional(),
});

export const HonchoSystemStatusInputSchema = z.strictObject(workspace).default({});
export const HonchoSystemStatusOutputSchema = z.looseObject({
	total_work_units: z.number().optional(), completed_work_units: z.number().optional(),
	in_progress_work_units: z.number().optional(), pending_work_units: z.number().optional(),
});

export const HonchoRequestMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const HonchoRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048).refine(isSafeHonchoPath, { message: 'Invalid Honcho request path' })
		.describe('Path relative to the API prefix, for example /workspaces/list.'),
	method: z.enum(HonchoRequestMethods).optional(),
	query: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
	body: z.unknown().optional().meta({ type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }),
}).superRefine((input, context) => {
	if (input.body !== undefined && (input.method === 'GET' || input.method === 'HEAD'))
		context.addIssue({ code: 'custom', path: ['body'], message: 'body cannot be used with GET or HEAD' });
});
/** A generic request can return any JSON value; domain operations have explicit outputs. */
export const HonchoRequestOutputSchema = z.unknown();

/** oRPC contract is the source of truth for service types, tool schemas and annotations. */
export const HonchoServiceContract = {
	remember: honcho.input(HonchoRememberInputSchema).output(HonchoRememberOutputSchema).meta({ ...writeTool, description: 'Append one message to a Honcho session.' }),
	query: honcho.input(HonchoQueryInputSchema).output(HonchoQueryOutputSchema).meta({ ...readOnlyTool, description: 'Semantic search over Honcho conclusions.' }),
	chat: honcho.input(HonchoChatInputSchema).output(HonchoChatOutputSchema).meta({ ...readOnlyTool, description: 'Ask the Honcho dialectic chat about a peer.' }),
	listWorkspace: honcho.input(HonchoListWorkspaceInputSchema).output(HonchoListWorkspaceOutputSchema).meta({ ...readOnlyTool, description: 'List one page of workspaces; usually requires an admin key.' }),
	createWorkspace: honcho.input(HonchoCreateWorkspaceInputSchema).output(HonchoCreateWorkspaceOutputSchema).meta({ ...writeTool, description: 'Get or create a workspace; usually requires an admin key.' }),
	listPeer: honcho.input(HonchoListPeerInputSchema).output(HonchoListPeerOutputSchema).meta({ ...readOnlyTool, description: 'List one page of peers in a workspace.' }),
	createPeer: honcho.input(HonchoCreatePeerInputSchema).output(HonchoCreatePeerOutputSchema).meta({ ...writeTool, description: 'Get or create a peer in a workspace.' }),
	listSession: honcho.input(HonchoListSessionInputSchema).output(HonchoListSessionOutputSchema).meta({ ...readOnlyTool, description: 'List one page of sessions in a workspace.' }),
	createSession: honcho.input(HonchoCreateSessionInputSchema).output(HonchoCreateSessionOutputSchema).meta({ ...writeTool, description: 'Get or create a session, optionally attaching peers.' }),
	listMessage: honcho.input(HonchoListMessageInputSchema).output(HonchoListMessageOutputSchema).meta({ ...readOnlyTool, description: 'List one page of messages in a session.' }),
	getSessionSummary: honcho.input(HonchoGetSessionSummaryInputSchema).output(HonchoGetSessionSummaryOutputSchema).meta({ ...readOnlyTool, description: 'Read the short and long summaries of a session.' }),
	getSessionContext: honcho.input(HonchoGetSessionContextInputSchema).output(HonchoGetSessionContextOutputSchema).meta({ ...readOnlyTool, description: 'Read token-bounded session context with optional summary.' }),
	systemStatus: honcho.input(HonchoSystemStatusInputSchema).output(HonchoSystemStatusOutputSchema).meta({ ...readOnlyTool, description: 'Read the workspace deriver queue status.' }),
	request: honcho.input(HonchoRequestInputSchema).output(HonchoRequestOutputSchema).meta({ ...requestTool, description: 'Call a raw Honcho API path. Always requires a writable service, including GET.' }),
};

export type HonchoServiceInputs = InferContractRouterInputs<typeof HonchoServiceContract>;
export type HonchoServiceOutputs = InferContractRouterOutputs<typeof HonchoServiceContract>;

/** Per-call transport settings use oRPC's client context; cancellation uses options.signal. */
export type HonchoServiceClientContext = { timeoutMs?: number };
export type IHonchoServiceContract = ContractRouterClient<typeof HonchoServiceContract, HonchoServiceClientContext>;
export type HonchoServiceCallOptions = NonNullable<Parameters<IHonchoServiceContract['query']>[1]>;

/** Derived from contract metadata so new mutation tools cannot silently escape the guard. */
export const HonchoWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(HonchoServiceContract).filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([name]) => name),
);

export function isHonchoWriteMethod(method: string): boolean {
	return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
