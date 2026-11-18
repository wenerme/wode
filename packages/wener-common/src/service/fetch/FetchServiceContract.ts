import {
	oc,
	type ContractRouterClient,
	type InferContractRouterInputs,
	type InferContractRouterOutputs,
} from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

/** A target URL is required; this capability has no input default. */
export const FetchRequestSchema = z.strictObject({
	url: z
		.string()
		.url()
		.refine((value) => {
			const url = new URL(value);
			return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
		}),
	text: z.boolean().optional(),
	summary: z.boolean().optional(),
	highlights: z.boolean().optional(),
	live: z.boolean().optional(),
	maxCharacters: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	/** Extract the main content; defaults to true in the provider. */
	main: z.boolean().optional(),
	/** Include provider metadata; presentation remains the caller's responsibility. */
	metadata: z.boolean().optional(),
	raw: z.boolean().optional(),
});

/** Normalized page content shared by direct, Jina and Exa providers. */
export const FetchResponseSchema = z.object({
	url: z.string(),
	/** Markdown or plain text, according to the fetched content and provider. */
	content: z.string(),
	contentType: z.string().optional(),
	title: z.string().optional(),
	summary: z.string().optional(),
	highlights: z.array(z.string()).optional(),
	description: z.string().optional(),
	publishedDate: z.string().optional(),
	author: z.string().optional(),
	/** Supplier metadata varies by provider; nested values remain unconstrained. */
	metadata: z.record(z.string(), z.unknown()).optional(),
	/** Opt-in original supplier response; no stable cross-provider raw shape exists. */
	raw: z.unknown().optional().meta({
		// All JSON values are valid. An explicit domain also lets the shared schema
		// exporter represent optional unknown without a typeless `nullable` keyword.
		type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
	}),
});

export const FetchServiceContract = {
	fetch: oc.input(FetchRequestSchema).output(FetchResponseSchema).meta(readOnlyTool),
};

export type FetchServiceInputs = InferContractRouterInputs<typeof FetchServiceContract>;
export type FetchServiceOutputs = InferContractRouterOutputs<typeof FetchServiceContract>;
export type FetchRequest = FetchServiceInputs['fetch'];
export type FetchResponse = FetchServiceOutputs['fetch'];

/** No per-call context settings; cancellation continues to use options.signal. */
export type FetchServiceClientContext = Record<string, never>;
export type IFetchServiceContract = ContractRouterClient<typeof FetchServiceContract, FetchServiceClientContext>;
export type FetchServiceCallOptions = NonNullable<Parameters<IFetchServiceContract['fetch']>[1]>;
