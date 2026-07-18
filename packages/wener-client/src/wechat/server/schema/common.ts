// Code generated from WeChat API documentation. DO NOT EDIT.
import { z } from 'zod';

export const GeneralResponseSchema = z.object({
	errcode: z.number().optional(),
	errmsg: z.string().optional(),
});
export type GeneralResponse = z.infer<typeof GeneralResponseSchema>;
