// Code generated from Tencent Docs API documentation. DO NOT EDIT.
import { z } from 'zod';

export const GeneralResponseSchema = z.object({
	ret: z.number().optional(),
	msg: z.string().optional(),
});
export type GeneralResponse = z.infer<typeof GeneralResponseSchema>;
