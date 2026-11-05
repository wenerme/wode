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

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). See TencentClsContract.ts for the pattern this mirrors.
 */
export const GrafanaContract = {
	health: oc.input(GrafanaHealthInputSchema).output(GrafanaHealthOutputSchema).meta(readOnlyTool),
	whoAmI: oc.input(GrafanaWhoAmIInputSchema).output(GrafanaWhoAmIOutputSchema).meta(readOnlyTool),
	request: oc.input(GrafanaRequestInputSchema).output(GrafanaRequestOutputSchema).meta(requestTool),
};

/** Tool names that may perform a write; used by the client layer for read-only enforcement. */
export const GrafanaWriteOperations = new Set(['request']);
