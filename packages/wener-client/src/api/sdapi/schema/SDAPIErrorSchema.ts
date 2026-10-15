import { z } from 'zod';

export const SDAPIErrorSchema = z.looseObject({
	detail: z.unknown().optional(),
	error: z.string().optional(),
	errors: z.unknown().optional(),
	body: z.unknown().optional(),
});

export type SDAPIError = z.infer<typeof SDAPIErrorSchema>;
