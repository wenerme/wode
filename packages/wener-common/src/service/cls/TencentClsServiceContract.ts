import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const cls = oc.$meta<ServiceToolMeta>({});
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

/** Topic IDs or names are resolved by the service provider before the CLS API request. */
export const TencentClsQueryInputSchema = z.strictObject({
	topic: z.array(z.string().trim().min(1)).min(1).max(20),
	query: z.string().min(1),
	from: z.number().int().min(0),
	to: z.number().int().min(0),
	limit: z.number().int().min(1).max(1000).optional(),
	sort: z.enum(['asc', 'desc']).optional(),
	/** CLS continuation token. */
	cursor: z.string().min(1).optional(),
	/** Whether the query contains a CLS SQL analysis clause. */
	sql: z.boolean().optional(),
}).refine((input) => input.to > input.from, { message: 'to must be greater than from' });

/** Stable CLS search envelope; result records and analysis columns remain dynamic JSON values. */
export const TencentClsQueryOutputSchema = z.looseObject({
	Context: z.string(),
	ListOver: z.boolean(),
	RequestId: z.string(),
	Analysis: z.boolean().optional(),
	Results: z.array(z.unknown()).nullable().optional(),
	ColNames: z.array(z.string()).nullable().optional(),
	AnalysisResults: z.array(z.unknown()).nullable().optional(),
	AnalysisRecords: z.array(z.unknown()).nullable().optional(),
	Columns: z.array(z.unknown()).nullable().optional(),
	SamplingRate: z.number().nullable().optional(),
	Topics: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const TencentClsListTopicInputSchema = z.strictObject({
	search: z.string().trim().min(1).optional(),
	limit: z.number().int().min(1).max(1000).optional(),
	offset: z.number().int().min(0).optional(),
}).default({});

/** Stable topic-list envelope; topic objects can gain CLS fields over time. */
export const TencentClsListTopicOutputSchema = z.looseObject({
	RequestId: z.string(),
	TotalCount: z.number().int().min(0),
	Topics: z.array(z.unknown()),
});

/** oRPC contract is the single source for CLS inputs, outputs and tool metadata. */
export const TencentClsServiceContract = {
	query: cls.input(TencentClsQueryInputSchema).output(TencentClsQueryOutputSchema).meta({
		...readOnlyTool,
		description: 'Search Tencent Cloud Log Service topics.',
	}),
	listTopic: cls.input(TencentClsListTopicInputSchema).output(TencentClsListTopicOutputSchema).meta({
		...readOnlyTool,
		description: 'List Tencent Cloud Log Service topics.',
	}),
};

export type TencentClsServiceInputs = InferContractRouterInputs<typeof TencentClsServiceContract>;
export type TencentClsServiceOutputs = InferContractRouterOutputs<typeof TencentClsServiceContract>;
export type TencentClsQueryInput = TencentClsServiceInputs['query'];
export type TencentClsListTopicInput = NonNullable<TencentClsServiceInputs['listTopic']>;

/** Native oRPC call options carry cancellation; CLS-specific transport settings use context. */
export type TencentClsServiceClientContext = { timeoutMs?: number };
export type ITencentClsServiceContract = ContractRouterClient<typeof TencentClsServiceContract, TencentClsServiceClientContext>;
export type TencentClsServiceCallOptions = NonNullable<Parameters<ITencentClsServiceContract['query']>[1]>;

export const TencentClsReadOnlyOperations: ReadonlySet<string> = new Set(
	Object.entries(TencentClsServiceContract)
		.filter(([, procedure]) => procedure['~orpc'].meta.readOnlyHint === true)
		.map(([name]) => name),
);
