import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

/**
 * Vendor-neutral field names. The provider (index.ts `create()`) is the sole place that
 * translates these into Tencent CLS's raw PascalCase wire fields (`Query`/`From`/`To`/
 * `SyntaxRule`/`Sort`/`Context`/`TopicId`/`Topics`) -- this contract and every other consumer
 * (CLI, tests, future API exposure) stay decoupled from the official SDK's naming.
 */
export const TencentClsQueryInputSchema = z.strictObject({
	/** Topic IDs or names; 1-20 entries. Mixed IDs and names are resolved against the CLS API. */
	topic: z.array(z.string().min(1)).min(1).max(20),
	/** CQL/SQL query expression. */
	query: z.string().min(1),
	/** Range start, Unix epoch milliseconds. */
	from: z.number().int().min(0),
	/** Range end, Unix epoch milliseconds. */
	to: z.number().int().min(0),
	limit: z.number().int().min(1).max(1000).optional(),
	sort: z.enum(['asc', 'desc']).optional(),
	/** Pagination cursor returned by a previous query. */
	cursor: z.string().min(1).optional(),
	/** Treat `query` as including a SQL analysis clause. */
	sql: z.boolean().optional(),
});
export const TencentClsQueryOutputSchema = z.unknown();

export const TencentClsListTopicInputSchema = z.strictObject({
	search: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(1000).optional(),
	offset: z.number().int().min(0).optional(),
});
export const TencentClsListTopicOutputSchema = z.unknown();

/**
 * oRPC contract-first definition: the single source of truth for input/output schemas and
 * MCP-style tool metadata (`.meta()`). This is not wired to a real oRPC router/handler yet --
 * no network boundary exists for this service today -- but `createServiceOperationFromContract`
 * (packages/wener-common/src/service/runtime/contract.ts) derives the local `ServiceOperation`
 * tool metadata from this contract, replacing the hand-rolled `ServiceTool` JSON Schema in
 * schema.ts. See packages/wener-common/src/fs/orpc/FileSystemContract.ts for the one existing
 * contract that *does* cross a real client/server boundary.
 */
export const TencentClsContract = {
	query: oc.input(TencentClsQueryInputSchema).output(TencentClsQueryOutputSchema).meta(readOnlyTool),
	listTopic: oc.input(TencentClsListTopicInputSchema).output(TencentClsListTopicOutputSchema).meta(readOnlyTool),
};
