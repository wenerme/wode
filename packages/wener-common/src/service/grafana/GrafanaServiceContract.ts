import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { isSafeGrafanaPath, type GrafanaPanel, type GrafanaRequestOptions } from '@wener/client/grafana';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const grafana = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const requestTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };
const dryRunWriteTool: ServiceToolMeta = { ...requestTool, supportsDryRun: true };
const identifier = z.string().trim().min(1);
const version = z.number().int().nonnegative();
// Zod deliberately omits own __proto__ keys while copying objects/records. Reject
// them before conversion so a requested edit cannot silently become a partial edit.
const rawObject = z.custom<Record<string, unknown>>((value) =>
	value !== null && typeof value === 'object' && !Array.isArray(value) && !Object.hasOwn(value, '__proto__'),
{ message: 'Grafana objects must not contain an own __proto__ key' });
const jsonObject = rawObject.pipe(z.record(z.string(), z.unknown()));

/** Stable classic panel fields; plugin options and nested collapsed rows are preserved. */
export const GrafanaPanelSchema: z.ZodType<GrafanaPanel> = z.lazy(() => rawObject.pipe(z.looseObject({
	id: z.number().int().nonnegative(),
	title: z.string().optional(),
	type: z.string().optional(),
	panels: z.array(GrafanaPanelSchema).optional(),
})));

/** This contract currently edits the classic model, not schema-v2 elements/layout. */
export const GrafanaDashboardModelSchema = rawObject.pipe(z.looseObject({
	uid: z.string().optional(),
	title: z.string().optional(),
	version: version.optional(),
	panels: z.array(GrafanaPanelSchema).optional(),
}));
export const GrafanaDashboardSummarySchema = z.object({
	uid: z.string().optional(),
	version: version.optional(),
	url: z.string().optional(),
});

export const GrafanaHealthInputSchema = z.strictObject({}).default({});
export const GrafanaHealthOutputSchema = z.looseObject({
	database: z.string().optional(), version: z.string().optional(), commit: z.string().optional(),
});
export const GrafanaWhoamiInputSchema = z.strictObject({}).default({});
export const GrafanaWhoamiOutputSchema = z.looseObject({
	id: z.number().int().optional(), login: z.string().optional(), email: z.string().optional(),
	name: z.string().optional(), isGrafanaAdmin: z.boolean().optional(), orgId: z.number().int().optional(),
});

const paramValue = z.union([z.string(), z.array(z.string())]);
export const GrafanaRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048).refine(isSafeGrafanaPath, { message: 'Invalid Grafana request path' }),
	method: z.enum(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
	params: z.record(z.string(), paramValue).optional(),
	// Explicitly enumerate the JSON domain so the shared exporter does not emit a
	// typeless nullable schema for an optional unknown value.
	body: z.unknown().optional().meta({ type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }),
});
/** A generic HTTP request can return any JSON value. Domain operations have explicit outputs. */
export const GrafanaRequestOutputSchema = z.unknown();

export const GrafanaDashboardSearchHitSchema = z.looseObject({
	uid: z.string().refine((value) => value.trim().length > 0, { message: 'Invalid Grafana dashboard uid' }),
	id: z.number().int().optional(),
	title: z.string().optional(), url: z.string().optional(), type: z.string().optional(),
	folderUid: z.string().optional(), folderTitle: z.string().optional(), tags: z.array(z.string()).optional(),
});
export const GrafanaListDashboardInputSchema = z.strictObject({
	query: z.string().optional(),
	tag: z.array(z.string()).optional(),
	folderUid: identifier.optional(),
	limit: z.number().int().min(1).max(500).optional().describe('Page size; this is not an all-pages operation.'),
	page: z.number().int().min(1).optional().describe('Classic search page, starting at 1.'),
}).default({});
export const GrafanaListDashboardOutputSchema = z.array(GrafanaDashboardSearchHitSchema);
export const GrafanaGetDashboardInputSchema = z.strictObject({ uid: identifier });
export const GrafanaGetDashboardOutputSchema = z.looseObject({
	dashboard: GrafanaDashboardModelSchema,
	meta: jsonObject.optional(),
});

export const GrafanaUpdateDashboardInputSchema = z.strictObject({
	dashboard: GrafanaDashboardModelSchema,
	folderUid: identifier.optional(),
	message: z.string().max(500).optional(),
	overwrite: z.boolean().optional(),
	expectedVersion: version.optional().describe('Classic numeric version precondition; incompatible with overwrite.'),
	dryRun: z.boolean().optional(),
}).refine((input) => input.expectedVersion === undefined || input.overwrite !== true, {
	message: 'expectedVersion cannot be used with overwrite',
});
export const GrafanaSaveDashboardResultSchema = z.looseObject({
	uid: z.string().optional(), url: z.string().optional(), status: z.string().optional(),
	id: z.number().int().optional(), version: version.optional(), dryRun: z.literal(false).optional(),
});
export const GrafanaDashboardPreviewSchema = z.looseObject({
	dryRun: z.literal(true),
	changed: z.literal(true).describe('A save is planned; no comparison with the remote dashboard was performed.'),
	compared: z.literal(false),
	dashboard: GrafanaDashboardModelSchema,
	folderUid: z.string().optional(), message: z.string().optional(), overwrite: z.boolean(),
});
export const GrafanaUpdateDashboardOutputSchema = z.union([GrafanaDashboardPreviewSchema, GrafanaSaveDashboardResultSchema]);

export const GrafanaListPanelInputSchema = z.strictObject({ dashboardUid: identifier });
export const GrafanaListPanelOutputSchema = z.array(GrafanaPanelSchema);
export const GrafanaGetPanelInputSchema = z.strictObject({ dashboardUid: identifier, panelId: z.number().int().nonnegative() });
export const GrafanaGetPanelOutputSchema = GrafanaPanelSchema;

const patchBase = {
	dashboardUid: identifier,
	panelId: z.number().int().nonnegative(),
	message: z.string().max(500).optional(),
	expectedVersion: version.optional().describe('Requires the fetched classic dashboard to have this version before patching.'),
	dryRun: z.boolean().optional(),
};
/** The edit modes are mutually exclusive in both runtime validation and exported JSON Schema. */
export const GrafanaPatchPanelInputSchema = z.union([
	z.strictObject({ ...patchBase, set: jsonObject }),
	z.strictObject({ ...patchBase, merge: jsonObject }),
	z.strictObject({ ...patchBase, replace: GrafanaPanelSchema }),
]);
export const GrafanaPatchPanelOutputSchema = z.looseObject({
	changed: z.boolean(),
	panel: GrafanaPanelSchema,
	dashboard: GrafanaDashboardSummarySchema,
	dryRun: z.boolean().optional(),
});

/** oRPC contract is the source of truth for service types, tool schemas and annotations. */
export const GrafanaServiceContract = {
	health: grafana.input(GrafanaHealthInputSchema).output(GrafanaHealthOutputSchema).meta({ ...readOnlyTool, description: 'Check Grafana health.' }),
	whoami: grafana.input(GrafanaWhoamiInputSchema).output(GrafanaWhoamiOutputSchema).meta({ ...readOnlyTool, description: 'Read the authenticated Grafana user.' }),
	request: grafana.input(GrafanaRequestInputSchema).output(GrafanaRequestOutputSchema).meta({ ...requestTool, description: 'Call an authenticated Grafana API path. Non-read HTTP methods require a writable service.' }),
	listDashboard: grafana.input(GrafanaListDashboardInputSchema).output(GrafanaListDashboardOutputSchema).meta({ ...readOnlyTool, description: 'Search one page of classic dashboard summaries; use page to retrieve further results.' }),
	getDashboard: grafana.input(GrafanaGetDashboardInputSchema).output(GrafanaGetDashboardOutputSchema).meta({ ...readOnlyTool, description: 'Read a classic dashboard and its metadata by Grafana UID.' }),
	updateDashboard: grafana.input(GrafanaUpdateDashboardInputSchema).output(GrafanaUpdateDashboardOutputSchema).meta({ ...dryRunWriteTool, description: 'Create or update a classic dashboard. dryRun previews the payload locally without comparing or saving remotely.' }),
	listPanel: grafana.input(GrafanaListPanelInputSchema).output(GrafanaListPanelOutputSchema).meta({ ...readOnlyTool, description: 'List classic panels, including rows and panels nested in collapsed rows.' }),
	getPanel: grafana.input(GrafanaGetPanelInputSchema).output(GrafanaGetPanelOutputSchema).meta({ ...readOnlyTool, description: 'Read one classic panel by dashboard UID and numeric panel ID.' }),
	patchPanel: grafana.input(GrafanaPatchPanelInputSchema).output(GrafanaPatchPanelOutputSchema).meta({ ...dryRunWriteTool, description: 'Patch one classic panel using exactly one of set, merge or replace. dryRun reads and computes changes without saving.' }),
};

export type GrafanaServiceInputs = InferContractRouterInputs<typeof GrafanaServiceContract>;
export type GrafanaServiceOutputs = InferContractRouterOutputs<typeof GrafanaServiceContract>;
export type GrafanaListDashboardInput = NonNullable<GrafanaServiceInputs['listDashboard']>;
export type GrafanaGetDashboardInput = GrafanaServiceInputs['getDashboard'];
export type GrafanaUpdateDashboardInput = GrafanaServiceInputs['updateDashboard'];
export type GrafanaListPanelInput = GrafanaServiceInputs['listPanel'];
export type GrafanaGetPanelInput = GrafanaServiceInputs['getPanel'];
export type GrafanaPatchPanelInput = GrafanaServiceInputs['patchPanel'];

/** Per-call transport settings use oRPC's client context; cancellation uses options.signal. */
export type GrafanaServiceClientContext = Pick<GrafanaRequestOptions, 'timeoutMs'>;
export type IGrafanaServiceContract = ContractRouterClient<typeof GrafanaServiceContract, GrafanaServiceClientContext>;
export type GrafanaServiceCallOptions = NonNullable<Parameters<IGrafanaServiceContract['getDashboard']>[1]>;

/** Derived from contract metadata so new mutation tools cannot silently escape the guard. */
export const GrafanaWriteOperations: ReadonlySet<string> = new Set(
	Object.entries(GrafanaServiceContract).filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint !== true).map(([name]) => name),
);
