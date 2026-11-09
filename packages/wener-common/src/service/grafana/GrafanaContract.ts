import { oc } from '@orpc/contract';
import { isSafeGrafanaPath } from '@wener/client/grafana';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
/**
 * `request` is a generic HTTP passthrough -- the actual method is only known at call time, so
 * the contract's static `.meta()` conservatively marks it as a potential write. Runtime
 * read-only enforcement (`isGrafanaWriteMethod`) lives in the service/client layer, not here.
 */
const requestTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };
/** Writes that accept an opt-in `dryRun: true` preview, bypassing the read-only guard for that case only. */
const dryRunWriteTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true, supportsDryRun: true };

export const GrafanaHealthInputSchema = z.strictObject({});
export const GrafanaHealthOutputSchema = z.unknown();

export const GrafanaWhoAmIInputSchema = z.strictObject({});
export const GrafanaWhoAmIOutputSchema = z.unknown();

const paramValue = z.union([z.string(), z.array(z.string())]);
export const GrafanaRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048).refine(isSafeGrafanaPath, { message: 'Invalid Grafana request path' }),
	method: z.enum(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
	params: z.record(z.string(), paramValue).optional(),
	body: z.unknown().optional(),
});
export const GrafanaRequestOutputSchema = z.unknown();

export const GrafanaListDashboardInputSchema = z.strictObject({
	query: z.string().optional(),
	tag: z.array(z.string()).optional(),
	folderUid: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(500).optional(),
});
export const GrafanaListDashboardOutputSchema = z.unknown();

export const GrafanaGetDashboardInputSchema = z.strictObject({
	uid: z.string().min(1),
});
export const GrafanaGetDashboardOutputSchema = z.unknown();

export const GrafanaUpdateDashboardInputSchema = z.strictObject({
	dashboard: z.unknown(),
	folderUid: z.string().min(1).optional(),
	message: z.string().max(500).optional(),
	overwrite: z.boolean().optional(),
	dryRun: z.boolean().optional(),
});
export const GrafanaUpdateDashboardOutputSchema = z.unknown();

export const GrafanaGetPanelInputSchema = z.strictObject({
	dashboardUid: z.string().min(1),
	panelId: z.number().int(),
});
export const GrafanaGetPanelOutputSchema = z.unknown();

export const GrafanaPatchPanelInputSchema = z.strictObject({
	dashboardUid: z.string().min(1),
	panelId: z.number().int(),
	set: z.record(z.string(), z.unknown()).optional(),
	merge: z.record(z.string(), z.unknown()).optional(),
	replace: z.unknown().optional(),
	message: z.string().max(500).optional(),
	dryRun: z.boolean().optional(),
});
export const GrafanaPatchPanelOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). See TencentClsContract.ts for the pattern this mirrors.
 */
export const GrafanaContract = {
	health: oc.input(GrafanaHealthInputSchema).output(GrafanaHealthOutputSchema).meta(readOnlyTool),
	whoAmI: oc.input(GrafanaWhoAmIInputSchema).output(GrafanaWhoAmIOutputSchema).meta(readOnlyTool),
	request: oc.input(GrafanaRequestInputSchema).output(GrafanaRequestOutputSchema).meta(requestTool),
	listDashboard: oc.input(GrafanaListDashboardInputSchema).output(GrafanaListDashboardOutputSchema).meta(readOnlyTool),
	getDashboard: oc.input(GrafanaGetDashboardInputSchema).output(GrafanaGetDashboardOutputSchema).meta(readOnlyTool),
	updateDashboard: oc.input(GrafanaUpdateDashboardInputSchema).output(GrafanaUpdateDashboardOutputSchema).meta(dryRunWriteTool),
	getPanel: oc.input(GrafanaGetPanelInputSchema).output(GrafanaGetPanelOutputSchema).meta(readOnlyTool),
	patchPanel: oc.input(GrafanaPatchPanelInputSchema).output(GrafanaPatchPanelOutputSchema).meta(dryRunWriteTool),
};

/** Tool names that may perform a write; used by the client layer for read-only enforcement. */
export const GrafanaWriteOperations = new Set(['request', 'updateDashboard', 'patchPanel']);
