import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

/** All three Lark operations are writes in this slice; there is no read-only query. */
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

export const LarkSendMessageInputSchema = z.strictObject({
	to: z.string().min(1),
	text: z.string().min(1).max(10_000),
});
export const LarkSendMessageOutputSchema = z.unknown();

/**
 * No `url`/`secret` fields here: the service never exposes webhook connection parameters to
 * callers -- `index.ts` resolves them from the service's own `webhookUrlEnv`/`webhookSecretEnv`
 * configuration, and the CLI layer (`cli/commands.ts`) never collects them.
 */
export const LarkSendWebhookInputSchema = z.strictObject({
	text: z.string().min(1).max(10_000).optional(),
	markdown: z.string().min(1).max(10_000).optional(),
});
export const LarkSendWebhookOutputSchema = z.unknown();

export const LarkRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048),
	method: z.string().min(1).max(16).optional(),
	params: z.record(z.string(), z.string()).optional(),
	body: z.unknown().optional(),
});
export const LarkRequestOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). `defineContractOperation`
 * (packages/wener-common/src/service/runtime/contract.ts) derives the local `ServiceOperation`
 * tool metadata from this contract.
 */
export const LarkWriteOperations = new Set(['sendMessage', 'sendWebhook', 'request']);

export const LarkContract = {
	sendMessage: oc.input(LarkSendMessageInputSchema).output(LarkSendMessageOutputSchema).meta(writeTool),
	sendWebhook: oc.input(LarkSendWebhookInputSchema).output(LarkSendWebhookOutputSchema).meta(writeTool),
	request: oc.input(LarkRequestInputSchema).output(LarkRequestOutputSchema).meta(writeTool),
};
