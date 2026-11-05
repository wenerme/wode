import { z } from 'zod';
import type { FetchRequest } from './IFetchService';

export type { FetchRequest, FetchResponse, IFetchService } from './IFetchService';

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
	main: z.boolean().optional(),
	metadata: z.boolean().optional(),
	raw: z.boolean().optional(),
});

export function parseFetchRequest(input: unknown): FetchRequest {
	const result = FetchRequestSchema.safeParse(input);
	if (!result.success) throw new TypeError('Invalid fetch request');
	return result.data;
}