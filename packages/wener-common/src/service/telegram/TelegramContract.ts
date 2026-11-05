import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };
/**
 * `request` is a generic Telegram Bot API passthrough -- the actual method is only known at
 * call time, so the contract's static `.meta()` conservatively marks it as a potential write.
 * Runtime read-only enforcement (`isTelegramWriteMethod`) lives in the service layer, not here.
 */
const requestTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

const METHOD_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/u;

export const TelegramGetMeInputSchema = z.strictObject({});
export const TelegramGetMeOutputSchema = z.unknown();

export const TelegramSendMessageInputSchema = z.strictObject({
	chatId: z.union([z.string().min(1), z.number()]),
	text: z.string().min(1).max(4096),
	parseMode: z.string().min(1).optional(),
	disableNotification: z.boolean().optional(),
	replyToMessageId: z.number().int().min(1).optional(),
});
export const TelegramSendMessageOutputSchema = z.unknown();

export const TelegramRequestInputSchema = z.strictObject({
	method: z.string().min(1).max(64).regex(METHOD_PATTERN, { message: 'Invalid Telegram request method' }),
	params: z.record(z.string(), z.unknown()).optional(),
});
export const TelegramRequestOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). See TencentClsContract.ts for the pattern this mirrors.
 */
export const TelegramContract = {
	getMe: oc.input(TelegramGetMeInputSchema).output(TelegramGetMeOutputSchema).meta(readOnlyTool),
	sendMessage: oc.input(TelegramSendMessageInputSchema).output(TelegramSendMessageOutputSchema).meta(writeTool),
	request: oc.input(TelegramRequestInputSchema).output(TelegramRequestOutputSchema).meta(requestTool),
};

/**
 * Tool names that may perform a write; used by the client layer for read-only enforcement.
 * `request` is intentionally excluded here -- whether a given `request` method is a write is
 * decided by the Telegram read-only method allowlist in the service layer, not at this
 * tool-level gate (unlike Grafana's generic HTTP `request`, which has no such allowlist).
 */
export const TelegramWriteOperations = new Set(['sendMessage']);
